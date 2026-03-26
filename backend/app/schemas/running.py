import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class RoutePoint(BaseModel):
    lat: float
    lng: float
    timestamp: str | None = None
    altitude: float | None = None


class RunningStart(BaseModel):
    started_at: datetime | None = None


class RunningUpdate(BaseModel):
    route: list[RoutePoint] = Field(default_factory=list)


class RunningEnd(BaseModel):
    ended_at: datetime | None = None
    route: list[RoutePoint] = Field(default_factory=list)
    distance_km: float | None = None
    duration_sec: int | None = None
    avg_pace: float | None = None
    calories: int | None = None


class RunningSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    started_at: datetime
    ended_at: datetime | None
    distance_km: float | None
    duration_sec: int | None
    avg_pace: float | None
    calories: int | None
    route: list[dict[str, Any]] | None
    course_id: str | None
    google_fit_synced: bool
