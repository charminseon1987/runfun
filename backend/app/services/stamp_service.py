"""
GPS route vs stamp polygon overlap using Shapely (~70% threshold).
"""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from shapely.geometry import LineString, Polygon
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.stamp import Stamp, UserStamp
from app.models.running_session import RunningSession

logger = logging.getLogger(__name__)

OVERLAP_THRESHOLD = 0.70


def _route_to_line(route: list[dict[str, Any]] | None) -> LineString | None:
    if not route or len(route) < 2:
        return None
    coords = []
    for p in route:
        lat = p.get("lat")
        lng = p.get("lng")
        if lat is None or lng is None:
            continue
        coords.append((float(lng), float(lat)))
    if len(coords) < 2:
        return None
    return LineString(coords)


def _polygon_from_json(poly: list | None) -> Polygon | None:
    if not poly or len(poly) < 3:
        return None
    rings = []
    for item in poly:
        if isinstance(item, (list, tuple)) and len(item) == 2:
            rings.append((float(item[1]), float(item[0])))
        elif isinstance(item, dict):
            lat = item.get("lat")
            lng = item.get("lng")
            if lat is not None and lng is not None:
                rings.append((float(lng), float(lat)))
    if len(rings) < 3:
        return None
    try:
        return Polygon(rings)
    except Exception:
        return None


def compute_overlap_ratio(line: LineString, polygon: Polygon) -> float:
    if line.length == 0:
        return 0.0
    inter = line.intersection(polygon)
    if inter.is_empty:
        return 0.0
    try:
        return float(inter.length / line.length)
    except ZeroDivisionError:
        return 0.0


async def verify_stamp_for_session(
    db: AsyncSession,
    user_id: UUID,
    session: RunningSession,
) -> list[str]:
    """Return list of newly earned stamp ids."""
    line = _route_to_line(session.route if isinstance(session.route, list) else None)
    if line is None:
        return []

    result = await db.execute(select(Stamp))
    stamps = result.scalars().all()
    earned: list[str] = []

    for stamp in stamps:
        poly = _polygon_from_json(
            stamp.route_polygon if isinstance(stamp.route_polygon, list) else None
        )
        if poly is None:
            continue
        ratio = compute_overlap_ratio(line, poly)
        if ratio < OVERLAP_THRESHOLD:
            continue

        existing = await db.execute(
            select(UserStamp).where(
                UserStamp.user_id == user_id,
                UserStamp.stamp_id == stamp.id,
            )
        )
        row = existing.scalar_one_or_none()
        if row:
            row.earn_count += 1
            row.last_earned = session.ended_at or row.last_earned
            row.session_id = session.id
        else:
            db.add(
                UserStamp(
                    user_id=user_id,
                    stamp_id=stamp.id,
                    earn_count=1,
                    session_id=session.id,
                )
            )
        earned.append(stamp.id)

    await db.flush()
    return earned
