import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.marathon import Marathon, MarathonAlert
from app.models.user import User

router = APIRouter(prefix="/marathons", tags=["marathons"])


@router.get("")
async def list_marathons(
    db: AsyncSession = Depends(get_db),
    region: str | None = None,
    status_filter: str | None = None,
):
    q = select(Marathon)
    if region:
        q = q.where(Marathon.region == region)
    if status_filter:
        q = q.where(Marathon.status == status_filter)
    q = q.order_by(Marathon.race_date)
    rows = (await db.execute(q)).scalars().all()
    return [
        {
            "id": str(m.id),
            "name": m.name,
            "region": m.region,
            "country": m.country,
            "race_date": m.race_date.isoformat() if m.race_date else None,
            "location": m.location,
            "distances": m.distances,
            "status": m.status,
            "apply_url": m.apply_url,
            "apply_start": m.apply_start.isoformat() if m.apply_start else None,
            "apply_end": m.apply_end.isoformat() if m.apply_end else None,
            "entry_fee": m.entry_fee,
            "is_world_major": m.is_world_major,
        }
        for m in rows
    ]


@router.get("/{marathon_id}")
async def marathon_detail(marathon_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    m = await db.get(Marathon, marathon_id)
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": str(m.id),
        "name": m.name,
        "region": m.region,
        "race_date": m.race_date.isoformat() if m.race_date else None,
        "apply_url": m.apply_url,
        "status": m.status,
    }


@router.post("/{marathon_id}/alert")
async def set_alert(
    marathon_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    fcm_token: str | None = None,
    alert_before_days: int = 7,
):
    m = await db.get(Marathon, marathon_id)
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    existing = await db.execute(
        select(MarathonAlert).where(
            MarathonAlert.user_id == user.id,
            MarathonAlert.marathon_id == marathon_id,
        )
    )
    row = existing.scalar_one_or_none()
    if row:
        row.fcm_token = fcm_token
        row.alert_before_days = alert_before_days
    else:
        db.add(
            MarathonAlert(
                user_id=user.id,
                marathon_id=marathon_id,
                fcm_token=fcm_token,
                alert_before_days=alert_before_days,
            )
        )
    await db.flush()
    return {"ok": True}


@router.delete("/{marathon_id}/alert")
async def delete_alert(
    marathon_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    r = await db.execute(
        select(MarathonAlert).where(
            MarathonAlert.user_id == user.id,
            MarathonAlert.marathon_id == marathon_id,
        )
    )
    row = r.scalar_one_or_none()
    if row:
        await db.execute(delete(MarathonAlert).where(MarathonAlert.id == row.id))
    return {"ok": True}
