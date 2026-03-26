from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.stamp import Stamp

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/hot")
async def hot_courses(db: AsyncSession = Depends(get_db), region: str | None = None):
    q = select(Stamp)
    if region:
        q = q.where(Stamp.region == region)
    rows = (await db.execute(q)).scalars().all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "region": s.region,
            "distance_km": float(s.distance_km) if s.distance_km else None,
            "rarity": s.rarity,
        }
        for s in rows
    ]


@router.get("/nearby")
async def nearby(lat: float, lng: float, db: AsyncSession = Depends(get_db)):
    """Stub: return hot courses; geo filter can use PostGIS later."""
    return await hot_courses(db)
