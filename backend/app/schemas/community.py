import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PostCreate(BaseModel):
    content: str | None = None
    images: list[str] | None = None
    session_id: uuid.UUID | None = None
    region: str | None = None
    is_global: bool = False
    lang: str = "ko"


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    author_name: str = ""
    content: str | None
    images: list[Any] | None
    lang: str
    likes: int
    region: str | None
    is_global: bool
    created_at: datetime
    liked_by_me: bool = False
    comments_count: int = 0


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    post_id: uuid.UUID
    user_id: uuid.UUID
    author_name: str = ""
    content: str
    created_at: datetime


class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "ko"


class TranslateResponse(BaseModel):
    translated_text: str
    source_lang: str | None = None
