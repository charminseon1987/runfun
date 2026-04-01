"""공통 Claude API 호출 헬퍼. 모든 에이전트 노드가 이 함수를 사용한다."""
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)

# API 키 없을 때 인텐트별 한국어 폴백 메시지
_FALLBACK = (
    "RunMate 코치입니다 🌸 지금은 AI 서버에 연결할 수 없어요. "
    "잠시 후 다시 시도해 주세요. 러닝 관련 일반 질문은 앱 내 빠른 답변을 이용해 보세요!"
)


def _extract_last_human(messages: list) -> str:
    for msg in reversed(messages or []):
        content = getattr(msg, "content", None) or (msg if isinstance(msg, str) else "")
        if content:
            return str(content)
    return ""


def _build_context_block(context_dict: dict) -> str:
    if not context_dict:
        return ""
    lines = ["[컨텍스트]"]
    for k, v in context_dict.items():
        lines.append(f"- {k}: {v}")
    return "\n".join(lines)


async def call_claude(system_prompt: str, user_message: str, context_dict: dict | None = None) -> str:
    settings = get_settings()
    if not settings.anthropic_api_key:
        return _FALLBACK

    context_block = _build_context_block(context_dict or {})
    full_system = system_prompt
    if context_block:
        full_system = f"{system_prompt}\n\n{context_block}"

    try:
        from anthropic import AsyncAnthropic

        client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        msg = await client.messages.create(
            model=settings.claude_model,
            max_tokens=512,
            system=full_system,
            messages=[{"role": "user", "content": user_message or "안녕하세요"}],
        )
        block = msg.content[0]
        return getattr(block, "text", "") or _FALLBACK
    except Exception as e:
        logger.warning("call_claude failed: %s", e)
        return _FALLBACK
