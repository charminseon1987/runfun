"""콘디 CONDI - 신청 마라톤 기반 컨디션 관리 에이전트"""
from datetime import date
from typing import Any

from app.agents.base_agent import _extract_last_human, call_claude
from app.agents.state import RunMateState

SYSTEM_PROMPT = (
    "당신은 마라톤 컨디션 관리 전문 에이전트 콘디(CONDI)입니다. 한국어로 답합니다.\n"
    "사용자가 신청한(알림 설정한) 마라톤 일정 기준으로 디데이별 훈련 강도, 회복, 수면, 영양 가이드를 제공합니다.\n"
    "답변 형식은 1) 이번 주 핵심 2) 주의할 점 3) 오늘 할 일 순서로, 총 4문장 이내로 간결하게 작성합니다.\n"
    "의학적 진단은 하지 말고, 통증/이상 증상이 있으면 전문의 상담을 권고합니다."
)


def _format_applied(applied: list[dict]) -> str:
    if not applied:
        return "신청 마라톤 정보 없음"
    today = date.today()
    lines = []
    for m in applied[:5]:
        race_date_raw = m.get("race_date")
        dday = "D-?"
        if race_date_raw:
            try:
                rd = date.fromisoformat(str(race_date_raw)[:10])
                dday = f"D-{(rd - today).days}"
            except Exception:
                pass
        lines.append(
            f"- {m.get('name', '마라톤')} | {race_date_raw or ''} | {dday} | "
            f"알림:{m.get('alert_before_days', 7)}일전"
        )
    return "\n".join(lines)


def _summarize_recent_load(history: list[dict]) -> str:
    if not history:
        return "최근 러닝 기록 없음"
    total_km = sum(float(h.get("distance_km") or 0) for h in history[:5])
    paces = [float(h.get("avg_pace")) for h in history[:5] if h.get("avg_pace")]
    avg_pace = (sum(paces) / len(paces)) if paces else 0
    if avg_pace > 0:
        return f"최근5회 총거리 {total_km:.1f}km / 평균페이스 {avg_pace:.2f}분km"
    return f"최근5회 총거리 {total_km:.1f}km"


async def condi_node(state: RunMateState) -> dict[str, Any]:
    user_msg = _extract_last_human(state.get("messages") or [])
    context = {
        "신청_마라톤": _format_applied(state.get("applied_marathons") or []),
        "최근_훈련부하": _summarize_recent_load(state.get("run_history") or []),
    }
    reply = await call_claude(SYSTEM_PROMPT, user_msg, context)
    return {
        "agent_result": {"agent": "CONDI", "reply": reply},
        "agent_name": "콘디",
    }
