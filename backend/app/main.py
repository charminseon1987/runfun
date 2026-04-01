import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import agent, auth, community, courses, friends, link_preview, marathons, media, running, stamps, websocket
from app.seed import seed_if_empty
from app.services.firebase_service import init_firebase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_firebase()
    try:
        await seed_if_empty()
    except Exception as e:
        logger.warning("Seed skipped (DB may be down): %s", e)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="RunMate AI API", version="2.0.0", lifespan=lifespan)

    origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/v1")
    app.include_router(running.router, prefix="/v1")
    app.include_router(stamps.router, prefix="/v1")
    app.include_router(marathons.router, prefix="/v1")
    app.include_router(link_preview.router, prefix="/v1")
    app.include_router(courses.router, prefix="/v1")
    app.include_router(friends.router, prefix="/v1")
    app.include_router(community.router, prefix="/v1")
    app.include_router(agent.router, prefix="/v1")
    app.include_router(media.router, prefix="/v1")
    app.include_router(websocket.router)

    @app.get("/health")
    async def health():
        return {"status": "ok", "version": "2.0.0"}

    return app


app = create_app()
