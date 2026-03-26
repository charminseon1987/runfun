"""
Google Fit sync placeholder — wire OAuth + Fit REST in production.
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

logger = logging.getLogger(__name__)


async def mark_session_synced(db: AsyncSession, user: User, session_id: UUID) -> bool:
    """Stub: mark running session as synced when Fit integration is ready."""
    logger.info("Google Fit stub: would sync session %s for user %s", session_id, user.id)
    return True
