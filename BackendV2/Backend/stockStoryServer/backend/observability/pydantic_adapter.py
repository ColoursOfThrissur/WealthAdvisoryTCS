"""
PydanticAI observability adapter.

Wraps PydanticAI agents with:
  - Langfuse OTEL tracing via Agent.instrument_all()
  - Control-plane run reporting and scoring via BaseConnector
  - Turn counting and internal step estimation

Trace-ID strategy
-----------------
PydanticAI creates its own OTEL root span for every agent run, which Langfuse
uses as the canonical trace (with proper name, input, output).  We must NOT
create a wrapper span on top of it — that breaks the trace display.

Instead we register a custom OTEL SpanProcessor that fires on_end() for every
root span (a span with no parent).  By the time `await agent.run()` returns,
PydanticAI's root span has already ended and the processor has captured its
trace_id.  We then report that id to the control plane so the cost lookup works.
"""
from __future__ import annotations

import os
import threading
import time
import uuid
from typing import Any

from observability.connector import BaseConnector
from observability.schemas import AgentRunReport, Framework, RunStatus


# ---------------------------------------------------------------------------
# OTEL root-span trace-ID capture helpers
# ---------------------------------------------------------------------------

class _RootSpanCapture:
    """Thread-safe buffer for the most recent root OTEL span trace IDs."""

    def __init__(self) -> None:
        self._ids: list[str] = []
        self._lock = threading.Lock()

    def capture(self, trace_id_hex: str) -> None:
        with self._lock:
            self._ids.append(trace_id_hex)

    def pop(self) -> str | None:
        with self._lock:
            return self._ids.pop() if self._ids else None


class _RootSpanProcessor:
    """OTEL SpanProcessor that captures root-span trace IDs."""

    def __init__(self, capture: _RootSpanCapture) -> None:
        self._capture = capture

    def on_start(self, span: Any, parent_context: Any = None) -> None:
        pass

    def on_end(self, span: Any) -> None:
        # Only care about root spans (no parent) so we get one ID per agent run
        if getattr(span, "parent", None) is not None:
            return
        try:
            ctx = span.get_span_context()
            if ctx.is_valid and ctx.trace_id:
                self._capture.capture(format(ctx.trace_id, "032x"))
        except Exception:
            pass

    def shutdown(self) -> None:
        pass

    def force_flush(self, timeout_millis: int = 30_000) -> bool:
        return True


# ---------------------------------------------------------------------------
# Adapter
# ---------------------------------------------------------------------------

