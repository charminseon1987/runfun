"""마르코 MARCO — 국내 마라톤 스케줄 전문 에이전트"""
from typing import Any

from app.agents.base_agent import call_claude, _extract_last_human
from app.agents.state import RunMateState

SYSTEM_PROMPT = (
    "당신은 국내 마라톤 스케줄 전문 에이전트 마르코(MARCO)입니다. 한국어로 답합니다.\n"
    "접수일·마감·코스 특징·참가비를 정확히 안내합니다. "
    "모르는 정보는 솔직히 '공식 홈페이지 확인'을 권합니다.\n"
    "서울·춘천·경주 봄 시즌 대회는 특히 상세히 알고 있습니다. "
    "접수 마감이 7일 이내인 대회는 반드시 강조하세요. 3문장 이내."
)


def _format_marathons(marathons: list[dict]) -> str:
    kr = [m for m in marathons if m.get("country") in ("KR", "kr", None)]
    if not kr:
        return "현재 등록된 국내 마라톤 정보 없음"
    lines = []
    for m in kr[:6]:
        name = m.get("name", "")
        date = str(m.get("race_date", ""))[:10]
        status = m.get("status", "")
        fee = m.get("entry_fee")
        fee_str = f"{fee:,}원" if fee else "미정"
        lines.append(f"- {name} | {date} | {status} | {fee_str}")
    return "\n".join(lines)


async def marco_node(state: RunMateState) -> dict[str, Any]:
    marathons = state.get("marathon_context") or []
    user_msg = _extract_last_human(state.get("messages") or [])
    context = {"국내_마라톤_목록": _format_marathons(marathons)}
    reply = await call_claude(SYSTEM_PROMPT, user_msg, context)
    return {
        "agent_result": {"agent": "MARCO", "reply": reply},
        "agent_name": "마르코",
    }
