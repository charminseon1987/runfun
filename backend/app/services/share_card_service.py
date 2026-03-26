"""
Generate a simple share card PNG (running stats) for social upload / GCS.
"""

import io
import logging
from uuid import UUID

from PIL import Image, ImageDraw, ImageFont
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.running_session import RunningSession

logger = logging.getLogger(__name__)


async def render_running_card_png(
    db: AsyncSession,
    session_id: UUID,
) -> bytes | None:
    result = await db.get(RunningSession, session_id)
    if not result:
        return None
    w, h = 1080, 1080
    img = Image.new("RGB", (w, h), (30, 30, 46))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 48)
        small = ImageFont.truetype("arial.ttf", 32)
    except OSError:
        font = ImageFont.load_default()
        small = font
    title = "RunMate AI"
    draw.text((60, 80), title, fill=(0, 232, 122), font=font)
    dist = result.distance_km or 0
    draw.text((60, 200), f"{float(dist):.2f} km", fill=(255, 255, 255), font=font)
    pace = result.avg_pace or 0
    draw.text((60, 300), f"Pace: {float(pace):.2f} min/km", fill=(200, 200, 200), font=small)
    cal = result.calories or 0
    draw.text((60, 360), f"{cal} kcal", fill=(200, 200, 200), font=small)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
