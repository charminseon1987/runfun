"""
RunMate DB/API 통합 검증 (Supabase PostgreSQL + FastAPI TestClient).

사용법 (backend 디렉터리에서):
  pip install -r requirements.txt
  copy .env.example .env   # 최초 1회 — DATABASE_URL 을 Supabase URI로 설정 (postgresql+psycopg, sslmode=require)
  alembic upgrade head
  python scripts/verify_db_integration.py
"""

from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
os.chdir(BACKEND)
sys.path.insert(0, str(BACKEND))

# .env 없으면 예시 복사
_env = BACKEND / ".env"
if not _env.is_file():
    shutil.copy(BACKEND / ".env.example", _env)
    print(f"[info] {_env} 생성 (.env.example 복사)")

from dotenv import load_dotenv

load_dotenv(_env)


def _check_db_url() -> str:
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        print("[error] DATABASE_URL 이 비어 있습니다. backend/.env 를 확인하세요.")
        sys.exit(1)
    return url


def _route_inside_hangang_polygon() -> list[dict]:
    """시드된 hangang-ttukseom 폴리곤 내부를 지그재그로 통과하는 경로."""
    pts: list[dict] = []
    for i in range(40):
        t = i / 39.0
        lat = 37.521 + t * 0.018
        lng = 127.051 + ((i % 2) * 0.015) + (t * 0.01)
        pts.append({"lat": lat, "lng": lng, "timestamp": f"2026-03-24T12:{i:02d}:00Z"})
    return pts


def main() -> None:
    _check_db_url()

    print("[0/6] alembic upgrade head (마이그레이션 적용)…")
    try:
        import subprocess

        subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=str(BACKEND),
            check=True,
            env={**os.environ},
        )
    except subprocess.CalledProcessError as e:
        print(f"[error] alembic 실패: {e}")
        sys.exit(1)

    try:
        from fastapi.testclient import TestClient  # noqa: E402
        from app.main import app
    except Exception as e:
        print(f"[error] 앱 import 실패: {e}")
        sys.exit(1)

    print("[1/6] TestClient 로 앱 기동 (lifespan: 시드 포함)…")
    try:
        client = TestClient(app)
    except Exception as e:
        print(f"[error] TestClient 생성 실패: {e}")
        sys.exit(1)

    print("[2/6] POST /v1/auth/dev-login …")
    r = client.post(
        "/v1/auth/dev-login",
        json={"email": "integration@runmate.test", "name": "Integration"},
    )
    if r.status_code != 200:
        print(f"[error] dev-login {r.status_code}: {r.text}")
        sys.exit(1)
    token = r.json()["access_token"]
    h = {"Authorization": f"Bearer {token}"}

    print("[3/6] GET /v1/stamps (시드 스탬프 확인)…")
    r = client.get("/v1/stamps", headers=h)
    if r.status_code != 200:
        print(f"[error] stamps {r.status_code}: {r.text}")
        sys.exit(1)
    stamps = r.json()
    ids = {s["id"] for s in stamps}
    if "hangang-ttukseom" not in ids:
        print("[warn] hangang-ttukseom 스탬프 없음 — DB 시드 또는 마이그레이션 확인")
    earned_before = {s["id"]: s.get("earned") for s in stamps}

    print("[4/6] 러닝 세션 시작 → 업데이트 → 종료 (경로 DB 저장 + 스탬프 검증)…")
    r = client.post("/v1/running/start", json={}, headers=h)
    if r.status_code != 200:
        print(f"[error] running/start {r.status_code}: {r.text}")
        sys.exit(1)
    sid = r.json()["id"]
    route = _route_inside_hangang_polygon()

    r = client.post(f"/v1/running/update/{sid}", json={"route": route[:10]}, headers=h)
    if r.status_code != 200:
        print(f"[error] running/update {r.status_code}: {r.text}")
        sys.exit(1)

    r = client.post(
        f"/v1/running/end/{sid}",
        json={
            "distance_km": 5.2,
            "duration_sec": 2400,
            "avg_pace": 7.5,
            "calories": 320,
            "route": route,
        },
        headers=h,
    )
    if r.status_code != 200:
        print(f"[error] running/end {r.status_code}: {r.text}")
        sys.exit(1)
    session = r.json()
    print(f"      세션 id={session['id']} distance_km={session.get('distance_km')}")

    print("[5/6] GET /v1/running/history …")
    r = client.get("/v1/running/history", headers=h)
    if r.status_code != 200:
        print(f"[error] history {r.status_code}: {r.text}")
        sys.exit(1)
    hist = r.json()
    if not hist:
        print("[error] 히스토리가 비어 있음")
        sys.exit(1)
    print(f"      기록 {len(hist)}건 (최신 거리 {hist[0].get('distance_km')} km)")

    r = client.get("/v1/stamps", headers=h)
    stamps2 = r.json()
    earned_after = {s["id"]: s.get("earned") for s in stamps2}
    if earned_after.get("hangang-ttukseom") and not earned_before.get("hangang-ttukseom"):
        print("      스탬프 hangang-ttukseom 획득 감지")
    elif earned_after.get("hangang-ttukseom"):
        print("      스탬프 hangang-ttukseom 이미 획득 상태")
    else:
        print(
            "      [warn] hangang-ttukseom 미획득 — 경로·폴리곤 겹침 비율 조건(70%) 미충족일 수 있음"
        )

    print("[6/6] POST /v1/posts + GET /v1/posts (피드)…")
    r = client.post(
        "/v1/posts",
        json={"content": "DB 통합 테스트 포스트", "is_global": True, "lang": "ko"},
        headers=h,
    )
    if r.status_code != 200:
        print(f"[error] posts create {r.status_code}: {r.text}")
        sys.exit(1)
    r = client.get("/v1/posts?scope=global", headers=h)
    if r.status_code != 200:
        print(f"[error] posts list {r.status_code}: {r.text}")
        sys.exit(1)
    posts = r.json()
    if not posts:
        print("[error] 피드가 비어 있음")
        sys.exit(1)
    print(f"      글로벌 피드 {len(posts)}건 (첫 글: {posts[0].get('content', '')[:40]}…)")

    print("\n[OK] PostgreSQL 연동 후 러닝·스탬프·피드 흐름 검증 완료.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        err = str(e).lower()
        if any(
            x in err
            for x in ("connection refused", "could not connect", "operationalerror", "name or service not known")
        ):
            print(
                "\n[error] PostgreSQL(Supabase)에 연결할 수 없습니다.\n"
                "  1) Supabase 프로젝트가 활성인지, 비밀번호·호스트가 맞는지 확인\n"
                "  2) DATABASE_URL: postgresql+psycopg://... ?sslmode=require\n"
                "  3) 방화벽/회사망에서 5432(또는 pooler 포트) 허용 여부 확인\n"
                f"\n원본 오류: {e}"
            )
            sys.exit(2)
        raise
