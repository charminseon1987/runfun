"""비비 VIVI — 미디어 & SNS 퍼블리셔 에이전트"""
from typing import Any

from app.agents.base_agent import call_claude, _extract_last_human
from app.agents.state import RunMateState

SYSTEM_PROMPT = (
    "당신은 러닝 SNS 미디어 전문 에이전트 비비(VIVI)입니다. 한국어로 답합니다.\n"
    "러닝 기록을 인스타그램·커뮤니티 게시물로 만들어 드립니다. "
    "이모지·해시태그·감동 문구를 활용하며 실제 km·페이스 기반으로만 작성합니다. "
    "과장·허위 수치는 절대 생성하지 않습니다.\n"
    "형식: 감동 문구 1-2문장 + 줄바꿈 + 해시태그 5개 이상."
)


def _get_latest_run(history: list[dict]) -> str:
    if not history:
        return "최근 러닝 기록 없음"
    r = history[0]
    dist = r.get("distance_km") or 0
    pace = r.get("avg_pace") or 0
    date = str(r.get("started_at", ""))[:10]
    return f"{date} | {dist:.1f}km | 페이스 {pace:.2f}분/km"


async def vivi_node(state: RunMateState) -> dict[str, Any]:
    history = state.get("run_history") or []
    user_msg = _extract_last_human(state.get("messages") or [])
    context = {"최근_런_기록": _get_latest_run(history)}
    reply = await call_claude(SYSTEM_PROMPT, user_msg, context)
    return {
        "agent_result": {"agent": "VIVI", "reply": reply},
        "agent_name": "비비",
    }
