import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.stamp import Stamp, UserStamp
from app.models.user import User
from app.schemas.running import RoutePoint
from pydantic import BaseModel, Field

router = APIRouter(prefix="/stamps", tags=["stamps"])


class VerifyBody(BaseModel):
    session_id: uuid.UUID | None = None
    route: list[RoutePoint] = Field(default_factory=list)


@router.get("")
async def list_stamps(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stamps = (await db.execute(select(Stamp))).scalars().all()
    earned = (await db.execute(select(UserStamp).where(UserStamp.user_id == user.id))).scalars().all()
    earned_map = {e.stamp_id: e for e in earned}
    out = []
    for s in stamps:
        u = earned_map.get(s.id)
        out.append(
            {
                "id": s.id,
                "name": s.name,
                "region": s.region,
                "icon": s.icon,
                "distance_km": float(s.distance_km) if s.distance_km is not None else None,
                "rarity": s.rarity,
                "earned": u is not None,
                "earn_count": u.earn_count if u else 0,
            }
        )
    return out


@router.get("/my")
async def my_stamps(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = await db.execute(select(UserStamp).where(UserStamp.user_id == user.id))
    return [
        {
            "stamp_id": r.stamp_id,
            "earn_count": r.earn_count,
            "first_earned": r.first_earned,
            "last_earned": r.last_earned,
        }
        for r in q.scalars().all()
    ]


@router.post("/verify")
async def verify_manual(
    body: VerifyBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models.running_session import RunningSession
    from app.services.stamp_service import verify_stamp_for_session

    if body.session_id:
        session = await db.get(RunningSession, body.session_id)
        if not session or session.user_id != user.id:
            raise HTTPException(status_code=404, detail="Session not found")
        session.route = [p.model_dump() for p in body.route] if body.route else session.route
    else:
        raise HTTPException(status_code=400, detail="session_id required")

    earned = await verify_stamp_for_session(db, user.id, session)
    return {"earned": earned}


@router.get("/leaderboard")
async def leaderboard(db: AsyncSession = Depends(get_db), limit: int = 20):
    q = await db.execute(
        select(UserStamp.user_id, func.count(UserStamp.id).label("cnt"))
        .group_by(UserStamp.user_id)
        .order_by(func.count(UserStamp.id).desc())
        .limit(limit)
    )
    rows = q.all()
    out = []
    for uid, cnt in rows:
        u = await db.get(User, uid)
        out.append({"user_id": str(uid), "name": u.name if u else "", "stamps": cnt})
    return out