class PydanticAIAdapter(BaseConnector):
    """
    Lightweight adapter for PydanticAI agents.

    Usage::

        adapter = PydanticAIAdapter(
            agent=planner_agent,
            name="financial_planner",
            evaluators=["llm_judge"],
        )
        result = await adapter.run(prompt, deps=deps, message_history=history)
    """

    def __init__(
        self,
        agent: Any,
        name: str,
        description: str = "",
        version: str = "1.0.0",
        evaluators: list[str] | None = None,
        llm_judge_config: Any | None = None,
        control_plane_url: str | None = None,
        langfuse_public_key: str | None = None,
        langfuse_secret_key: str | None = None,
        langfuse_host: str | None = None,
        enabled: bool | None = None,
    ) -> None:
        self._agent = agent
        self._langfuse_public_key = langfuse_public_key
        self._langfuse_secret_key = langfuse_secret_key
        self._langfuse_host = langfuse_host
        self._trace_capture = _RootSpanCapture()
        super().__init__(
            name=name,
            description=description,
            framework=Framework.PYDANTIC_AI,
            version=version,
            evaluators=evaluators,
            llm_judge_config=llm_judge_config,
            control_plane_url=control_plane_url,
            enabled=enabled,
        )
        if self.enabled:
            self._register()

    # ------------------------------------------------------------------
    # Tracing setup
    # ------------------------------------------------------------------

    def _setup_tracing(self) -> None:
        if self._langfuse_public_key:
            os.environ["LANGFUSE_PUBLIC_KEY"] = self._langfuse_public_key
        if self._langfuse_secret_key:
            os.environ["LANGFUSE_SECRET_KEY"] = self._langfuse_secret_key
        if self._langfuse_host:
            os.environ["LANGFUSE_HOST"] = self._langfuse_host

        public_key = os.getenv("LANGFUSE_PUBLIC_KEY", "")
        secret_key = os.getenv("LANGFUSE_SECRET_KEY", "")
        host = os.getenv("LANGFUSE_HOST", "http://localhost:3000")

        if not public_key or not secret_key:
            print(
                "[PydanticAIAdapter] WARNING: LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY "
                "not set — traces will NOT appear in Langfuse."
            )
            return

        langfuse_sdk_ok = False
        try:
            from langfuse import get_client as _lf_get_client
            _lf_get_client()
            langfuse_sdk_ok = True
            print("[PydanticAIAdapter] Langfuse SDK OTEL pipeline initialised.")
        except ImportError:
            pass

        if not langfuse_sdk_ok:
            import base64
            token = base64.b64encode(f"{public_key}:{secret_key}".encode()).decode()
            otlp_endpoint = f"{host.rstrip('/')}/api/public/otel"
            os.environ.setdefault("OTEL_EXPORTER_OTLP_ENDPOINT", otlp_endpoint)
            os.environ.setdefault(
                "OTEL_EXPORTER_OTLP_HEADERS", f"Authorization=Basic {token}"
            )
            print(f"[PydanticAIAdapter] Manual OTEL endpoint set: {otlp_endpoint}")

        # Register our root-span capture processor so we can retrieve the
        # Langfuse trace_id after each agent run without creating a wrapper span.
        try:
            from opentelemetry import trace as otel_trace
            provider = otel_trace.get_tracer_provider()
            if hasattr(provider, "add_span_processor"):
                provider.add_span_processor(_RootSpanProcessor(self._trace_capture))
                print("[PydanticAIAdapter] Root-span trace-ID capture registered.")
        except Exception as exc:
            print(f"[PydanticAIAdapter] Could not register span processor: {exc}")

        try:
            from pydantic_ai.agent import Agent
            Agent.instrument_all()
            print("[PydanticAIAdapter] Agent.instrument_all() called successfully.")
        except ImportError as exc:
            print(f"[PydanticAIAdapter] WARNING: pydantic-ai not importable: {exc}")

    # ------------------------------------------------------------------
    # Internal step estimation helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_result_messages(result: Any) -> list[Any]:
        candidates: list[list[Any]] = []
        for accessor in ("all_messages", "new_messages"):
            attr = getattr(result, accessor, None)
            if callable(attr):
                try:
                    msgs = attr()
                    if isinstance(msgs, (list, tuple)):
                        candidates.append(list(msgs))
                except Exception:
                    pass
        for attr_name in ("_all_messages", "messages", "message_history", "_messages"):
            msgs = getattr(result, attr_name, None)
            if isinstance(msgs, (list, tuple)):
                candidates.append(list(msgs))
        return max(candidates, key=len) if candidates else []

    @classmethod
    def _estimate_internal_steps_from_result(cls, result: Any) -> int:
        messages = cls._extract_result_messages(result)
        if not messages:
            return 0

        model_responses = 0
        assistant_like = 0
        for msg in messages:
            role = str(getattr(msg, "role", "") or "").lower()
            name = msg.__class__.__name__.lower()
            if "modelresponse" in name:
                model_responses += 1
            if role in ("assistant", "model", "tool"):
                assistant_like += 1
            elif any(
                k in name for k in ("modelrequest", "modelresponse", "toolcall", "toolreturn")
            ):
                assistant_like += 1

        return model_responses if model_responses > 0 else assistant_like

    # ------------------------------------------------------------------
    # Public run / run_sync
    # ------------------------------------------------------------------

    async def run(self, prompt: str, **kwargs: Any) -> Any:
        start = time.perf_counter()
        status = RunStatus.COMPLETED
        output = None
        error = None
        trace_id = str(uuid.uuid4())
        metadata = kwargs.pop("metadata", {}) or {}

        message_history = kwargs.get("message_history")
        try:
            if isinstance(message_history, (list, tuple)):
                turns = sum(
                    1
                    for msg in message_history
                    if getattr(msg, "role", "") in ("user", "assistant")
                ) + 1
                metadata.setdefault("turns", turns)
                metadata.setdefault("base_turns", turns)
        except Exception:
            pass

        try:
            result = await self._agent.run(prompt, **kwargs)
            output = result.output if hasattr(result, "output") else str(result)

            # Capture the Langfuse trace ID from PydanticAI's native OTEL root span
            captured = self._trace_capture.pop()
            if captured:
                trace_id = captured

            try:
                deps = kwargs.get("deps")
                deps_steps = (
                    int(getattr(deps, "reasoning_steps", 0) or 0)
                    if deps is not None
                    else 0
                )
                tool_steps = 0
                if deps is not None:
                    tool_calls = getattr(deps, "tool_calls", None)
                    if isinstance(tool_calls, list):
                        tool_steps = len(tool_calls)
                result_steps = self._estimate_internal_steps_from_result(result)
                internal_steps = max(deps_steps, tool_steps, result_steps)

                base_turns = int(metadata.get("turns", 1) or 1)
                metadata["internal_reasoning_steps"] = internal_steps
                metadata["turns"] = base_turns + internal_steps
                metadata.setdefault("decision_turns", metadata["turns"])
            except Exception:
                pass
            return result
        except Exception as exc:
            status = RunStatus.FAILED
            error = str(exc)
            raise
        finally:
            latency_ms = (time.perf_counter() - start) * 1000
            report = AgentRunReport(
                agent_name=self.name,
                trace_id=trace_id,
                input=prompt,
                output=output,
                status=status,
                latency_ms=latency_ms,
                error=error,
                metadata=metadata,
            )
            await self._report_run_async(report)

    def run_sync(self, prompt: str, **kwargs: Any) -> Any:
        start = time.perf_counter()
        status = RunStatus.COMPLETED
        output = None
        error = None
        trace_id = str(uuid.uuid4())
        metadata = kwargs.pop("metadata", {}) or {}

        message_history = kwargs.get("message_history")
        try:
            if isinstance(message_history, (list, tuple)):
                turns = sum(
                    1
                    for msg in message_history
                    if getattr(msg, "role", "") in ("user", "assistant")
                ) + 1
                metadata.setdefault("turns", turns)
                metadata.setdefault("base_turns", turns)
        except Exception:
            pass

        try:
            result = self._agent.run_sync(prompt, **kwargs)
            output = result.output if hasattr(result, "output") else str(result)

            captured = self._trace_capture.pop()
            if captured:
                trace_id = captured

            try:
                deps = kwargs.get("deps")
                deps_steps = (
                    int(getattr(deps, "reasoning_steps", 0) or 0)
                    if deps is not None
                    else 0
                )
                tool_steps = 0
                if deps is not None:
                    tool_calls = getattr(deps, "tool_calls", None)
                    if isinstance(tool_calls, list):
                        tool_steps = len(tool_calls)
                result_steps = self._estimate_internal_steps_from_result(result)
                internal_steps = max(deps_steps, tool_steps, result_steps)

                base_turns = int(metadata.get("turns", 1) or 1)
                metadata["internal_reasoning_steps"] = internal_steps
                metadata["turns"] = base_turns + internal_steps
                metadata.setdefault("decision_turns", metadata["turns"])
            except Exception:
                pass
            return result
        except Exception as exc:
            status = RunStatus.FAILED
            error = str(exc)
            raise
        finally:
            latency_ms = (time.perf_counter() - start) * 1000
            report = AgentRunReport(
                agent_name=self.name,
                trace_id=trace_id,
                input=prompt,
                output=output,
                status=status,
                latency_ms=latency_ms,
                error=error,
                metadata=metadata,
            )
            self._report_run(report)
