import os
import time
import httpx
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

from pydantic_ai import Agent, RunContext
from openai import AsyncOpenAI
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider
from dotenv import load_dotenv

from skill_manager import skill_manager
from mcp_client import mcp_manager
from observability.pydantic_adapter import PydanticAIAdapter
from observability.schemas import LLMJudgeConfig

_HERE = Path(__file__).resolve()
load_dotenv(_HERE.parent / ".env", override=True)
load_dotenv(_HERE.parents[1] / ".env", override=True)

async_openai_client = AsyncOpenAI()

planner_model = OpenAIModel(
    'gpt-4o',
    provider=OpenAIProvider(openai_client=async_openai_client),
)

planner_model_gemini = GoogleModel(
    'gemini-2.5-pro',
    provider=GoogleProvider(api_key=os.getenv('GOOGLE_API_KEY')),
)

planner_agent = Agent(
    model=planner_model_gemini,
    retries=3,
    system_prompt="""\
You are a Senior Equity Research Analyst.
You communicate with the authority and precision of a seasoned professional —
concise, data-driven, and client-focused. Your tone is institutional-grade:
measured, confident, and always substantive. Never reference or name any
specific financial institution, bank, or advisory firm as your employer.

CONVERSATION PRINCIPLES
───────────────────────
You are having a professional dialogue with a client. Before executing any
research or analysis, confirm the key inputs:

1. TICKER VALIDATION
   - If the user provides a ticker or company name, confirm it briefly.
   - If ambiguous (e.g. "META" could refer to multiple entities), clarify:
     "Just to confirm — you are referring to Meta Platforms (META)?"
   - If the ticker is clear and unambiguous, acknowledge and proceed.

2. TIME PERIOD
   - If the skill requires a time period and the user has not specified one,
     ask concisely: "What period would you like me to cover — for instance,
     the last quarter, last 2 quarters, trailing 12 months, or next 2 fiscal years?"
   - If the user HAS specified a time period, USE IT. Do not push for a different
     period or say "I can only do annual analysis." Adapt your searches to match
     what the user requested — quarterly, annual, TTM, whatever they asked for.
   - Do NOT silently assume a default. Always confirm with the client first.

3. Once inputs are confirmed, proceed to execution without further delay.

FOLLOW-UP HANDLING
──────────────────
When the client sends a follow-up message within an active skill session:

- If the client explicitly asks to see a previous report again (e.g. "show me
  that report again", "can I see the NVDA report?", "repeat the output"),
  provide the full output again — cleanly and completely. Never say
  "I already provided this" or "as shown above."

- If the client mentions a ticker or company name WITHOUT explicitly asking
  for a repeat, treat it as a NEW request. Ask what they need:
  "I have NVIDIA (NVDA) in context. Would you like a new analysis with a
  different time period, a specific focus area, or something else?"

- If the client provides new parameters (different period, different focus),
  execute a fresh analysis with those parameters.

EXECUTION METHODOLOGY
─────────────────────
Once inputs are confirmed, follow this workflow internally:
1. PLAN   — Use manage_todo_list (action: 'add') to create one task per section.
2. FETCH  — For EACH task, call query_mcp_tool to retrieve data before writing.
3. DRAFT  — Fill in every section of the output template using fetched data.
4. VERIFY — Cross-check key claims across 2-3 sources or tool calls where possible.

COVERAGE RULE
─────────────
The skill instructions define a specific output template with named sections.
You MUST address EVERY section and data point listed — no exceptions.

- Data retrieved successfully: fill in the section normally.
- Data NOT found or tool returned no result: write exactly
  "Not available — [brief reason]"
- Never silently skip a section, leave a placeholder blank, or omit a required field.
- Never say "I cannot access..." without first calling query_mcp_tool to try.

TODO LIST RULES
───────────────
- Add one todo per skill section using manage_todo_list (action: 'add').
- Mark each task 'in_progress' before starting, 'completed' when done.

OUTPUT FORMAT & TONE
────────────────────
- Follow the exact output format defined in the skill instructions.
- Be opinionated and specific — generic summaries with no view are unacceptable.
- Write in a professional, institutional research tone throughout.
- End with a completeness checklist confirming every required section was addressed.

CRITICAL — COMPLETE OUTPUT
──────────────────────────
Your final response to the client MUST contain the ENTIRE report — every section,
every table, every data point — in a single message. Do NOT split the report
across multiple responses. Do NOT summarize or abbreviate sections. Do NOT
output only the investment thesis and stop. The client expects the full
deliverable in one complete response.
"""
)


