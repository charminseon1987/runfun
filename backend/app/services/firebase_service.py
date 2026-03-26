import logging
import os

logger = logging.getLogger(__name__)

_firebase_app = None


def init_firebase() -> None:
    global _firebase_app
    if _firebase_app is not None:
        return
    path = os.environ.get("FIREBASE_CREDENTIALS_PATH", "").strip()
    if not path or not os.path.isfile(path):
        logger.warning("Firebase credentials not configured; Google auth verification disabled.")
        return
    try:
        import firebase_admin
        from firebase_admin import credentials

        cred = credentials.Certificate(path)
        _firebase_app = firebase_admin.initialize_app(cred)
    except Exception as e:
        logger.exception("Firebase init failed: %s", e)


def verify_google_id_token(id_token: str) -> dict | None:
    init_firebase()
    if _firebase_app is None:
        return None
    try:
        from firebase_admin import auth

        decoded = auth.verify_id_token(id_token)
        return decoded
    except Exception as e:
        logger.warning("verify_id_token failed: %s", e)
        return None
