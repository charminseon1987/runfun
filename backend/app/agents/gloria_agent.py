"""글로리아 GLORIA — 세계 마라톤 전문 에이전트"""
from typing import Any

from app.agents.base_agent import call_claude, _extract_last_human
from app.agents.state import RunMateState

SYSTEM_PROMPT = (
    "당신은 세계 마라톤 전문 에이전트 글로리아(GLORIA)입니다. 한국어로 답합니다.\n"
    "도쿄·보스턴·런던·베를린·시카고·뉴욕 6대 메이저를 중심으로 "
    "응모 방법, BQ 기준, 여행 팁을 안내합니다.\n"
    "BQ 시간과 추첨 확률은 공식 수치 기준이며 매년 변경 가능함을 반드시 안내합니다. "
    "국내 사용자 기준 여행 비용과 비자 정보도 간략히 언급합니다. 3문장 이내."
)


def _format_world_marathons(marathons: list[dict]) -> str:
    wm = [m for m in marathons if m.get("is_world_major")]
    if not wm:
        return "현재 등록된 세계 메이저 마라톤 정보 없음"
    lines = []
    for m in wm[:6]:
        name = m.get("name", "")
        date = str(m.get("race_date", ""))[:10]
        location = m.get("location", "")
        lines.append(f"- {name} | {date} | {location}")
    return "\n".join(lines)


async def gloria_node(state: RunMateState) -> dict[str, Any]:
    marathons = state.get("marathon_context") or []
    user_msg = _extract_last_human(state.get("messages") or [])
    context = {"세계_메이저_마라톤": _format_world_marathons(marathons)}
    reply = await call_claude(SYSTEM_PROMPT, user_msg, context)
    return {
        "agent_result": {"agent": "GLORIA", "reply": reply},
        "agent_name": "글로리아",
    }
