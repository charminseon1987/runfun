# RunMate AI — 로컬 실행

## 사전 준비

- Python 3.11+ (권장) 또는 3.13 + `pip`
- **[Supabase](https://supabase.com)** 프로젝트 (PostgreSQL)
- Flutter 3.27+ (모바일 앱 빌드 시)
- Redis는 선택 사항 — 실시간 캐시 등 쓸 때만 로컬에서 `docker compose up -d redis` (DB용 Docker 불필요)

## 1. Supabase DB 연결

1. Supabase 대시보드에서 프로젝트 생성
2. **Project Settings → Database → Connection string → URI** 복사
3. `backend/.env` 에 `DATABASE_URL` 로 넣되, 이 프로젝트는 **SQLAlchemy 비동기용 드라이버**를 쓰므로 스킴을 다음처럼 맞춥니다.

   - Supabase가 `postgresql://...` 로 주면 → **`postgresql+psycopg://...`** 로 바꿉니다.
   - 끝에 **`?sslmode=require`** 가 없으면 추가합니다 (TLS 필수).

   예시:

   ```env
   DATABASE_URL=postgresql+psycopg://postgres.xxxxx:비밀번호@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```

   **Alembic 마이그레이션**은 트랜잭션/DDL 이슈를 줄이려면 **Direct connection(호스트 `db.<ref>.supabase.co`, 포트 `5432`)** 문자열을 쓰는 것을 권장합니다. (대시보드에 동일하게 표시됨)

4. DB 비밀번호에 `@`, `#` 등이 있으면 **URL 인코딩** 후 넣습니다.

## 2. 백엔드

```bash
cd backend
copy .env.example .env
# .env 안의 DATABASE_URL 을 Supabase 값으로 수정

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: `http://127.0.0.1:8000/health`
- 문서: `http://127.0.0.1:8000/docs`
- 개발 로그인: `POST /v1/auth/dev-login` (`APP_ENV=development` 일 때만)

### DB/API 통합 검증 (선택)

Supabase에 마이그레이션 적용한 뒤:

```bash
cd backend
python scripts/verify_db_integration.py
```

## 3. Flutter

저장소에 **`android/`**, **`web/`** 플랫폼 폴더가 포함되어 있습니다. **Flutter SDK** 설치 후:

**Windows (PowerShell)**

```powershell
cd frontend
.\bootstrap.ps1    # android/local.properties 에 flutter.sdk 기록 (또는 수동 편집)
flutter pub get
flutter run          # 연결 기기/에뮬레이터
# 또는: flutter run -d chrome
```

- **iOS** 폴더가 필요하면 (macOS에서) `flutter create . --platforms=ios` 로 생성합니다.
- `.env` 의 `API_BASE_URL`: Android 에뮬레이터 **`http://10.0.2.2:8000/v1`**, 웹/데스크톱 **`http://127.0.0.1:8000/v1`**.
- 지도 타일이 보이려면 Android `AndroidManifest.xml` 의 `YOUR_ANDROID_MAPS_API_KEY` 를 [Google Maps SDK](https://developers.google.com/maps/documentation/android-sdk/start) 키로 바꿉니다.
- 현재 앱은 **Firebase 없이** 빌드되도록 구성되어 있습니다 (개발 로그인은 `/auth/dev-login`).

## 왜 로컬 Docker Postgres 안 쓰나요?

개발·배포 DB를 **Supabase 한곳**에 두면 팀·CI·스테이징과 동일한 Postgres 기능(JSONB, 확장)을 쓰기 쉽고, 로컬에 Docker Desktop 없이도 동작합니다. Redis만 필요하면 `docker-compose.yml` 의 `redis` 서비스만 선택 실행하면 됩니다.

## 참고

- 드라이버는 `psycopg`(비동기) + Alembic용 `psycopg2-binary`(동기) 조합입니다.
- ChromaDB / Celery 는 `requirements.txt` 에서 선택 사항입니다.
