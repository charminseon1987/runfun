from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.deps import get_current_user
from app.models.user import User
from app.agents.orchestrator import run_agent_chat

router = APIRouter(prefix="/agent", tags=["agent"])


class ChatBody(BaseModel):
    message: str
    lat: float | None = None
    lng: float | None = None


@router.post("/chat")
async def chat(body: ChatBody, user: User = Depends(get_current_user)):
    loc = {}
    if body.lat is not None and body.lng is not None:
        loc = {"lat": body.lat, "lng": body.lng}
    result = await run_agent_chat(str(user.id), body.message, loc)
    # run_agent_chat이 이미 올바른 형식을 반환하지만 하위 호환성 유지
    return result


@router.get("/recommend/course")
async def recommend_course(user: User = Depends(get_current_user)):
    return await run_agent_chat(str(user.id), "추천 코스 알려줘")


@router.get("/recommend/gear")
async def recommend_gear(user: User = Depends(get_current_user)):
    return await run_agent_chat(str(user.id), "러닝화 추천해줘")
