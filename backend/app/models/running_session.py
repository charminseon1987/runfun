import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class RunningSession(Base):
    __tablename__ = "running_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    distance_km: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)
    duration_sec: Mapped[int | None] = mapped_column(Integer, nullable=True)
    avg_pace: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    calories: Mapped[int | None] = mapped_column(Integer, nullable=True)
    route: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    course_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    google_fit_synced: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="running_sessions")
