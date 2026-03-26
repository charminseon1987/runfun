import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Marathon(Base):
    __tablename__ = "marathons"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    region: Mapped[str | None] = mapped_column(String(50), nullable=True)
    country: Mapped[str] = mapped_column(String(50), default="KR")
    race_date: Mapped[date] = mapped_column(Date, nullable=False)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    distances: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    apply_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    apply_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    apply_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    entry_fee: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_world_major: Mapped[bool] = mapped_column(Boolean, default=False)


class MarathonAlert(Base):
    __tablename__ = "marathon_alerts"
    __table_args__ = (UniqueConstraint("user_id", "marathon_id", name="uq_marathon_alert"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    marathon_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("marathons.id"))
    alert_before_days: Mapped[int] = mapped_column(Integer, default=7)
    fcm_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
