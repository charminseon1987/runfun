"""트래비 TRAVI — 여행 러닝 플래너 에이전트"""
from typing import Any

from app.agents.base_agent import call_claude, _extract_last_human
from app.agents.state import RunMateState

SYSTEM_PROMPT = (
    "당신은 여행 러닝 플래너 에이전트 트래비(TRAVI)입니다. 한국어로 답합니다.\n"
    "여행지 근처 추천 러닝 코스·출발 시간·러닝 후 맛집·숙소 팁을 안내합니다.\n"
    "여행자 피로도를 고려해 5-10km 위주로 제안합니다. "
    "마라톤 대회가 열리는 도시라면 대회 정보도 함께 안내합니다. 3문장 이내."
)


async def travi_node(state: RunMateState) -> dict[str, Any]:
    marathons = state.get("marathon_context") or []
    user_msg = _extract_last_human(state.get("messages") or [])

    # 세계 마라톤 도시 목록 (여행지 참고용)
    cities = list({m.get("location", "").split(",")[0] for m in marathons if m.get("is_world_major")})
    context: dict = {}
    if cities:
        context["마라톤_개최_도시"] = ", ".join(cities[:6])

    reply = await call_claude(SYSTEM_PROMPT, user_msg, context)
    return {
        "agent_result": {"agent": "TRAVI", "reply": reply},
        "agent_name": "트래비",
    }
