"""
LangChain observability adapter.

Wraps LangChain/LangGraph runnables with:
  - Langfuse CallbackHandler for trace capture
  - Control-plane run reporting and scoring via BaseConnector
"""
from __future__ import annotations

import time
import uuid
from typing import Any, Dict, Optional

from observability.connector import BaseConnector
from observability.schemas import (
    AgentRunReport,
    Framework,
    LLMJudgeConfig,
    RunStatus,
)


class LangChainObservabilityAdapter(BaseConnector):
    """
    Lightweight adapter for LangChain-compatible runnables.

    Usage::

        observer = LangChainObservabilityAdapter(
            agent_name="my_agent",
            evaluators=["llm_judge"],
            llm_judge_dimensions=["accuracy"],
            llm_judge_model="gpt-4o-mini",
        )
        result = await observer.ainvoke(llm, messages, metadata={...})
    """

    def __init__(
        self,
        agent_name: str,
        description: str = "",
        version: str = "1.0.0",
        evaluators: Optional[list[str]] = None,
        llm_judge_dimensions: Optional[list[str]] = None,
        llm_judge_model: Optional[str] = None,
        control_plane_url: Optional[str] = None,
        enabled: Optional[bool] = None,
    ) -> None:
        llm_judge_config = None
        if llm_judge_dimensions or llm_judge_model:
            llm_judge_config = LLMJudgeConfig(
                dimensions=llm_judge_dimensions or [],
                model=llm_judge_model,
            )

        self.agent_name = agent_name
        self._callback_handler = None

        super().__init__(
            name=agent_name,
            description=description,
            framework=Framework.LANGCHAIN,
            version=version,
            evaluators=evaluators or [],
            llm_judge_config=llm_judge_config,
            control_plane_url=control_plane_url,
            enabled=enabled,
        )

    # ------------------------------------------------------------------
    # Tracing setup (called by BaseConnector.__init__)
    # ------------------------------------------------------------------

    def _setup_tracing(self) -> None:
        try:
            try:
                from langfuse.callback import CallbackHandler
            except Exception:
                from langfuse.langchain import CallbackHandler  # type: ignore
            self._callback_handler = CallbackHandler()
        except Exception:
            self._callback_handler = None

    # ------------------------------------------------------------------
    # LangChain-specific helpers
    # ------------------------------------------------------------------

    def _extract_trace_id(self) -> str:
        if self._callback_handler:
            # Langfuse v3 exposes last_trace_id after each invocation
            for attr in ("last_trace_id", "get_trace_id"):
                try:
                    value = getattr(self._callback_handler, attr, None)
                    if callable(value):
                        value = value()
                    if value:
                        candidate = str(value).strip()
                        if candidate and candidate != "None":
                            # Normalise UUID dashes (Langfuse stores without dashes)
                            if len(candidate) == 36 and candidate.count("-") == 4:
                                candidate = candidate.replace("-", "")
                            return candidate
                except Exception:
                    pass
        return str(uuid.uuid4())

    @staticmethod
    def _extract_token_usage(output: Any) -> Dict[str, int]:
        """Extract token counts from a LangChain AIMessage response."""
        usage: Dict[str, int] = {}
        if output is None:
            return usage
        um = getattr(output, "usage_metadata", None)
        if um and isinstance(um, dict):
            usage["input_tokens"] = int(um.get("input_tokens") or 0)
            usage["output_tokens"] = int(um.get("output_tokens") or 0)
            usage["total_tokens"] = int(um.get("total_tokens") or 0)
        return usage

    @staticmethod
    def _coerce_jsonable(value: Any) -> Any:
        """Best-effort conversion for JSON payload safety."""
        if value is None:
            return None
        if isinstance(value, (str, int, float, bool)):
            return value
        if isinstance(value, dict):
            return {str(k): LangChainObservabilityAdapter._coerce_jsonable(v) for k, v in value.items()}
        if isinstance(value, (list, tuple, set)):
            return [LangChainObservabilityAdapter._coerce_jsonable(v) for v in value]
        if hasattr(value, "model_dump"):
            try:
                return LangChainObservabilityAdapter._coerce_jsonable(value.model_dump())
            except Exception:
                pass
        if hasattr(value, "content"):
            try:
                return {
                    "content": LangChainObservabilityAdapter._coerce_jsonable(value.content),
                    "type": value.__class__.__name__,
                }
            except Exception:
                pass
        return str(value)

    def _build_config(
        self,
        callbacks: list,
        config: Optional[dict],
        metadata: Optional[Dict[str, Any]],
    ) -> dict:
        """Merge Langfuse callback + agent metadata into a LangChain config."""
        config = dict(config or {})
        if self._callback_handler:
            existing = config.get("callbacks", [])
            config["callbacks"] = [self._callback_handler] + list(existing) + list(callbacks)
        elif callbacks:
            existing = config.get("callbacks", [])
            config["callbacks"] = list(callbacks) + list(existing)

        meta = dict(config.get("metadata") or {})
        meta["agent_name"] = self.agent_name
        if metadata:
            meta.update(metadata)
        config["metadata"] = meta
        config.setdefault("run_name", self.agent_name)
        return config

    # ------------------------------------------------------------------
    # Public invoke / ainvoke
    # ------------------------------------------------------------------

    async def ainvoke(
        self,
        runnable: Any,
        input_data: Any,
        *,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Any:
        start = time.perf_counter()
        status = RunStatus.COMPLETED
        output: Any = None
        error: Optional[str] = None

        callbacks = kwargs.pop("callbacks", [])
        config = self._build_config(callbacks, kwargs.pop("config", None), metadata)

        try:
            output = await runnable.ainvoke(input_data, config=config, **kwargs)
            return output
        except Exception as exc:
            status = RunStatus.FAILED
            error = str(exc)
            raise
        finally:
            run_metadata = dict(metadata or {})
            run_metadata.update(self._extract_token_usage(output))
            report = AgentRunReport(
                agent_name=self.agent_name,
                trace_id=self._extract_trace_id(),
                input=self._coerce_jsonable(input_data),
                output=self._coerce_jsonable(output),
                status=status,
                latency_ms=(time.perf_counter() - start) * 1000,
                error=error,
                metadata=self._coerce_jsonable(run_metadata),
            )
            await self._report_run_async(report)

    def invoke(
        self,
        runnable: Any,
        input_data: Any,
        *,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Any:
        start = time.perf_counter()
        status = RunStatus.COMPLETED
        output: Any = None
        error: Optional[str] = None

        callbacks = kwargs.pop("callbacks", [])
        config = self._build_config(callbacks, kwargs.pop("config", None), metadata)

        try:
            output = runnable.invoke(input_data, config=config, **kwargs)
            return output
        except Exception as exc:
            status = RunStatus.FAILED
            error = str(exc)
            raise
        finally:
            run_metadata = dict(metadata or {})
            run_metadata.update(self._extract_token_usage(output))
            report = AgentRunReport(
                agent_name=self.agent_name,
                trace_id=self._extract_trace_id(),
                input=self._coerce_jsonable(input_data),
                output=self._coerce_jsonable(output),
                status=status,
                latency_ms=(time.perf_counter() - start) * 1000,
                error=error,
                metadata=self._coerce_jsonable(run_metadata),
            )
            self._report_run(report)
