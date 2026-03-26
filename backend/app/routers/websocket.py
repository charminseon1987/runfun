import asyncio
import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from app.services.jwt_tokens import decode_token

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])

# In-memory fan-out (use Redis pub/sub in production)
_running_subscribers: dict[str, set[WebSocket]] = {}
_friends_subscribers: set[WebSocket] = set()


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
    _friends_subscribers.add(websocket)
    try:
        while True:
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping", "user": str(uid)})
    except WebSocketDisconnect:
        pass
    finally:
        _friends_subscribers.discard(websocket)


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
    dead = []
    for ws in list(_friends_subscribers):
        try:
            await ws.send_json({"type": "friend_running", "payload": payload})
        except Exception:
            dead.append(ws)
    for ws in dead:
        _friends_subscribers.discard(ws)
