from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel

from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import DevLoginRequest, GoogleAuthRequest, TokenResponse
from app.services.firebase_service import verify_google_id_token
from app.services.jwt_tokens import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google", response_model=TokenResponse)
async def auth_google(body: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    decoded = verify_google_id_token(body.id_token)
    settings = get_settings()

    if decoded:
        uid = decoded.get("uid") or decoded.get("sub")
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        email = decoded.get("email") or f"{uid}@firebase.runmate"
        name = (decoded.get("name") or email.split("@")[0])[:50]
        firebase_uid = str(uid)
    elif settings.app_env == "development":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid id_token. Use POST /auth/dev-login in development.",
        )
    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")

    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user = result.scalar_one_or_none()
    if user is None:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
    if user is None:
        user = User(name=name, email=email, firebase_uid=firebase_uid)
        db.add(user)
        await db.flush()
    else:
        user.firebase_uid = firebase_uid
        user.name = name

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


class GoogleProfileRequest(BaseModel):
    sub: str
    email: str
    name: str
    picture: str | None = None


@router.post("/google-profile", response_model=TokenResponse)
async def auth_google_profile(body: GoogleProfileRequest, db: AsyncSession = Depends(get_db)):
    """Expo OAuth 흐름에서 Google userinfo API로 가져온 프로필로 RunMate JWT를 발급합니다.
    Firebase 미설정 환경(개발/MVP)에서도 동작합니다."""
    email = body.email.strip().lower()
    name = (body.name or email.split("@")[0])[:50]
    firebase_uid = f"google:{body.sub}"

    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user = result.scalar_one_or_none()
    if user is None:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
    if user is None:
        user = User(name=name, email=email, firebase_uid=firebase_uid, avatar_url=body.picture)
        db.add(user)
        await db.flush()
    else:
        user.firebase_uid = firebase_uid
        user.name = name
        if body.picture:
            user.avatar_url = body.picture

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.post("/dev-login", response_model=TokenResponse)
async def dev_login(body: DevLoginRequest, db: AsyncSession = Depends(get_db)):
    settings = get_settings()
    if settings.app_env != "development":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    result = await db.execute(select(User).where(User.email == str(body.email)))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(name=body.name[:50], email=str(body.email), firebase_uid=None)
        db.add(user)
        await db.flush()
    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh():
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Use /auth/google or dev-login")


@router.post("/logout")
async def logout():
    return {"ok": True}
