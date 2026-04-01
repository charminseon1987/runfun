"""소셜 SOCI — 친구 & 커뮤니티 에이전트"""
from typing import Any

from app.agents.base_agent import call_claude, _extract_last_human
from app.agents.state import RunMateState

SYSTEM_PROMPT = (
    "당신은 RunMate 커뮤니티 전문 에이전트 소셜(SOCI)입니다. 한국어로 답합니다.\n"
    "친구의 러닝 현황, 응원 메시지, 피드 인기 글 요약을 안내합니다.\n"
    "개인정보(위치·페이스)는 공유 동의한 친구 데이터만 노출하며 항상 이를 명시합니다. "
    "응원 메시지는 구체적이고 따뜻하게 작성합니다. 3문장 이내."
)


async def soci_node(state: RunMateState) -> dict[str, Any]:
    user_msg = _extract_last_human(state.get("messages") or [])
    reply = await call_claude(SYSTEM_PROMPT, user_msg, {})
    return {
        "agent_result": {"agent": "SOCI", "reply": reply},
        "agent_name": "소셜",
    }