class MCPAwarePydanticAIAdapter(PydanticAIAdapter):
    """Subclass that also stores last_run_id for post-run scoring."""
    def __init__(self, *args, **kwargs):
        self.last_run_id = None
        super().__init__(*args, **kwargs)

    async def _report_run_async(self, report):
        try:
            self._register()
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"{self.control_plane_url}/runs",
                    json=report.model_dump(mode="json"),
                )
                if resp.is_success:
                    self.last_run_id = resp.json().get("run_id")
        except Exception:
            pass


adapter = MCPAwarePydanticAIAdapter(
    agent=planner_agent,
    name="financial_planner",
    description="Deep research assistant and senior financial analyst",
    evaluators=["llm_judge"],
    llm_judge_config=LLMJudgeConfig(
        dimensions=["accuracy", "safety", "hallucination", "helpfulness"],
        model="gpt-4o",
    ),
    control_plane_url=os.getenv("CONTROL_PLANE_URL", "http://localhost:8500"),
    langfuse_public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
    langfuse_secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
    langfuse_host=os.getenv("LANGFUSE_HOST", "http://localhost:3000"),
)


@dataclass
class PlannerDeps:
    active_skill: Dict[str, Any] = field(default_factory=dict)
    todo_list: Dict[int, Dict[str, str]] = field(default_factory=dict)
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)
    reasoning_steps: int = 0


@planner_agent.tool
async def manage_todo_list(
    ctx: RunContext[PlannerDeps],
    action: str,
    task_id: int = None,
    task_description: str = None,
    status: str = None,
) -> str:
    """
    Manage your research plan.
    Args:
        action (str): 'add' to add a new task, 'update_status' to update a task, 'view' to view all tasks.
        task_id (int, optional): The ID of the task to update.
        task_description (str, optional): The description of the task when adding.
        status (str, optional): 'in_progress' or 'completed' when updating status.
    """
    if ctx.deps.todo_list is None:
        ctx.deps.todo_list = {}
    ctx.deps.reasoning_steps += 1

    print(f"\n[AGENT THOUGHT] -> manage_todo_list(action='{action}', task_id={task_id}, status='{status}')")

    if action == 'add':
        new_id = len(ctx.deps.todo_list) + 1
        ctx.deps.todo_list[new_id] = {"desc": task_description, "status": "pending"}
        return f"Task {new_id} added: {task_description}"
    elif action == 'update_status':
        if task_id in ctx.deps.todo_list:
            ctx.deps.todo_list[task_id]["status"] = status
            return f"Task {task_id} marked as {status}"
        return f"Task {task_id} not found."
    elif action == 'view':
        return "\\n".join([f"[{v['status']}] {k}: {v['desc']}" for k, v in ctx.deps.todo_list.items()])
    return "Invalid action."


@planner_agent.tool
async def query_mcp_tool(
    ctx: RunContext[PlannerDeps],
    server_name: str,
    tool_name: str,
    arguments: dict,
    expected_tool: Optional[str] = None,
) -> dict:
    """
    Executes a tool on a connected MCP server and records telemetry for dashboard metrics.
    Args:
        server_name: MCP server name (must be allowed by active skill unless none specified).
        tool_name: MCP tool name to call.
        arguments: Tool input payload.
        expected_tool: Optional expected routing target for accuracy calculation.
            Can be either the MCP server name (e.g. "perplexity") or tool name
            (e.g. "perplexity_search"). If provided, this call is included in
            true routing-accuracy scoring.
    Returns:
        dict:
          - {"result": "..."} on success
          - {"error": "..."} on failure
    """
    if not hasattr(ctx.deps, "tool_calls") or ctx.deps.tool_calls is None:
        ctx.deps.tool_calls = []
    ctx.deps.reasoning_steps += 1
    t0 = time.perf_counter()
    ok = False
    err = None
    result_text = ""

    print(
        f"\n[AGENT DATA GATHERING] -> query_mcp_tool("
        f"server_name='{server_name}', tool_name='{tool_name}')"
    )
    print(f"Arguments: {arguments}")

    try:
        allowed_servers = ctx.deps.active_skill.get("required_mcp_servers", [])
        if not allowed_servers:
            allowed_servers = list(mcp_manager.servers.keys())
        if server_name not in allowed_servers:
            err = f"Access to server '{server_name}' denied for this skill."
            return {"error": err}
        client = await mcp_manager.get_client(server_name)
        if not client:
            err = f"Failed to connect to MCP server '{server_name}'."
            return {"error": err}
        res = await client.call_tool(tool_name, arguments)
        text_chunks = []
        for item in getattr(res, "content", []):
            if getattr(item, "type", None) == "text":
                text_chunks.append(getattr(item, "text", ""))
        result_text = "\n".join([c for c in text_chunks if c]).strip()
        ok = True
        if not result_text:
            result_text = str(res)
        return {"result": result_text}
    except Exception as e:
        err = str(e)
        print(f"🔥 AGENT CAUGHT MCP ERROR: {err}")
        import traceback
        traceback.print_exc()
        return {"error": f"Failed to call tool: {err}"}
    finally:
        latency_ms = (time.perf_counter() - t0) * 1000
        expected = expected_tool.lower() if isinstance(expected_tool, str) else None
        actual_server = server_name.lower() if isinstance(server_name, str) else ""
        actual_tool = tool_name.lower() if isinstance(tool_name, str) else ""
        is_correct = None
        if expected:
            is_correct = expected in (actual_server, actual_tool, f"{actual_server}.{actual_tool}")

        ctx.deps.tool_calls.append(
            {
                "ts": datetime.utcnow().isoformat(),
                "server": server_name,
                "tool": tool_name,
                "expected_tool": expected_tool,
                "correct": is_correct,
                "success": ok,
                "latency_ms": round(latency_ms, 1),
                "error": err,
                "arg_keys": sorted(list(arguments.keys())) if isinstance(arguments, dict) else [],
            }
        )


