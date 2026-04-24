from __future__ import annotations

import os
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

import httpx

from observability.schemas import (
    AgentRegistration,
    AgentRunReport,
    Framework,
    LLMJudgeConfig,
)


class BaseConnector(ABC):
    """
    Abstract base for framework-specific observability connectors.

    Handles agent registration, run reporting, and score posting to the
    control plane.  Subclasses implement ``_setup_tracing`` to configure
    framework-level instrumentation (e.g. Langfuse callbacks).
    """

    _latest_run_ids: Dict[str, str] = {}

    def __init__(
        self,
        name: str,
        description: str = "",
        framework: Framework = Framework.GENERIC,
        version: str = "1.0.0",
        evaluators: list[str] | None = None,
        llm_judge_config: LLMJudgeConfig | None = None,
        control_plane_url: str | None = None,
        enabled: bool | None = None,
    ) -> None:
        self.name = name
        self.description = description
        self.framework = framework
        self.version = version
        self.evaluators = evaluators or []
        self.llm_judge_config = llm_judge_config
        self.control_plane_url = (
            control_plane_url
            or os.getenv("CONTROL_PLANE_URL")
            or "http://localhost:8500"
        ).rstrip("/")
        self.enabled = (
            enabled
            if enabled is not None
            else os.getenv("OBSERVABILITY_ENABLED", "true").lower()
            not in ("0", "false", "no")
        )
        self.timeout_s = float(os.getenv("OBS_HTTP_TIMEOUT_SECONDS", "5"))
        self.last_run_id: Optional[str] = None

        if self.enabled:
            self._setup_tracing()
            self._register()

    @abstractmethod
    def _setup_tracing(self) -> None:
        """Configure framework-level tracing (e.g. Langfuse callback handler)."""

    def _register(self) -> None:
        registration = AgentRegistration(
            name=self.name,
            description=self.description,
            framework=self.framework,
            version=self.version,
            evaluators=self.evaluators,
            llm_judge_config=self.llm_judge_config,
        )
        try:
            with httpx.Client(timeout=self.timeout_s) as client:
                client.post(
                    f"{self.control_plane_url}/agents/register",
                    json=registration.model_dump(),
                )
        except Exception:
            pass

    def _report_run(self, report: AgentRunReport) -> None:
        if not self.enabled:
            return
        try:
            self._register()
            with httpx.Client(timeout=self.timeout_s) as client:
                resp = client.post(
                    f"{self.control_plane_url}/runs",
                    json=report.model_dump(mode="json"),
                )
                if resp.is_success:
                    self.last_run_id = resp.json().get("run_id")
                    if self.last_run_id:
                        BaseConnector._latest_run_ids[self.name] = self.last_run_id
        except Exception:
            pass

    async def _report_run_async(self, report: AgentRunReport) -> None:
        if not self.enabled:
            return
        try:
            self._register()
            async with httpx.AsyncClient(timeout=self.timeout_s) as client:
                resp = await client.post(
                    f"{self.control_plane_url}/runs",
                    json=report.model_dump(mode="json"),
                )
                if resp.is_success:
                    self.last_run_id = resp.json().get("run_id")
                    if self.last_run_id:
                        BaseConnector._latest_run_ids[self.name] = self.last_run_id
        except Exception:
            pass

    @classmethod
    def get_latest_run_id(cls, agent_name: Optional[str] = None) -> Optional[str]:
        if agent_name:
            return cls._latest_run_ids.get(agent_name)
        if not cls._latest_run_ids:
            return None
        return next(reversed(cls._latest_run_ids.values()))

    @classmethod
    async def score_run(
        cls,
        score_name: str,
        value: float,
        *,
        comment: str = "",
        run_id: Optional[str] = None,
        agent_name: Optional[str] = None,
        control_plane_url: Optional[str] = None,
        timeout_s: float = 5.0,
    ) -> bool:
        target_run_id = run_id or cls.get_latest_run_id(agent_name=agent_name)
        if not target_run_id:
            return False
        cp_url = (
            control_plane_url
            or os.getenv("CONTROL_PLANE_URL")
            or "http://localhost:8500"
        ).rstrip("/")
        try:
            async with httpx.AsyncClient(timeout=timeout_s) as client:
                resp = await client.post(
                    f"{cp_url}/runs/{target_run_id}/score",
                    params={
                        "name": score_name,
                        "value": max(0.0, min(1.0, float(value))),
                        "comment": comment,
                    },
                )
                return resp.is_success
        except Exception:
            return False
