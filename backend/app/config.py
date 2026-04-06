from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    secret_key: str = "change-me"
    allowed_origins: str = (
        "http://localhost:8080,http://127.0.0.1:8080,"
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5555,http://127.0.0.1:5555"
    )

    # .env 권장: Supabase URI (postgresql+psycopg://...?sslmode=require). 아래는 로컬 Postgres 폴백 예시.
    database_url: str = "postgresql+psycopg://postgres:password@localhost:5432/runmate"
    redis_url: str = "redis://localhost:6379/0"

    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-20250514"

    google_maps_api_key: str = ""
    firebase_credentials_path: str = ""

    access_token_expire_minutes: int = 60 * 24 * 7

    # Supabase Storage (냉장고 이미지 업로드 — 비어 있으면 data URL 폴백)
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    fridge_storage_bucket: str = "fridge-images"


@lru_cache
def get_settings() -> Settings:
    return Settings()
