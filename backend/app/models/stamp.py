import uuid
from datetime import date, datetime
from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Stamp(Base):
    __tablename__ = "stamps"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[str] = mapped_column(String(50), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(10), nullable=True)
    distance_km: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)
    rarity: Mapped[str | None] = mapped_column(String(20), nullable=True)
    route_polygon: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    season_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    season_end: Mapped[date | None] = mapped_column(Date, nullable=True)


class UserStamp(Base):
    __tablename__ = "user_stamps"
    __table_args__ = (UniqueConstraint("user_id", "stamp_id", name="uq_user_stamp"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    stamp_id: Mapped[str] = mapped_column(String(20), ForeignKey("stamps.id"))
    earn_count: Mapped[int] = mapped_column(Integer, default=1)
    first_earned: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    last_earned: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("running_sessions.id"), nullable=True
    )
