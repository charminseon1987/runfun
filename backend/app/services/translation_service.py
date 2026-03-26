import logging

from anthropic import AsyncAnthropic

from app.config import get_settings

logger = logging.getLogger(__name__)


async def translate_text(text: str, target_lang: str) -> tuple[str, str | None]:
    settings = get_settings()
    if not settings.anthropic_api_key:
        return text, None
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    prompt = (
        f"Translate the following text to language code '{target_lang}'. "
        "Reply with only the translated text, no quotes.\n\n" + text
    )
    try:
        msg = await client.messages.create(
            model=settings.claude_model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        for block in msg.content:
            if getattr(block, "type", None) == "text" and hasattr(block, "text"):
                return str(block.text).strip(), "auto"
    except Exception as e:
        logger.warning("Claude translate failed: %s", e)
    return text, None
