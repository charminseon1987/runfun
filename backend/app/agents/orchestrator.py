import logging
import re
from typing import Any

from langchain_core.messages import HumanMessage
from langgraph.graph import END, StateGraph

from app.agents.state import RunMateState
from app.config import get_settings

logger = logging.getLogger(__name__)


def _rule_intent(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ["마라톤", "marathon", "대회"]):
        return "marathon_schedule"
    if any(k in t for k in ["코스", "course", "추천"]):
        return "course_discovery"
    if any(k in t for k in ["스탬프", "stamp"]):
        return "stamp"
    if any(k in t for k in ["친구", "friend", "러닝 중"]):
        return "friend_alert"
    if any(k in t for k in ["용품", "gear", "화"]):
        return "gear_advice"
    if any(k in t for k in ["여행", "travel"]):
        return "travel_running"
    if any(k in t for k in ["커뮤니티", "채팅", "community"]):
        return "community"
    return "gps_record"


async def _claude_intent(text: str) -> str:
    settings = get_settings()
    if not settings.anthropic_api_key:
        return _rule_intent(text)
    try:
        from anthropic import AsyncAnthropic

        client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        prompt = (
            "Classify user intent into exactly one label:\n"
            "marathon_schedule, world_marathon, course_discovery, gps_record, "
            "media_publish, friend_alert, stamp, gear_advice, community, travel_running\n\n"
            f"User: {text}\nLabel:"
        )
        msg = await client.messages.create(
            model=settings.claude_model,
            max_tokens=64,
            messages=[{"role": "user", "content": prompt}],
        )
        block = msg.content[0]
        raw = getattr(block, "text", "") or ""
        m = re.search(
            r"(marathon_schedule|world_marathon|course_discovery|gps_record|media_publish|"
            r"friend_alert|stamp|gear_advice|community|travel_running)",
            raw,
            re.I,
        )
        if m:
            return m.group(1).lower()
    except Exception as e:
        logger.warning("Claude intent failed: %s", e)
    return _rule_intent(text)


async def orchestrator_node(state: RunMateState) -> dict[str, Any]:
    msgs = state.get("messages") or []
    last = ""
    if msgs:
        last_obj = msgs[-1]
        last = getattr(last_obj, "content", str(last_obj))
    intent = await _claude_intent(str(last))
    return {"intent": intent, "agent_result": {"intent": intent}}


async def stub_agent(name: str, state: RunMateState) -> dict[str, Any]:
    return {
        "agent_result": {
            "agent": name,
            "summary": f"{name} processed request for user {state.get('user_id')}",
        }
    }


def _agent_node_factory(name: str):
    async def _run(state: RunMateState) -> dict[str, Any]:
        return await stub_agent(name, state)

    return _run


def build_graph():
    workflow = StateGraph(RunMateState)
    workflow.add_node("orchestrator", orchestrator_node)
    route_map = {
        "marathon_schedule": "marathon_agent",
        "world_marathon": "world_marathon_agent",
        "course_discovery": "course_agent",
        "gps_record": "gps_agent",
        "media_publish": "media_agent",
        "friend_alert": "friend_agent",
        "stamp": "stamp_agent",
        "gear_advice": "gear_agent",
        "community": "chat_agent",
        "travel_running": "travel_agent",
    }

    for node in set(route_map.values()):
        workflow.add_node(node, _agent_node_factory(node))

    def router(state: RunMateState) -> str:
        intent = state.get("intent") or "gps_record"
        return route_map.get(intent, "gps_agent")

    workflow.set_entry_point("orchestrator")
    workflow.add_conditional_edges("orchestrator", router)

    for node in set(route_map.values()):
        workflow.add_edge(node, END)

    return workflow.compile()


_graph = None


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph


async def run_agent_chat(user_id: str, message: str, user_location: dict | None = None) -> dict:
    graph = get_graph()
    init: RunMateState = {
        "messages": [HumanMessage(content=message)],
        "user_id": user_id,
        "user_location": user_location or {},
    }
    out = await graph.ainvoke(init)
    return {"intent": out.get("intent"), "result": out.get("agent_result")}
