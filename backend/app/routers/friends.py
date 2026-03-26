import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.social import Friendship
from app.models.user import User
from app.services.friend_service import list_friends_running

router = APIRouter(prefix="/friends", tags=["friends"])


class GpsShareBody(BaseModel):
    enabled: bool


@router.get("")
async def friends_list(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    q = await db.execute(
        select(Friendship).where(
            Friendship.user_id == user.id,
            Friendship.status == "accepted",
        )
    )
    out = []
    for f in q.scalars().all():
        u = await db.get(User, f.friend_id)
        if u:
            out.append({"id": str(u.id), "name": u.name, "avatar_url": u.avatar_url})
    return out


@router.get("/running-now")
async def running_now(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await list_friends_running(db, user.id)


@router.post("/request")
async def request_friend(
    friend_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if friend_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot friend yourself")
    existing = await db.execute(
        select(Friendship).where(
            Friendship.user_id == user.id,
            Friendship.friend_id == friend_id,
        )
    )
    if existing.scalar_one_or_none():
        return {"ok": True}
    db.add(Friendship(user_id=user.id, friend_id=friend_id, status="pending"))
    await db.flush()
    return {"ok": True}


@router.put("/{friendship_id}/accept")
async def accept_friend(
    friendship_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    f = await db.get(Friendship, friendship_id)
    if not f or f.friend_id != user.id:
        raise HTTPException(status_code=404, detail="Not found")
    f.status = "accepted"
    await db.flush()
    return {"ok": True}


@router.put("/gps-share")
async def gps_share(body: GpsShareBody, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user.gps_share = body.enabled
    await db.flush()
    return {"ok": True, "gps_share": user.gps_share}


@router.post("/{friend_id}/cheer")
async def cheer(friend_id: uuid.UUID, user: User = Depends(get_current_user)):
    return {"ok": True, "message": "cheer sent", "from": str(user.id), "to": str(friend_id)}