async def run_planner(user_message: str, session_history: list, matched_skill: dict, is_followup: bool = False):
    """
    Executes the planner agent with the given skill.
    - First invocation (is_followup=False): injects full skill context + available tools.
    - Follow-ups (is_followup=True): passes only the user's reply. The agent already
      has the skill context in its message_history from the first turn.
    """
    deps = PlannerDeps(active_skill=matched_skill)

    if is_followup:
        result = await planner_agent.run(
            user_message,
            deps=deps,
            message_history=session_history
        )
        return result

    skill_instructions = matched_skill.get("agent_instructions", "")
    allowed_servers = matched_skill.get("required_mcp_servers", [])

    if not allowed_servers:
        allowed_servers = list(mcp_manager.servers.keys())

    server_tools_info = []
    for srv in allowed_servers:
        client = await mcp_manager.get_client(srv)
        if client:
            try:
                tools_list = await client.list_tools()
                for t in tools_list.tools:
                    server_tools_info.append(f"Server: '{srv}' | Tool Name: '{t.name}' | Desc: {t.description} | Schema: {t.inputSchema}")
            except Exception as e:
                print(f"Agent preparation: failed to list tools for {srv}: {e}")

    tools_context = "\\n\\n--- AVAILABLE MCP TOOLS ---"
    if server_tools_info:
        tools_context += "\\n" + "\\n".join(server_tools_info)
    else:
        tools_context += "\\nNo external MCP tools available."

    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    context_prompt = (
        f"--- CURRENT TIME CONTEXT ---\nThe current date and time is: {current_time}.\n\n"
        f"--- CURRENT SKILL CONTEXT ---\n{skill_instructions}{tools_context}\n\n"
        f"USER SAID: {user_message}"
    )

    result = await adapter.run(
        context_prompt,
        deps=deps,
        message_history=session_history,
    )

    # Post-run: score tool accuracy and success rate
    run_id = adapter.last_run_id
    if run_id and deps.tool_calls:
        judged = [c for c in deps.tool_calls if c.get("correct") is not None]
        tool_success = sum(1 for c in deps.tool_calls if c.get("success")) / len(deps.tool_calls)
        tool_acc = (
            sum(1 for c in judged if c["correct"]) / len(judged)
            if judged
            else 0.0
        )
        cp_url = os.getenv("CONTROL_PLANE_URL", "http://localhost:8500").rstrip("/")
        print(
            "[TELEMETRY] tool scoring: "
            f"total_calls={len(deps.tool_calls)}, judged_calls={len(judged)}, "
            f"tool_accuracy={round(tool_acc, 4)}, tool_success_rate={round(tool_success, 4)}"
        )
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(
                    f"{cp_url}/runs/{run_id}/score",
                    params={
                        "name": "tool_accuracy",
                        "value": round(tool_acc, 4),
                        "comment": (
                            "True MCP routing accuracy vs expected_tool "
                            f"(judged_calls={len(judged)}, total_calls={len(deps.tool_calls)})"
                        ),
                    },
                )
                await client.post(
                    f"{cp_url}/runs/{run_id}/score",
                    params={
                        "name": "tool_success_rate",
                        "value": round(tool_success, 4),
                        "comment": "MCP tool execution success rate",
                    },
                )
        except Exception:
            pass

    return result
