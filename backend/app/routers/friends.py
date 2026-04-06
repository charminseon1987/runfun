import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.running_session import RunningSession
from app.models.social import Friendship, JoinRunInvite
from app.models.user import User
from app.services.friend_service import list_friends_running

router = APIRouter(prefix="/friends", tags=["friends"])


class GpsShareBody(BaseModel):
    enabled: bool


class JoinInviteCreateBody(BaseModel):
    friend_id: uuid.UUID
    runner_session_id: uuid.UUID


class JoinInviteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    inviter_user_id: uuid.UUID
    invited_friend_id: uuid.UUID
    runner_session_id: uuid.UUID
    status: str
    created_at: datetime
    accepted_at: datetime | None
    inviter_name: str | None = None
    inviter_avatar_url: str | None = None


def _invite_to_out(
    invite: JoinRunInvite,
    inviter_name: str | None = None,
    inviter_avatar_url: str | None = None,
) -> JoinInviteOut:
    return JoinInviteOut(
        id=invite.id,
        inviter_user_id=invite.inviter_user_id,
        invited_friend_id=invite.invited_friend_id,
        runner_session_id=invite.runner_session_id,
        status=invite.status,
        created_at=invite.created_at,
        accepted_at=invite.accepted_at,
        inviter_name=inviter_name,
        inviter_avatar_url=inviter_avatar_url,
    )


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


@router.post("/join-invites", response_model=JoinInviteOut)
async def create_join_invite(
    body: JoinInviteCreateBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if body.friend_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot invite yourself")

    relation = await db.execute(
        select(Friendship).where(
            Friendship.status == "accepted",
            Friendship.user_id == user.id,
            Friendship.friend_id == body.friend_id,
        )
    )
    if relation.scalar_one_or_none() is None:
        raise HTTPException(status_code=403, detail="Friendship not accepted")

    session = await db.get(RunningSession, body.runner_session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Running session not found")
    if session.ended_at is not None:
        raise HTTPException(status_code=400, detail="Running session already ended")

    existing = await db.execute(
        select(JoinRunInvite).where(
            JoinRunInvite.runner_session_id == body.runner_session_id,
            JoinRunInvite.invited_friend_id == body.friend_id,
            JoinRunInvite.status == "pending",
        )
    )
    invite = existing.scalar_one_or_none()
    if invite is None:
        invite = JoinRunInvite(
            inviter_user_id=user.id,
            invited_friend_id=body.friend_id,
            runner_session_id=body.runner_session_id,
            status="pending",
        )
        db.add(invite)
        await db.flush()
        await db.refresh(invite)

    return _invite_to_out(invite, user.name, user.avatar_url)


@router.get("/join-invites/pending", response_model=list[JoinInviteOut])
async def pending_join_invites(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = await db.execute(
        select(JoinRunInvite, User)
        .join(User, User.id == JoinRunInvite.inviter_user_id)
        .where(
            JoinRunInvite.invited_friend_id == user.id,
            JoinRunInvite.status == "pending",
        )
        .order_by(JoinRunInvite.created_at.desc())
    )
    out: list[JoinInviteOut] = []
    for invite, inviter in rows.all():
        out.append(
            _invite_to_out(invite, inviter.name, inviter.avatar_url)
        )
    return out


@router.post("/join-invites/{invite_id}/accept", response_model=JoinInviteOut)
async def accept_join_invite(
    invite_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    invite = await db.get(JoinRunInvite, invite_id)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.invited_friend_id != user.id:
        raise HTTPException(status_code=403, detail="Not your invite")
    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="Invite is not pending")

    session = await db.get(RunningSession, invite.runner_session_id)
    if not session or session.ended_at is not None:
        raise HTTPException(status_code=400, detail="Host run is not active")

    invite.status = "accepted"
    invite.accepted_at = datetime.now(timezone.utc)
    await db.flush()

    inviter = await db.get(User, invite.inviter_user_id)
    return _invite_to_out(
        invite,
        inviter.name if inviter else None,
        inviter.avatar_url if inviter else None,
    )
