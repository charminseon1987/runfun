"""루카 RUCA — GPS & 러닝 기록 분석 에이전트"""
from typing import Any

from app.agents.base_agent import call_claude, _extract_last_human
from app.agents.state import RunMateState

SYSTEM_PROMPT = (
    "당신은 RunMate의 GPS 러닝 분석 에이전트 루카(RUCA)입니다. 한국어로 답합니다.\n"
    "사용자의 최근 러닝 데이터(거리·페이스·날짜)를 기반으로 트렌드, 주간 목표 달성률, "
    "피로 징후를 간결하게 분석합니다. 숫자(km·분/km·kcal)를 반드시 포함하고 "
    "3문장 이내로 핵심만 전달합니다. 격려하는 톤으로 마무리하세요."
)


def _format_run_history(history: list[dict]) -> str:
    if not history:
        return "최근 러닝 기록 없음"
    lines = []
    for i, r in enumerate(history[:5], 1):
        dist = r.get("distance_km") or 0
        pace = r.get("avg_pace") or 0
        date = str(r.get("started_at", ""))[:10]
        lines.append(f"{i}. {date} | {dist:.1f}km | 페이스 {pace:.2f}분/km")
    return "\n".join(lines)


async def ruca_node(state: RunMateState) -> dict[str, Any]:
    history = state.get("run_history") or []
    user_msg = _extract_last_human(state.get("messages") or [])
    context = {"최근_러닝_기록": _format_run_history(history)}
    reply = await call_claude(SYSTEM_PROMPT, user_msg, context)
    return {
        "agent_result": {"agent": "RUCA", "reply": reply},
        "agent_name": "루카",
    }
