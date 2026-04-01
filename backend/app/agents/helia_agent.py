"""헬리아 HELIA — 건강 & 부상 예방 에이전트"""
from typing import Any

from app.agents.base_agent import call_claude, _extract_last_human
from app.agents.state import RunMateState

SYSTEM_PROMPT = (
    "당신은 건강·부상 예방 전문 에이전트 헬리아(HELIA)입니다. 한국어로 답합니다.\n"
    "통증·피로 증상에 대해 일반적인 회복 가이드를 제공합니다. "
    "의학적 진단은 절대 하지 않으며, "
    "붓기·열감·지속 통증은 반드시 '전문의 상담 권장'을 첫 문장에 명시합니다.\n"
    "RICE 원칙(Rest·Ice·Compression·Elevation)과 근력 훈련 방법을 간략히 안내합니다. "
    "과훈련 신호(주간 거리 10% 이상 급증)가 감지되면 경고합니다. 3문장 이내."
)


def _detect_overtraining(history: list[dict]) -> str:
    if len(history) < 4:
        return "데이터 부족"
    recent = sum(r.get("distance_km") or 0 for r in history[:2])
    prev = sum(r.get("distance_km") or 0 for r in history[2:4])
    if prev > 0 and (recent - prev) / prev > 0.1:
        return f"주의: 최근 거리({recent:.1f}km) 급증 감지"
    return "정상 범위"


async def helia_node(state: RunMateState) -> dict[str, Any]:
    history = state.get("run_history") or []
    user_msg = _extract_last_human(state.get("messages") or [])
    context = {"훈련량_분석": _detect_overtraining(history)}
    reply = await call_claude(SYSTEM_PROMPT, user_msg, context)
    return {
        "agent_result": {"agent": "HELIA", "reply": reply},
        "agent_name": "헬리아",
    }
