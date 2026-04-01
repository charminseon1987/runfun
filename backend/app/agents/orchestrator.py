import logging
import re
from datetime import date, timezone, datetime
from typing import Any

from langchain_core.messages import HumanMessage
from langgraph.graph import END, StateGraph
from sqlalchemy import select

from app.agents.state import RunMateState
from app.config import get_settings

logger = logging.getLogger(__name__)


# ── 인텐트 분류 ────────────────────────────────────────────────────────────────

def _rule_intent(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ["무릎", "발목", "부상", "통증", "아프", "피로골절", "힘줄", "근육통"]):
        return "health"
    if any(k in t for k in ["마라톤", "marathon", "대회", "풀코스", "하프"]):
        return "marathon_schedule"
    if any(k in t for k in ["세계", "도쿄", "보스턴", "런던", "베를린", "시카고", "뉴욕", "메이저"]):
        return "world_marathon"
    if any(k in t for k in ["코스", "course", "루트", "경로"]):
        return "course_discovery"
    if any(k in t for k in ["스탬프", "stamp", "배지", "뱃지", "게임"]):
        return "stamp"
    if any(k in t for k in ["친구", "friend", "러닝 중", "같이"]):
        return "friend_alert"
    if any(k in t for k in ["용품", "gear", "신발", "러닝화", "워치"]):
        return "gear_advice"
    if any(k in t for k in ["여행", "travel", "관광", "해외 러닝"]):
        return "travel_running"
    if any(k in t for k in ["커뮤니티", "채팅", "community", "피드", "게시"]):
        return "community"
    if any(k in t for k in ["sns", "인스타", "게시글", "캡션", "공유"]):
        return "media_publish"
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
            "media_publish, friend_alert, stamp, gear_advice, community, "
            "travel_running, health\n\n"
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
            r"friend_alert|stamp|gear_advice|community|travel_running|health)",
            raw,
            re.I,
        )
        if m:
            return m.group(1).lower()
    except Exception as e:
        logger.warning("Claude intent failed: %s", e)
    return _rule_intent(text)


# ── 컨텍스트 사전 로드 ─────────────────────────────────────────────────────────

async def _load_user_context(user_id: str) -> dict[str, Any]:
    """DB에서 사용자 컨텍스트를 사전 로드합니다."""
    context: dict[str, Any] = {
        "run_history": [],
        "stamp_ids": [],
        "marathon_context": [],
    }
    try:
        from app.database import AsyncSessionLocal
        from app.models.running_session import RunningSession
        from app.models.stamp import UserStamp
        from app.models.marathon import Marathon
        import uuid

        uid = uuid.UUID(user_id)
        async with AsyncSessionLocal() as db:
            # 최근 5회 런 세션
            result = await db.execute(
                select(RunningSession)
                .where(RunningSession.user_id == uid)
                .order_by(RunningSession.started_at.desc())
                .limit(5)
            )
            sessions = result.scalars().all()
            context["run_history"] = [
                {
                    "distance_km": float(s.distance_km) if s.distance_km else 0.0,
                    "avg_pace": float(s.avg_pace) if s.avg_pace else 0.0,
                    "started_at": s.started_at.isoformat() if s.started_at else "",
                }
                for s in sessions
            ]

            # 획득 스탬프 ID 목록
            stamp_result = await db.execute(
                select(UserStamp.stamp_id).where(UserStamp.user_id == uid)
            )
            context["stamp_ids"] = [row[0] for row in stamp_result.all()]

            # 예정 마라톤 (오늘 이후, 최대 10개)
            today = date.today()
            marathon_result = await db.execute(
                select(Marathon)
                .where(Marathon.race_date >= today)
                .order_by(Marathon.race_date)
                .limit(10)
            )
            marathons = marathon_result.scalars().all()
            context["marathon_context"] = [
                {
                    "name": m.name,
                    "race_date": m.race_date.isoformat() if m.race_date else "",
                    "country": m.country,
                    "location": m.location or "",
                    "status": m.status or "",
                    "entry_fee": m.entry_fee,
                    "apply_end": m.apply_end.isoformat() if m.apply_end else "",
                    "is_world_major": m.is_world_major,
                    "apply_url": m.apply_url or "",
                }
                for m in marathons
            ]
    except Exception as e:
        logger.warning("_load_user_context failed: %s", e)
    return context


# ── 오케스트레이터 노드 ────────────────────────────────────────────────────────

async def orchestrator_node(state: RunMateState) -> dict[str, Any]:
    msgs = state.get("messages") or []
    last = ""
    if msgs:
        last_obj = msgs[-1]
        last = getattr(last_obj, "content", str(last_obj))

    intent = await _claude_intent(str(last))

    user_id = state.get("user_id") or ""
    ctx = await _load_user_context(user_id) if user_id else {}

    return {
        "intent": intent,
        "agent_result": {"intent": intent},
        **ctx,
    }


# ── 그래프 빌드 ────────────────────────────────────────────────────────────────

def build_graph():
    from app.agents.ruca_agent import ruca_node
    from app.agents.marco_agent import marco_node
    from app.agents.gloria_agent import gloria_node
    from app.agents.terra_agent import terra_node
    from app.agents.vivi_agent import vivi_node
    from app.agents.soci_agent import soci_node
    from app.agents.stampy_agent import stampy_node
    from app.agents.gero_agent import gero_node
    from app.agents.helia_agent import helia_node
    from app.agents.travi_agent import travi_node

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
        "health": "health_agent",
    }

    node_funcs = {
        "marathon_agent": marco_node,
        "world_marathon_agent": gloria_node,
        "course_agent": terra_node,
        "gps_agent": ruca_node,
        "media_agent": vivi_node,
        "friend_agent": soci_node,
        "stamp_agent": stampy_node,
        "gear_agent": gero_node,
        "chat_agent": soci_node,
        "travel_agent": travi_node,
        "health_agent": helia_node,
    }

    for node_name, fn in node_funcs.items():
        workflow.add_node(node_name, fn)

    def router(state: RunMateState) -> str:
        intent = state.get("intent") or "gps_record"
        return route_map.get(intent, "gps_agent")

    workflow.set_entry_point("orchestrator")
    workflow.add_conditional_edges("orchestrator", router)

    for node_name in node_funcs:
        workflow.add_edge(node_name, END)

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
    return {
        "intent": out.get("intent"),
        "agent": out.get("agent_name"),
        "reply": (out.get("agent_result") or {}).get("reply", ""),
        "result": out.get("agent_result"),
    }
