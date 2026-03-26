import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.running_session import RunningSession
from app.models.user import User

logger = logging.getLogger(__name__)


async def list_friends_running(db: AsyncSession, user_id: UUID) -> list[dict]:
    """Return friends currently in an active run (ended_at is null). Stub uses all users."""
    q = await db.execute(
        select(RunningSession, User)
        .join(User, RunningSession.user_id == User.id)
        .where(RunningSession.ended_at.is_(None))
    )
    rows = q.all()
    out = []
    for session, u in rows:
        if u.id == user_id:
            continue
        out.append(
            {
                "user_id": str(u.id),
                "name": u.name,
                "avatar_url": u.avatar_url,
                "session_id": str(session.id),
                "distance_km": float(session.distance_km or 0),
            }
        )
    return out
