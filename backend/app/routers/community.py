import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user, get_optional_user
from app.models.post import Post, PostComment, PostLike
from app.models.social import Follow
from app.models.user import User
from app.schemas.community import (
    CommentCreate,
    CommentOut,
    PostCreate,
    PostOut,
    TranslateRequest,
    TranslateResponse,
)
from app.services.translation_service import translate_text

router = APIRouter(prefix="", tags=["community"])


def _post_to_out(
    p: Post,
    author_name: str,
    liked_by_me: bool = False,
    comments_count: int = 0,
) -> PostOut:
    return PostOut(
        id=p.id,
        user_id=p.user_id,
        author_name=author_name,
        content=p.content,
        images=p.images,
        lang=p.lang,
        likes=p.likes,
        region=p.region,
        is_global=p.is_global,
        created_at=p.created_at,
        liked_by_me=liked_by_me,
        comments_count=comments_count,
    )


@router.get("/posts", response_model=list[PostOut])
async def list_posts(
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
    scope: str = "global",
    region: str | None = None,
):
    q = select(Post).order_by(Post.created_at.desc()).limit(50)
    if scope == "global":
        q = q.where(Post.is_global.is_(True))
    elif scope == "following" and user:
        sub = select(Follow.followee_id).where(Follow.follower_id == user.id)
        q = q.where(Post.user_id.in_(sub))
    elif region:
        q = q.where(Post.region == region)
    rows = (await db.execute(q)).scalars().all()
    out: list[PostOut] = []
    for p in rows:
        u = await db.get(User, p.user_id)
        liked = False
        if user:
            lk = await db.execute(
                select(PostLike).where(PostLike.post_id == p.id, PostLike.user_id == user.id)
            )
            liked = lk.scalar_one_or_none() is not None
        cc = await db.execute(select(func.count()).select_from(PostComment).where(PostComment.post_id == p.id))
        cnt = cc.scalar_one() or 0
        out.append(_post_to_out(p, u.name if u else "", liked, int(cnt)))
    return out


@router.post("/posts", response_model=PostOut)
async def create_post(
    body: PostCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    p = Post(
        user_id=user.id,
        session_id=body.session_id,
        content=body.content,
        images=body.images,
        lang=body.lang,
        region=body.region,
        is_global=body.is_global,
    )
    db.add(p)
    await db.flush()
    await db.refresh(p)
    return _post_to_out(p, user.name, False, 0)


@router.post("/posts/{post_id}/like")
async def like_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    p = await db.get(Post, post_id)
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    existing = await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == user.id)
    )
    if existing.scalar_one_or_none():
        return {"ok": True, "likes": p.likes}
    db.add(PostLike(post_id=post_id, user_id=user.id))
    p.likes = (p.likes or 0) + 1
    await db.flush()
    return {"ok": True, "likes": p.likes}


@router.post("/posts/{post_id}/comments", response_model=CommentOut)
async def add_comment(
    post_id: uuid.UUID,
    body: CommentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    p = await db.get(Post, post_id)
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    c = PostComment(post_id=post_id, user_id=user.id, content=body.content)
    db.add(c)
    await db.flush()
    await db.refresh(c)
    return CommentOut(
        id=c.id,
        post_id=c.post_id,
        user_id=c.user_id,
        author_name=user.name,
        content=c.content,
        created_at=c.created_at,
    )


@router.get("/posts/{post_id}/comments", response_model=list[CommentOut])
async def get_comments(post_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    p = await db.get(Post, post_id)
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    q = await db.execute(
        select(PostComment).where(PostComment.post_id == post_id).order_by(PostComment.created_at)
    )
    out = []
    for c in q.scalars().all():
        u = await db.get(User, c.user_id)
        out.append(
            CommentOut(
                id=c.id,
                post_id=c.post_id,
                user_id=c.user_id,
                author_name=u.name if u else "",
                content=c.content,
                created_at=c.created_at,
            )
        )
    return out


@router.post("/follow/{user_id}")
async def follow_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    exists = await db.execute(
        select(Follow).where(Follow.follower_id == user.id, Follow.followee_id == user_id)
    )
    if exists.scalar_one_or_none():
        return {"ok": True}
    db.add(Follow(follower_id=user.id, followee_id=user_id))
    await db.flush()
    return {"ok": True}


@router.delete("/follow/{user_id}")
async def unfollow_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from sqlalchemy import delete

    await db.execute(delete(Follow).where(Follow.follower_id == user.id, Follow.followee_id == user_id))
    return {"ok": True}


@router.get("/users/{user_id}/profile")
async def profile(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    u = await db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="Not found")
    followers = await db.execute(select(func.count()).select_from(Follow).where(Follow.followee_id == user_id))
    following = await db.execute(select(func.count()).select_from(Follow).where(Follow.follower_id == user_id))
    posts = await db.execute(select(func.count()).select_from(Post).where(Post.user_id == user_id))
    return {
        "id": str(u.id),
        "name": u.name,
        "avatar_url": u.avatar_url,
        "runner_grade": u.runner_grade,
        "followers": int(followers.scalar_one() or 0),
        "following": int(following.scalar_one() or 0),
        "posts": int(posts.scalar_one() or 0),
    }


@router.post("/translate", response_model=TranslateResponse)
async def translate(body: TranslateRequest, user: User = Depends(get_current_user)):
    text, src = await translate_text(body.text, body.target_lang)
    return TranslateResponse(translated_text=text, source_lang=src)
