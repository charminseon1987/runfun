import asyncio
import json
import logging
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.jwt_tokens import decode_token

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])

# In-memory fan-out (use Redis pub/sub in production)
_running_subscribers: dict[str, set[WebSocket]] = {}
# user_id(str) → set of their friends' WebSocket connections
_friends_subscribers: dict[str, set[WebSocket]] = {}


async def _get_user_id_from_ws(websocket: WebSocket) -> UUID | None:
    token = websocket.query_params.get("token")
    if not token:
        return None
    return decode_token(token)


@router.websocket("/ws/running/{session_id}")
async def ws_running(websocket: WebSocket, session_id: str):
    await websocket.accept()
    uid = await _get_user_id_from_ws(websocket)
    if uid is None:
        await websocket.close(code=4401)
        return
    _running_subscribers.setdefault(session_id, set()).add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            for ws in list(_running_subscribers.get(session_id, [])):
                try:
                    await ws.send_text(data)
                except Exception:
                    pass
    except WebSocketDisconnect:
        pass
    finally:
        subs = _running_subscribers.get(session_id)
        if subs and websocket in subs:
            subs.discard(websocket)


@router.websocket("/ws/friends")
async def ws_friends(websocket: WebSocket):
    await websocket.accept()
    uid = await _get_user_id_from_ws(websocket)
    if uid is None:
        await websocket.close(code=4401)
        return
    uid_str = str(uid)
    _friends_subscribers.setdefault(uid_str, set()).add(websocket)
    try:
        while True:
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        pass
    finally:
        subs = _friends_subscribers.get(uid_str)
        if subs:
            subs.discard(websocket)


@router.websocket("/ws/chat/{room_id}")
async def ws_chat(websocket: WebSocket, room_id: str):
    await websocket.accept()
    try:
        while True:
            msg = await websocket.receive_text()
            await websocket.send_text(json.dumps({"room": room_id, "echo": msg}))
    except WebSocketDisconnect:
        pass


async def broadcast_friend_running(payload: dict) -> None:
    """러닝을 시작한 사용자의 친구들에게만 알림을 전송합니다."""
    runner_id = payload.get("user_id", "")

    # 친구 목록 조회 (DB에서 runner_id의 친구 user_id 목록 가져오기)
    friend_ids: list[str] = []
    try:
        import uuid as _uuid
        from app.database import AsyncSessionLocal
        from app.models.social import Follow

        async with AsyncSessionLocal() as db:
            from sqlalchemy import select
            result = await db.execute(
                select(Follow.follower_id).where(
                    Follow.followee_id == _uuid.UUID(runner_id)
                )
            )
            friend_ids = [str(row[0]) for row in result.all()]
    except Exception as e:
        logger.warning("broadcast_friend_running: friend lookup failed: %s", e)
        # 폴백: 모든 구독자에게 전송
        dead = []
        for uid_str, ws_set in list(_friends_subscribers.items()):
            for ws in list(ws_set):
                try:
                    await ws.send_json({"type": "friend_running", "payload": payload})
                except Exception:
                    dead.append((uid_str, ws))
        for uid_str, ws in dead:
            _friends_subscribers.get(uid_str, set()).discard(ws)
        return

    # 친구에게만 전송
    dead = []
    for fid in friend_ids:
        for ws in list(_friends_subscribers.get(fid, [])):
            try:
                await ws.send_json({"type": "friend_running", "payload": payload})
            except Exception:
                dead.append((fid, ws))
    for fid, ws in dead:
        _friends_subscribers.get(fid, set()).discard(ws)
