"""공통 Claude API 호출 헬퍼. 모든 에이전트 노드가 이 함수를 사용한다."""
import base64
import logging
import re

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


def _parse_data_url(data_url: str) -> tuple[str, bytes] | None:
    """data:image/jpeg;base64,XXXX -> (media_type, raw_bytes)"""
    if not data_url.startswith("data:"):
        return None
    try:
        header, b64 = data_url.split(",", 1)
        # data:image/jpeg;base64
        mt = "image/jpeg"
        m = re.search(r"data:([^;]+)", header)
        if m:
            mt = m.group(1).strip() or mt
        raw = base64.b64decode(b64, validate=False)
        return (mt, raw)
    except Exception:
        return None


async def call_claude_with_fridge_image(
    system_prompt: str,
    user_text: str,
    image_url: str,
    *,
    context_dict: dict | None = None,
    max_tokens: int = 1200,
) -> str:
    """
    Claude Vision: 냉장고 이미지(URL 또는 data URL) + 텍스트(YOLO 힌트 등)로 응답 생성.
    API 키 없음/실패 시 텍스트 전용 call_claude와 동일하게 폴백 문자열.
    """
    settings = get_settings()
    if not settings.anthropic_api_key:
        return _FALLBACK

    context_block = _build_context_block(context_dict or {})
    full_system = system_prompt
    if context_block:
        full_system = f"{system_prompt}\n\n{context_block}"

    content: list[dict] = []

    parsed = _parse_data_url(image_url)
    if parsed is not None:
        media_type, raw = parsed
        b64 = base64.b64encode(raw).decode("ascii")
        content.append(
            {
                "type": "image",
                "source": {"type": "base64", "media_type": media_type, "data": b64},
            }
        )
    elif image_url.startswith("http://") or image_url.startswith("https://"):
        content.append(
            {
                "type": "image",
                "source": {"type": "url", "url": image_url},
            }
        )
    else:
        # 이미지 없으면 텍스트만
        return await call_claude(system_prompt, f"{user_text}\n(image_url: {image_url})", context_dict)

    content.append({"type": "text", "text": user_text or "이미지를 분석해 주세요."})

    try:
        from anthropic import AsyncAnthropic

        client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        msg = await client.messages.create(
            model=settings.claude_model,
            max_tokens=max_tokens,
            system=full_system,
            messages=[{"role": "user", "content": content}],
        )
        parts: list[str] = []
        for block in msg.content:
            t = getattr(block, "text", None)
            if t:
                parts.append(t)
        return "".join(parts).strip() or _FALLBACK
    except Exception as e:
        logger.warning("call_claude_with_fridge_image failed: %s", e)
        return await call_claude(system_prompt, f"{user_text}\n(image_url: {image_url})", context_dict)
