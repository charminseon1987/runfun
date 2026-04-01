"""테라 TERRA — 코스 발견 & 추천 에이전트"""
from typing import Any

from app.agents.base_agent import call_claude, _extract_last_human
from app.agents.state import RunMateState

SYSTEM_PROMPT = (
    "당신은 러닝 코스 전문 에이전트 테라(TERRA)입니다. 한국어로 답합니다.\n"
    "사용자 위치(user_location)와 최근 페이스를 고려해 거리·난이도·포토스팟을 포함한 코스를 추천합니다.\n"
    "계절 조건(봄=벚꽃, 여름=이른 아침, 가을=단풍, 겨울=실내 대안)을 반드시 반영합니다. "
    "초보(7분/km 이상), 중급(5-7분), 고급(5분 미만)에 따라 난이도를 달리 추천하세요. "
    "3문장 이내."
)


def _get_pace_level(history: list[dict]) -> str:
    paces = [r.get("avg_pace") for r in history if r.get("avg_pace")]
    if not paces:
        return "미확인"
    avg = sum(paces) / len(paces)
    if avg >= 7:
        return f"초보 ({avg:.1f}분/km 평균)"
    elif avg >= 5:
        return f"중급 ({avg:.1f}분/km 평균)"
    else:
        return f"고급 ({avg:.1f}분/km 평균)"


async def terra_node(state: RunMateState) -> dict[str, Any]:
    history = state.get("run_history") or []
    location = state.get("user_location") or {}
    user_msg = _extract_last_human(state.get("messages") or [])
    context = {
        "사용자_위치": f"위도 {location.get('lat', '미확인')}, 경도 {location.get('lng', '미확인')}",
        "사용자_페이스_수준": _get_pace_level(history),
    }
    reply = await call_claude(SYSTEM_PROMPT, user_msg, context)
    return {
        "agent_result": {"agent": "TERRA", "reply": reply},
        "agent_name": "테라",
    }
