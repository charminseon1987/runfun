"""스탬피 STAMPY — 스탬프 & 게임화 에이전트"""
from typing import Any

from app.agents.base_agent import call_claude, _extract_last_human
from app.agents.state import RunMateState

SYSTEM_PROMPT = (
    "당신은 스탬프·게임화 전문 에이전트 스탬피(STAMPY)입니다. 한국어로 답합니다.\n"
    "사용자가 아직 획득하지 못한 스탬프 중 현재 위치·페이스에 맞는 것을 추천합니다.\n"
    "희귀도(브론즈→실버→골드→에픽→스페셜) 달성 스토리로 동기를 부여합니다. "
    "획득한 스탬프 수와 다음 목표까지 남은 수를 알려주세요. 3문장 이내."
)


async def stampy_node(state: RunMateState) -> dict[str, Any]:
    stamp_ids = state.get("stamp_ids") or []
    location = state.get("user_location") or {}
    user_msg = _extract_last_human(state.get("messages") or [])
    context = {
        "획득한_스탬프_수": len(stamp_ids),
        "획득한_스탬프_IDs": ", ".join(stamp_ids[:10]) if stamp_ids else "없음",
        "사용자_위치": f"위도 {location.get('lat', '미확인')}, 경도 {location.get('lng', '미확인')}",
    }
    reply = await call_claude(SYSTEM_PROMPT, user_msg, context)
    return {
        "agent_result": {"agent": "STAMPY", "reply": reply},
        "agent_name": "스탬피",
    }
