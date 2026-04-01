import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.running_session import RunningSession
from app.models.user import User
from app.schemas.running import RunningEnd, RunningSessionOut, RunningStart, RunningUpdate
from app.services.share_card_service import render_running_card_png
from app.services.stamp_service import verify_stamp_for_session

router = APIRouter(prefix="/running", tags=["running"])


@router.post("/start", response_model=RunningSessionOut)
async def start_run(
    body: RunningStart,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    started = body.started_at or datetime.now(timezone.utc)
    session = RunningSession(user_id=user.id, started_at=started, route=[])
    db.add(session)
    await db.flush()
    await db.refresh(session)
    try:
        from app.routers.websocket import broadcast_friend_running

        await broadcast_friend_running(
            {
                "user_id": str(user.id),
                "name": user.name,
                "session_id": str(session.id),
            }
        )
    except Exception:
        pass
    return session


@router.post("/update/{session_id}")
async def update_run(
    session_id: uuid.UUID,
    body: RunningUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = await db.get(RunningSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    session.route = [p.model_dump() for p in body.route]
    await db.flush()
    return {"ok": True}


@router.post("/end/{session_id}", response_model=RunningSessionOut)
async def end_run(
    session_id: uuid.UUID,
    body: RunningEnd,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = await db.get(RunningSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    session.ended_at = body.ended_at or datetime.now(timezone.utc)
    session.route = [p.model_dump() for p in body.route] if body.route else session.route
    session.distance_km = body.distance_km
    session.duration_sec = body.duration_sec
    session.avg_pace = body.avg_pace
    session.calories = body.calories
    await db.flush()

    earned = await verify_stamp_for_session(db, user.id, session)
    if earned:
        session.course_id = earned[0]

    await db.refresh(session)
    return session


@router.get("/stats/weekly")
async def weekly_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """현재 주(월~일) 러닝 통계를 반환합니다."""
    now = datetime.now(timezone.utc)
    # 이번 주 월요일 00:00 UTC
    week_start = (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    result = await db.execute(
        select(RunningSession).where(
            RunningSession.user_id == user.id,
            RunningSession.started_at >= week_start,
            RunningSession.ended_at.is_not(None),
        )
    )
    sessions = list(result.scalars().all())
    total_km = sum(float(s.distance_km) for s in sessions if s.distance_km)
    run_count = len(sessions)
    paces = [float(s.avg_pace) for s in sessions if s.avg_pace]
    avg_pace = sum(paces) / len(paces) if paces else None
    return {
        "total_km": round(total_km, 2),
        "run_count": run_count,
        "avg_pace": round(avg_pace, 2) if avg_pace else None,
        "week_start": week_start.isoformat(),
    }


@router.get("/history", response_model=list[RunningSessionOut])
async def history(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    limit: int = 50,
):
    q = await db.execute(
        select(RunningSession)
        .where(RunningSession.user_id == user.id)
        .order_by(RunningSession.started_at.desc())
        .limit(limit)
    )
    return list(q.scalars().all())


@router.get("/{session_id}/share-card")
async def share_card_png(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = await db.get(RunningSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    png = await render_running_card_png(db, session_id)
    if not png:
        raise HTTPException(status_code=404, detail="Could not render")
    return Response(content=png, media_type="image/png")


@router.get("/{session_id}", response_model=RunningSessionOut)
async def get_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = await db.get(RunningSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
