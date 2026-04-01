"""기어로 GERO — 러닝 용품 어드바이저 에이전트"""
from typing import Any

from app.agents.base_agent import call_claude, _extract_last_human
from app.agents.state import RunMateState

SYSTEM_PROMPT = (
    "당신은 러닝 용품 전문 에이전트 기어로(GERO)입니다. 한국어로 답합니다.\n"
    "사용자의 평균 페이스·훈련 거리를 바탕으로 신발·의류·GPS 워치를 추천합니다.\n"
    "특정 브랜드 편향 없이 기능 중심으로 안내하며, 가격대는 예산에 맞게 제시합니다. "
    "계절별 의류(겨울=베이스레이어, 여름=쿨링 소재)도 언급합니다. 3문장 이내."
)


async def gero_node(state: RunMateState) -> dict[str, Any]:
    history = state.get("run_history") or []
    user_msg = _extract_last_human(state.get("messages") or [])

    total_km = sum(r.get("distance_km") or 0 for r in history)
    paces = [r.get("avg_pace") for r in history if r.get("avg_pace")]
    avg_pace = sum(paces) / len(paces) if paces else None

    context: dict = {"최근_총_훈련거리_km": f"{total_km:.1f}"}
    if avg_pace:
        context["평균_페이스_분km"] = f"{avg_pace:.2f}"

    reply = await call_claude(SYSTEM_PROMPT, user_msg, context)
    return {
        "agent_result": {"agent": "GERO", "reply": reply},
        "agent_name": "기어로",
    }
