# RunMate AI — 개발 PRD v2.0

> **작성일**: 2026.03.24  
> **버전**: v2.0 (Flutter 전환)  
> **개발 환경**: Cursor IDE  
> **기술 스택**: Flutter + FastAPI + LangGraph + Claude API + Google Cloud

---

## 1. 프로젝트 개요

### 1.1 앱 비전
**RunMate AI**는 다중 에이전트(Multi-Agent) 시스템 기반의 글로벌 러닝 플랫폼이다.  
최상위 Orchestrator Agent가 사용자 의도를 분석하고 10개의 전문 Sub-Agent를 자율 운영한다.  
프론트엔드는 **Flutter**로 iOS / Android 단일 코드베이스로 개발한다.

### 1.2 핵심 차별점
- LangGraph 기반 페르소나 다중 에이전트 워크플로우
- 친구 실시간 러닝 감지 → 토스(Toss) 스타일 플로팅 알림
- 코스 완주 스탬프 수집 시스템 (도감/여권 개념)
- 전국 마라톤 일정 + 세계 7대 마라톤 신청 연동
- GPS 기록 → 영상 편집 → SNS 원스텝 업로드 파이프라인
- **Google 생태계 풀 통합** (Maps, Firebase, Cloud, Fit)

### 1.3 타겟 플랫폼
| 플랫폼 | 프레임워크 | 최소 버전 |
|--------|-----------|----------|
| iOS | Flutter 3.27+ | iOS 16.0+ |
| Android | Flutter 3.27+ | Android 8.0 (API 26+) |

---

## 2. 다중 에이전트 아키텍처

### 2.1 전체 구조

```
사용자 입력 (자연어 / 버튼)
        │
        ▼
┌────────────────────────────────┐
│   🎯 Orchestrator Agent         │
│   - 의도 분석 (Claude API)      │
│   - Sub-Agent 라우팅            │
│   - 응답 통합 및 반환           │
└────────────┬───────────────────┘
             │ LangGraph conditional_edge
             ▼
   ┌─────────────────────┐
   │    Intent Router    │
   │  (StateGraph 분기)  │
   └──────┬──────────────┘
          │
    ┌─────┴─────────────────────────────────────────┐
    │                                               │
    ▼                                               ▼
Sub-Agent Group A (정보/일정)       Sub-Agent Group B (기록/소통)
─────────────────────────          ──────────────────────────────
🏅 Marathon Schedule Agent         📍 GPS Record Tracker Agent
🌐 World Marathon Agent            📸 Media Publisher Agent
🗺️  Course Discovery Agent         👥 Friend Running Alert Agent
✈️  Travel Running Agent           💬 Global Chat Agent
👟 Gear Advisor Agent              🏅 Stamp Collection Agent

          │                                         │
          └──────────────────┬──────────────────────┘
                             ▼
               ┌──────────────────────────┐
               │    Shared Memory Layer    │
               │  LangGraph State          │
               │  ChromaDB  (벡터 검색)    │
               │  PostgreSQL (기록/유저)   │
               │  Redis      (캐시/실시간) │
               │  Firebase   (Auth/FCM)   │
               └──────────────────────────┘
```

### 2.2 Agent별 역할 정의

| Agent | 역할 | 주요 Tool | 데이터 소스 |
|-------|------|-----------|------------|
| **Orchestrator** | 의도 파악, 라우팅, 응답 통합 | Claude API, LangGraph | - |
| **Marathon Schedule** | 전국 마라톤 일정, 신청 알림 | Web Search, Calendar | marathongo.co.kr, kaf.or.kr |
| **World Marathon** | 세계 7대 마라톤 정보/신청 | Web Search, Push | 각 대회 공식 사이트 |
| **Course Discovery** | 지역별·글로벌 핫코스 추천 | Google Maps API, Vector | ChromaDB 코스 DB |
| **Travel Running** | 해외 여행지 러닝코스 | Web Search, Maps | 글로벌 러닝 커뮤니티 |
| **Gear Advisor** | 러닝화·용품 큐레이션 | Product Search | 스포츠 쇼핑몰 API |
| **GPS Record Tracker** | 실시간 GPS 기록, 분석 | Google Maps SDK, ML | 기기 GPS + Google Fit |
| **Media Publisher** | 사진·영상 편집, SNS 업로드 | FFmpeg, SNS APIs | 기기 갤러리 |
| **Friend Alert** | 주변 친구 러닝 감지 알림 | GeoFencing, FCM | 친구 GPS (동의 필요) |
| **Stamp Collection** | 코스 완주 스탬프 관리 | GPS 검증 | PostgreSQL |
| **Global Chat** | 다국어 커뮤니티 소통 | Claude Translation, WS | PostgreSQL, Redis |

### 2.3 LangGraph 워크플로우 핵심 코드

```python
# backend/app/agents/orchestrator.py

from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages

class RunMateState(TypedDict):
    messages:       Annotated[list, add_messages]
    intent:         str        # 분류된 사용자 의도
    agent_result:   dict       # Sub-Agent 결과
    user_location:  dict       # GPS 좌표 {lat, lng}
    user_id:        str

def intent_router(state: RunMateState) -> str:
    route_map = {
        "marathon_schedule":  "marathon_agent",
        "world_marathon":     "world_marathon_agent",
        "course_discovery":   "course_agent",
        "gps_record":         "gps_agent",
        "media_publish":      "media_agent",
        "friend_alert":       "friend_agent",
        "stamp":              "stamp_agent",
        "gear_advice":        "gear_agent",
        "community":          "chat_agent",
        "travel_running":     "travel_agent",
    }
    return route_map.get(state["intent"], "orchestrator")

workflow = StateGraph(RunMateState)

# 노드 등록
workflow.add_node("orchestrator",         orchestrator_node)
workflow.add_node("marathon_agent",       marathon_node)
workflow.add_node("world_marathon_agent", world_marathon_node)
workflow.add_node("course_agent",         course_node)
workflow.add_node("gps_agent",            gps_node)
workflow.add_node("media_agent",          media_node)
workflow.add_node("friend_agent",         friend_node)
workflow.add_node("stamp_agent",          stamp_node)
workflow.add_node("gear_agent",           gear_node)
workflow.add_node("chat_agent",           chat_node)
workflow.add_node("travel_agent",         travel_node)

workflow.set_entry_point("orchestrator")
workflow.add_conditional_edges("orchestrator", intent_router)

for node in ["marathon_agent","world_marathon_agent","course_agent",
             "gps_agent","media_agent","friend_agent","stamp_agent",
             "gear_agent","chat_agent","travel_agent"]:
    workflow.add_edge(node, END)

app = workflow.compile()
```

---

## 3. 기능 명세

### 3.1 기능 우선순위

| 우선순위 | 기능 | Agent | 복잡도 |
|---------|------|-------|-------|
| P0 | GPS 러닝 기록 (거리·페이스·칼로리) | GPS Record | 높음 |
| P0 | 전국 마라톤 일정 + 신청 연동 | Marathon Schedule | 중간 |
| P0 | 친구 러닝 중 실시간 알림 | Friend Alert | 높음 |
| P0 | 러닝코스 스탬프 수집 | Stamp Collection | 중간 |
| P1 | 지역별 핫코스 추천 | Course Discovery | 중간 |
| P1 | 세계 7대 마라톤 일정 | World Marathon | 중간 |
| P1 | SNS 원스텝 업로드 | Media Publisher | 높음 |
| P1 | 러닝 영상·사진 편집 | Media Publisher | 높음 |
| P2 | 글로벌 커뮤니티 | Global Chat | 높음 |
| P2 | 러닝화·용품 추천 | Gear Advisor | 낮음 |
| P2 | 해외 여행지 코스 | Travel Running | 낮음 |

---

### 3.2 기능 상세

#### ① GPS 러닝 기록 (P0)
```
기능:
  - 실시간 GPS 트래킹 (거리, 페이스, 칼로리, 고도)
  - 러닝 시작 / 일시정지 / 중지
  - 기록 히스토리 저장 및 조회
  - Google Maps 코스 경로 오버레이

Flutter 구현:
  - geolocator 패키지로 GPS 스트림 수신
  - google_maps_flutter로 실시간 경로 폴리라인 그리기
  - health 패키지로 Google Fit 동기화
  - background_locator_2로 백그라운드 GPS 유지

입력:  GPS 좌표 스트림 (1초 간격)
출력:  RunningSession { distance, pace, calories, elevation, route, duration }

검증:  속도 > 0.5m/s 이상일 때만 거리 누적
       배터리 절약 모드: 5초 간격 샘플링
```

#### ② 전국 마라톤 일정 (P0)
```
기능:
  - 전국 + 세계 마라톤 대회 DB
  - 지역 필터 (수도권/부산·경남/대구·경북/전라/제주/해외)
  - 신청 상태 배지 (신청중/신청예정/접수마감)
  - D-Day 카운트다운 + 개인 알림 설정
  - FCM 알림 (신청 시작 7일/1일 전)
  - 신청 페이지 딥링크 연결

마라톤 데이터 스키마:
  {
    id, name, region, date, location,
    distances: ["full"|"half"|"10k"|"5k"],
    status: "open"|"soon"|"closed",
    apply_url, apply_start, apply_end, fee
  }
```

#### ③ 친구 러닝 알림 (P0) — 핵심 차별화
```
기능:
  - 친구 러닝 시작 시 → FCM 플로팅 알림 (토스 스타일)
  - 알림 내 "같이 달리기" / "응원 보내기" 액션 버튼
  - 홈 인앱 배너 (러닝 중인 친구 목록)
  - 친구 위치 반경 설정 (500m / 1km / 3km / 전국)

Flutter 구현:
  - firebase_messaging: FCM 백그라운드/포그라운드 수신
  - flutter_local_notifications: 인앱 플로팅 알림
  - web_socket_channel: 실시간 친구 위치 WebSocket
  - OverlayEntry: 토스 스타일 슬라이드 다운 위젯

개인정보 원칙:
  ⚠️ GPS 공유는 명시적 동의 후 활성화
  ⚠️ 러닝 세션 중에만 위치 공유
  ⚠️ 친구별 개별 차단 가능
```

#### ④ 러닝코스 스탬프 (P0) — 핵심 차별화
```
기능:
  - 특정 코스 완주 시 스탬프 자동 획득
  - 스탬프 도감 (패스포트/여권 컨셉)
  - 희귀도: 브론즈 → 실버 → 골드 → 스페셜 → 에픽 → 레전드
  - 획득 애니메이션 + Confetti 효과
  - 누적 획득 수 → 러너 등급 상승

Flutter 구현:
  - confetti 패키지: 스탬프 획득 파티클 효과
  - lottie 패키지: 스탬프 획득 애니메이션
  - shimmer 패키지: 미획득 스탬프 잠금 효과

완주 인증 로직:
  1. 러닝 세션 종료 시 GPS 트랙 서버 전송
  2. Python Shapely로 코스 폴리곤 ↔ GPS 트랙 매칭 (70% 이상)
  3. 최소 거리 충족 확인
  4. 스탬프 Unlock → FCM 알림 → 애니메이션 → DB 저장

스탬프 목록 (초기 24개):
  서울 (6)  : 한강뚝섬 5.2km 브론즈, 한강반포 8.4km 실버,
              북악산성곽 10.5km 골드, 남산순환 7.2km 실버,
              경복궁야간 6.8km 골드, 여의도벚꽃 9.0km 스페셜(4월한정)
  경기·인천 (3): 북한산 18.6km 골드, 송도 6.3km 브론즈, 수원화성 8.1km 실버
  부산·경남 (3): 광안대교야경 11.2km 스페셜, 해운대 5.0km 브론즈, 남해독일마을 7.5km 골드
  대구·경북 (2): 수성못 5.8km 브론즈, 안동하회마을 9.2km 실버
  전라·제주 (3): 전주한옥마을 6.5km 실버, 한라산둘레길 24.8km 에픽, 올레7코스 17.6km 골드
  해외 (4)  : NY센트럴파크 9.7km 스페셜, 도쿄황궁 5.0km 브론즈,
              파리에펠탑 8.3km 실버, 바르셀로나해변 6.2km 브론즈
  레전드 (3): 6대륙러너 레전드, 풀문나이트러너 레전드, 100일연속러닝 레전드

러너 등급:
  0~24%   → 🥉 브론즈 러너
  25~39%  → 🥈 실버 러너
  40~59%  → 🥇 골드 러너
  60~79%  → 💜 에픽 러너
  80%+    → 👑 레전드 러너
```

---

## 4. 기술 스택

### 4.1 전체 스택

```
┌──────────────────────────────────────────────────────┐
│                   FRONTEND (Flutter)                  │
│  Flutter 3.27+ / Dart 3.5+                           │
│  - Google Maps Flutter (지도 + GPS 경로)              │
│  - Firebase Auth / FCM / Firestore                   │
│  - google_sign_in (소셜 로그인)                      │
│  - flutter_riverpod (상태관리)                       │
│  - go_router (라우팅)                                │
│  - dio (HTTP 클라이언트)                             │
└──────────────────────────────────────────────────────┘
                          │ REST API / WebSocket
┌──────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                   │
│  FastAPI + Python 3.11+                              │
│  LangGraph 0.2+  (에이전트 워크플로우)               │
│  Claude API claude-sonnet-4-5 (LLM 엔진)            │
│  Celery + Redis  (비동기 작업)                       │
└──────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────┐
│                   DATABASE                            │
│  PostgreSQL 15   - 사용자, 기록, 마라톤, 스탬프       │
│  Redis 7         - 세션, 실시간 위치, 캐시            │
│  ChromaDB        - 코스 벡터 검색                    │
│  Firebase        - Auth, FCM, Realtime (친구 위치)   │
└──────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────┐
│                   GOOGLE CLOUD / SERVICES             │
│  Google Maps Platform  - 지도, 코스, 거리 계산       │
│  Google Fit API        - 건강 데이터 동기화           │
│  Firebase Auth         - 소셜 로그인 (Google/Apple)  │
│  Firebase Cloud Messaging (FCM) - Push 알림          │
│  Firebase Realtime DB  - 친구 실시간 위치 공유        │
│  Google Cloud Run      - 백엔드 배포                 │
│  Google Cloud Storage  - 이미지/영상 저장             │
└──────────────────────────────────────────────────────┘
```

### 4.2 Flutter 패키지 목록

```yaml
# pubspec.yaml

name: runmate_ai
description: RunMate AI — Multi-Agent Running App
publish_to: none
version: 1.0.0+1

environment:
  sdk: ">=3.5.0 <4.0.0"
  flutter: ">=3.27.0"

dependencies:
  flutter:
    sdk: flutter

  # ── Google / Maps ──────────────────────────────
  google_maps_flutter: ^2.9.0          # 지도 표시
  google_sign_in: ^6.2.2               # Google 소셜 로그인
  geolocator: ^13.0.2                  # GPS 위치 추적
  google_polyline_algorithm: ^3.1.0    # 경로 인코딩

  # ── Firebase ───────────────────────────────────
  firebase_core: ^3.8.0
  firebase_auth: ^5.3.4                # 인증
  firebase_messaging: ^15.1.5          # FCM Push 알림
  firebase_database: ^11.1.5           # 친구 실시간 위치
  cloud_firestore: ^5.5.0              # 앱 설정 / 캐시

  # ── 상태관리 / 라우팅 ────────────────────────
  flutter_riverpod: ^2.6.1             # 상태관리
  riverpod_annotation: ^2.6.1
  go_router: ^14.6.2                   # 라우팅

  # ── 네트워크 ─────────────────────────────────
  dio: ^5.7.0                          # HTTP 클라이언트
  web_socket_channel: ^3.0.1           # WebSocket (친구 위치)
  pretty_dio_logger: ^1.4.0

  # ── 애니메이션 / UI ───────────────────────────
  confetti: ^0.7.0                     # 스탬프 획득 Confetti
  lottie: ^3.2.0                       # 스탬프 획득 애니메이션
  shimmer: ^3.0.0                      # 로딩 / 미획득 스탬프
  flutter_animate: ^4.5.2              # 전반적 애니메이션
  animations: ^2.0.11                  # Material 전환 효과

  # ── 알림 ─────────────────────────────────────
  flutter_local_notifications: ^18.0.1 # 인앱 플로팅 알림
  overlay_support: ^2.1.0              # 토스 스타일 오버레이 알림

  # ── 미디어 ───────────────────────────────────
  image_picker: ^1.1.2                 # 사진/영상 선택
  video_player: ^2.9.2                 # 영상 재생
  ffmpeg_kit_flutter: ^6.0.3          # 영상 편집
  path_provider: ^2.1.5
  cached_network_image: ^3.4.1

  # ── 건강 데이터 ───────────────────────────────
  health: ^12.2.0                      # Google Fit / Apple Health

  # ── 백그라운드 GPS ────────────────────────────
  background_locator_2: ^2.0.7         # 백그라운드 위치 추적

  # ── 기타 ─────────────────────────────────────
  shared_preferences: ^2.3.3           # 로컬 설정 저장
  intl: ^0.19.0                        # 날짜/숫자 포맷
  url_launcher: ^6.3.1                 # 외부 링크 (마라톤 신청)
  share_plus: ^10.1.2                  # 러닝 기록 공유
  package_info_plus: ^8.1.2
  flutter_svg: ^2.0.14

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0
  riverpod_generator: ^2.6.1
  build_runner: ^2.4.13
  json_serializable: ^6.8.0
  freezed: ^2.5.7                      # Immutable 모델
  freezed_annotation: ^2.4.4
  mockito: ^5.4.4
  integration_test:
    sdk: flutter

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/animations/    # Lottie JSON 파일
    - assets/stamps/        # 스탬프 아이콘
  fonts:
    - family: Pretendard
      fonts:
        - asset: assets/fonts/Pretendard-Regular.ttf
        - asset: assets/fonts/Pretendard-Bold.ttf   weight: 700
        - asset: assets/fonts/Pretendard-Black.ttf  weight: 900
```

### 4.3 Backend 의존성

```txt
# backend/requirements.txt

fastapi==0.115.0
uvicorn[standard]==0.30.0
langgraph==0.2.50
langchain-anthropic==0.3.0
anthropic==0.40.0
sqlalchemy==2.0.35
asyncpg==0.29.0
alembic==1.14.0
redis==5.0.8
celery==5.4.0
chromadb==0.5.20
pydantic==2.9.0
pydantic-settings==2.6.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
httpx==0.27.0
geopy==2.4.1
shapely==2.0.6               # 코스 폴리곤 매칭
firebase-admin==6.6.0        # FCM 서버 푸시
python-multipart==0.0.12
Pillow==11.0.0               # 러닝 카드 이미지 생성
```

---

## 5. 데이터베이스 스키마

```sql
-- 사용자
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(50)  NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  firebase_uid  VARCHAR(128) UNIQUE,     -- Firebase Auth UID
  avatar_url    TEXT,
  runner_grade  VARCHAR(20)  DEFAULT 'bronze',
  gps_share     BOOLEAN      DEFAULT false,
  google_fit_connected BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- 친구 관계
CREATE TABLE friendships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  friend_id  UUID REFERENCES users(id),
  status     VARCHAR(20) DEFAULT 'pending',   -- pending|accepted|blocked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 러닝 세션
CREATE TABLE running_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id),
  started_at   TIMESTAMPTZ NOT NULL,
  ended_at     TIMESTAMPTZ,
  distance_km  DECIMAL(6,3),
  duration_sec INTEGER,
  avg_pace     DECIMAL(5,2),        -- 분/km
  calories     INTEGER,
  route        JSONB,               -- [{lat, lng, timestamp, altitude}]
  course_id    VARCHAR(50),         -- 매칭된 스탬프 코스 ID
  google_fit_synced BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 코스 스탬프 정의
CREATE TABLE stamps (
  id             VARCHAR(20) PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  region         VARCHAR(50)  NOT NULL,
  icon           VARCHAR(10),
  distance_km    DECIMAL(6,3),
  rarity         VARCHAR(20),        -- bronze|silver|gold|special|epic|legend
  route_polygon  JSONB,              -- [[lat,lng], ...] 코스 폴리곤
  description    TEXT,
  season_start   DATE,               -- 시즌 한정 (nullable)
  season_end     DATE
);

-- 사용자 스탬프 획득
CREATE TABLE user_stamps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id),
  stamp_id     VARCHAR(20) REFERENCES stamps(id),
  earn_count   INTEGER     DEFAULT 1,
  first_earned TIMESTAMPTZ DEFAULT NOW(),
  last_earned  TIMESTAMPTZ DEFAULT NOW(),
  session_id   UUID REFERENCES running_sessions(id),
  UNIQUE(user_id, stamp_id)
);

-- 마라톤 대회
CREATE TABLE marathons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(200) NOT NULL,
  region         VARCHAR(50),
  country        VARCHAR(50)  DEFAULT 'KR',
  race_date      DATE NOT NULL,
  location       VARCHAR(200),
  distances      JSONB,              -- ["full","half","10k"]
  status         VARCHAR(20),        -- open|soon|closed
  apply_url      TEXT,
  apply_start    DATE,
  apply_end      DATE,
  entry_fee      INTEGER,
  is_world_major BOOLEAN DEFAULT false
);

-- 마라톤 알림
CREATE TABLE marathon_alerts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES users(id),
  marathon_id        UUID REFERENCES marathons(id),
  alert_before_days  INTEGER DEFAULT 7,
  fcm_token          TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, marathon_id)
);

-- 커뮤니티 포스트
CREATE TABLE posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  session_id UUID REFERENCES running_sessions(id),
  content    TEXT,
  images     JSONB,
  lang       VARCHAR(10) DEFAULT 'ko',
  likes      INTEGER     DEFAULT 0,
  region     VARCHAR(50),
  is_global  BOOLEAN     DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. API 엔드포인트

```
BASE URL: https://api.runmate.ai/v1

AUTH
  POST   /auth/google          Google OAuth → JWT 발급
  POST   /auth/refresh         토큰 갱신
  POST   /auth/logout

RUNNING
  POST   /running/start        러닝 세션 시작
  POST   /running/update       GPS 좌표 업데이트
  POST   /running/end          세션 종료 + 스탬프 자동 체크
  GET    /running/history      러닝 기록 목록
  GET    /running/{id}         러닝 기록 상세

STAMPS
  GET    /stamps               전체 스탬프 목록 (획득 여부 포함)
  GET    /stamps/my            내 획득 스탬프
  POST   /stamps/verify        완주 인증 요청
  GET    /stamps/leaderboard   스탬프 랭킹

MARATHONS
  GET    /marathons            목록 (필터: region, status)
  GET    /marathons/{id}       상세
  POST   /marathons/{id}/alert 알림 설정 (FCM)
  DELETE /marathons/{id}/alert 알림 해제

COURSES
  GET    /courses/hot          핫코스 (지역 필터)
  GET    /courses/nearby       주변 코스 (GPS 기반)

FRIENDS
  GET    /friends              친구 목록
  GET    /friends/running-now  현재 러닝 중인 친구
  POST   /friends/request      친구 요청
  PUT    /friends/{id}/accept  친구 수락
  PUT    /friends/gps-share    GPS 공유 ON/OFF
  POST   /friends/{id}/cheer   응원 보내기

COMMUNITY
  GET    /posts                피드 (지역/글로벌)
  POST   /posts                포스트 작성
  POST   /posts/{id}/like      좋아요
  POST   /posts/{id}/comments  댓글 작성

AGENT
  POST   /agent/chat           Orchestrator Agent 자연어 호출
  GET    /agent/recommend/course    코스 추천
  GET    /agent/recommend/gear      용품 추천

WEBSOCKET
  WS     /ws/running/{session_id}   러닝 실시간 스트리밍
  WS     /ws/friends                친구 위치 실시간
  WS     /ws/chat/{room_id}         커뮤니티 채팅
```

---

## 7. 프로젝트 폴더 구조

```
runmate-ai/
│
├── backend/                              # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   │
│   │   ├── agents/                       # LangGraph 에이전트
│   │   │   ├── __init__.py
│   │   │   ├── orchestrator.py           # 최상위 오케스트레이터
│   │   │   ├── state.py                  # RunMateState 타입
│   │   │   ├── marathon_agent.py
│   │   │   ├── world_marathon_agent.py
│   │   │   ├── course_agent.py
│   │   │   ├── gps_agent.py
│   │   │   ├── media_agent.py
│   │   │   ├── friend_agent.py
│   │   │   ├── stamp_agent.py
│   │   │   ├── gear_agent.py
│   │   │   ├── chat_agent.py
│   │   │   └── travel_agent.py
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── running.py
│   │   │   ├── stamps.py
│   │   │   ├── marathons.py
│   │   │   ├── courses.py
│   │   │   ├── friends.py
│   │   │   ├── community.py
│   │   │   ├── agent.py
│   │   │   └── websocket.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── running_session.py
│   │   │   ├── stamp.py
│   │   │   ├── marathon.py
│   │   │   └── post.py
│   │   │
│   │   ├── services/
│   │   │   ├── gps_service.py            # GPS 처리 + 코스 매칭
│   │   │   ├── stamp_service.py          # 스탬프 검증/획득
│   │   │   ├── friend_service.py         # 친구 알림 로직
│   │   │   ├── media_service.py          # 영상/이미지 처리
│   │   │   ├── firebase_service.py       # FCM 알림 발송
│   │   │   └── google_fit_service.py     # Google Fit 연동
│   │   │
│   │   └── schemas/
│   │       ├── running.py
│   │       ├── stamp.py
│   │       ├── marathon.py
│   │       └── user.py
│   │
│   ├── migrations/
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                             # Flutter 앱
│   ├── lib/
│   │   ├── main.dart                     # 앱 진입점 + Firebase 초기화
│   │   ├── app.dart                      # GoRouter 설정
│   │   │
│   │   ├── features/                     # 기능별 모듈
│   │   │   │
│   │   │   ├── home/
│   │   │   │   ├── screens/
│   │   │   │   │   └── home_screen.dart
│   │   │   │   ├── widgets/
│   │   │   │   │   ├── friend_running_toast.dart   # 토스 스타일 알림
│   │   │   │   │   ├── friend_alert_banner.dart    # 인앱 친구 배너
│   │   │   │   │   ├── gps_run_card.dart           # GPS 러닝 카드
│   │   │   │   │   └── agent_chat_bar.dart         # AI Agent 입력창
│   │   │   │   └── providers/
│   │   │   │       └── home_provider.dart
│   │   │   │
│   │   │   ├── running/
│   │   │   │   ├── screens/
│   │   │   │   │   ├── running_active_screen.dart  # 러닝 중 화면
│   │   │   │   │   └── running_result_screen.dart  # 완료 화면
│   │   │   │   ├── widgets/
│   │   │   │   │   ├── running_map.dart            # Google Maps 경로
│   │   │   │   │   └── running_stats_panel.dart    # 거리/페이스/칼로리
│   │   │   │   ├── providers/
│   │   │   │   │   └── running_provider.dart       # Riverpod
│   │   │   │   └── services/
│   │   │   │       └── gps_tracking_service.dart   # GPS 스트리밍
│   │   │   │
│   │   │   ├── stamps/
│   │   │   │   ├── screens/
│   │   │   │   │   └── stamp_book_screen.dart      # 스탬프 도감
│   │   │   │   ├── widgets/
│   │   │   │   │   ├── stamp_card.dart             # 개별 스탬프 카드
│   │   │   │   │   ├── stamp_detail_sheet.dart     # 상세 바텀시트
│   │   │   │   │   ├── passport_card.dart          # 러너 패스포트
│   │   │   │   │   └── earn_animation.dart         # 획득 애니메이션 (Lottie)
│   │   │   │   └── providers/
│   │   │   │       └── stamp_provider.dart
│   │   │   │
│   │   │   ├── marathon/
│   │   │   │   ├── screens/
│   │   │   │   │   ├── marathon_list_screen.dart
│   │   │   │   │   └── marathon_detail_screen.dart
│   │   │   │   ├── widgets/
│   │   │   │   │   ├── marathon_card.dart
│   │   │   │   │   └── region_filter_tabs.dart
│   │   │   │   └── providers/
│   │   │   │       └── marathon_provider.dart
│   │   │   │
│   │   │   ├── courses/
│   │   │   │   ├── screens/
│   │   │   │   │   └── course_screen.dart
│   │   │   │   └── widgets/
│   │   │   │       └── course_card.dart
│   │   │   │
│   │   │   ├── community/
│   │   │   │   ├── screens/
│   │   │   │   │   └── community_screen.dart
│   │   │   │   └── widgets/
│   │   │   │       └── post_card.dart
│   │   │   │
│   │   │   └── my/
│   │   │       └── screens/
│   │   │           └── my_screen.dart
│   │   │
│   │   ├── core/
│   │   │   ├── constants/
│   │   │   │   ├── stamp_data.dart         # 스탬프 정적 데이터
│   │   │   │   ├── marathon_data.dart      # 마라톤 정적 데이터
│   │   │   │   ├── app_colors.dart         # 디자인 토큰
│   │   │   │   └── app_strings.dart
│   │   │   ├── models/                     # Freezed 모델
│   │   │   │   ├── running_session.dart
│   │   │   │   ├── stamp.dart
│   │   │   │   ├── marathon.dart
│   │   │   │   ├── user.dart
│   │   │   │   └── friend.dart
│   │   │   ├── services/
│   │   │   │   ├── api_service.dart        # Dio 인스턴스
│   │   │   │   ├── firebase_service.dart   # FCM / Auth
│   │   │   │   ├── websocket_service.dart  # WebSocket
│   │   │   │   └── google_fit_service.dart
│   │   │   └── widgets/
│   │   │       ├── bottom_sheet_widget.dart
│   │   │       ├── toast_widget.dart
│   │   │       └── confetti_widget.dart
│   │   │
│   │   └── firebase_options.dart           # FlutterFire CLI 자동 생성
│   │
│   ├── android/
│   │   └── app/
│   │       ├── google-services.json        # Firebase Android 설정
│   │       └── src/main/AndroidManifest.xml
│   ├── ios/
│   │   ├── Runner/
│   │   │   └── GoogleService-Info.plist    # Firebase iOS 설정
│   │   └── Podfile
│   │
│   ├── assets/
│   │   ├── animations/                     # Lottie 파일
│   │   │   ├── stamp_earn.json
│   │   │   └── running_active.json
│   │   ├── images/
│   │   └── fonts/
│   │
│   ├── test/
│   ├── integration_test/
│   ├── pubspec.yaml
│   └── .env                               # flutter_dotenv 환경변수
│
├── docker-compose.yml
├── README.md
└── .env.example
```

---

## 8. 환경변수

```bash
# backend/.env

APP_ENV=development
SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=http://localhost:8080

# Database (Supabase 권장 — URI는 대시보드에서 복사 후 postgresql+psycopg 로 변경, sslmode=require)
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
REDIS_URL=redis://localhost:6379/0

# AI
ANTHROPIC_API_KEY=your-anthropic-api-key
CLAUDE_MODEL=claude-sonnet-4-5

# Google
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Firebase (서버 푸시용)
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
```

```bash
# frontend/.env  (flutter_dotenv 사용)

API_BASE_URL=http://localhost:8000/v1
WS_BASE_URL=ws://localhost:8000
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

```xml
<!-- android/app/src/main/AndroidManifest.xml 추가 권한 -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
```

---

## 9. Flutter 핵심 코드 패턴

### 9.1 친구 러닝 알림 (토스 스타일)

```dart
// features/home/widgets/friend_running_toast.dart

import 'package:flutter/material.dart';
import 'package:overlay_support/overlay_support.dart';

void showFriendRunningToast(BuildContext context, FriendRunning friend) {
  showOverlayNotification(
    (context) => FriendRunningToastWidget(friend: friend),
    duration: const Duration(seconds: 8),
    position: NotificationPosition.top,
  );
}

class FriendRunningToastWidget extends StatelessWidget {
  final FriendRunning friend;
  const FriendRunningToastWidget({required this.friend, super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        color: const Color(0xFF1E1E2E),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFF00E87A), width: 1.5),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            // 아바타 + 러닝 중 표시
            Stack(children: [
              CircleAvatar(
                backgroundImage: NetworkImage(friend.avatarUrl),
                radius: 22,
              ),
              Positioned(
                right: 0, bottom: 0,
                child: Container(
                  width: 12, height: 12,
                  decoration: BoxDecoration(
                    color: const Color(0xFF00E87A),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.black, width: 2),
                  ),
                ),
              ),
            ]),
            const SizedBox(width: 12),
            // 정보
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('🏃 주변 친구가 러닝 중이에요!',
                  style: TextStyle(fontSize: 11, color: Color(0xFF00E87A), fontWeight: FontWeight.w700)),
                Text(friend.name,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900)),
                Text('${friend.courseName} · ${friend.distanceKm.toStringAsFixed(1)}km 달리는 중',
                  style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            )),
            // 액션 버튼
            Column(children: [
              ElevatedButton(
                onPressed: () { OverlaySupportEntry.of(context)!.dismiss(); /* 같이 달리기 */ },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00E87A),
                  foregroundColor: Colors.black,
                  minimumSize: const Size(72, 32),
                  padding: EdgeInsets.zero,
                ),
                child: const Text('같이 달려', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900)),
              ),
              TextButton(
                onPressed: () => OverlaySupportEntry.of(context)!.dismiss(),
                child: const Text('응원 💪', style: TextStyle(fontSize: 11)),
              ),
            ]),
          ]),
        ),
      ),
    );
  }
}
```

### 9.2 스탬프 획득 애니메이션

```dart
// features/stamps/widgets/earn_animation.dart

import 'package:flutter/material.dart';
import 'package:confetti/confetti.dart';
import 'package:lottie/lottie.dart';

class StampEarnDialog extends StatefulWidget {
  final Stamp stamp;
  const StampEarnDialog({required this.stamp, super.key});

  @override
  State<StampEarnDialog> createState() => _StampEarnDialogState();
}

class _StampEarnDialogState extends State<StampEarnDialog> {
  late ConfettiController _confetti;

  @override
  void initState() {
    super.initState();
    _confetti = ConfettiController(duration: const Duration(seconds: 3));
    _confetti.play();
  }

  @override
  void dispose() {
    _confetti.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.topCenter,
      children: [
        // Confetti
        ConfettiWidget(
          confettiController: _confetti,
          blastDirectionality: BlastDirectionality.explosive,
          colors: const [Color(0xFFFFD700), Color(0xFF00E87A), Color(0xFFA78BFA)],
        ),
        // 스탬프 카드
        Center(
          child: Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E2E),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFFFD700), width: 2),
              boxShadow: [BoxShadow(color: const Color(0xFFFFD700).withOpacity(0.3), blurRadius: 32)],
            ),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Lottie.asset('assets/animations/stamp_earn.json', width: 120, height: 120, repeat: false),
              const SizedBox(height: 8),
              const Text('🎉 스탬프 획득!', style: TextStyle(color: Color(0xFFFFD700), fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text(widget.stamp.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
              Text('${widget.stamp.distanceKm}km 완주 인증', style: const TextStyle(color: Colors.grey, fontSize: 13)),
            ]),
          ),
        ),
      ],
    );
  }
}
```

### 9.3 GPS 트래킹 Provider (Riverpod)

```dart
// features/running/providers/running_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

@riverpod
class RunningNotifier extends _$RunningNotifier {
  StreamSubscription<Position>? _positionSub;

  @override
  RunningState build() => RunningState.initial();

  Future<void> startRun() async {
    final permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied) return;

    state = state.copyWith(isRunning: true, startTime: DateTime.now());

    _positionSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 5,         // 5m 이상 이동 시 업데이트
      ),
    ).listen(_onPosition);
  }

  void _onPosition(Position pos) {
    final route = [...state.route, LatLng(pos.latitude, pos.longitude)];
    final distance = _calcDistance(route);
    final elapsed  = DateTime.now().difference(state.startTime!).inSeconds;
    final pace     = elapsed > 0 ? elapsed / 60 / distance : 0.0;

    state = state.copyWith(
      route:       route,
      distanceKm:  distance,
      pacePerKm:   pace,
      calories:    (distance * 62).round(),
    );
  }

  Future<void> stopRun() async {
    await _positionSub?.cancel();
    state = state.copyWith(isRunning: false);
    // 서버에 세션 저장 + 스탬프 자동 검증
    await ref.read(runningApiProvider).saveSession(state.toSession());
  }

  double _calcDistance(List<LatLng> route) {
    if (route.length < 2) return 0;
    double total = 0;
    for (int i = 1; i < route.length; i++) {
      total += Geolocator.distanceBetween(
        route[i-1].latitude, route[i-1].longitude,
        route[i].latitude,   route[i].longitude,
      );
    }
    return total / 1000; // km
  }
}
```

---

## 10. 개발 로드맵

### Phase 1 — MVP (4주)
- [ ] Flutter 프로젝트 초기 세팅 (Firebase 연동, GoRouter, Riverpod)
- [ ] Google 로그인 (firebase_auth + google_sign_in)
- [ ] GPS 러닝 기록 (geolocator + google_maps_flutter 폴리라인)
- [ ] 러닝 기록 히스토리
- [ ] 마라톤 일정 목록 (정적 데이터 + url_launcher 신청 링크)
- [ ] 스탬프 도감 UI (shimmer 잠금 효과)

### Phase 2 — 핵심 기능 (4주)
- [ ] LangGraph Orchestrator Agent 백엔드 연동
- [ ] 코스 스탬프 GPS 자동 인증 (Shapely 폴리곤 매칭)
- [ ] 스탬프 획득 애니메이션 (Lottie + Confetti)
- [ ] 친구 러닝 알림 (WebSocket + FCM + overlay_support)
- [ ] 마라톤 FCM 알림 설정
- [ ] Google Fit 연동

### Phase 3 — 소셜 기능 (3주)
- [ ] 커뮤니티 피드 (포스트·댓글·좋아요)
- [ ] Claude API 다국어 번역
- [ ] SNS 원스텝 업로드 (share_plus + SNS API)
- [ ] 러닝 기록 카드 이미지 자동 생성

### Phase 4 — 고도화 (지속)
- [ ] Gear Advisor Agent
- [ ] Travel Running Agent
- [ ] 스탬프 랭킹 / 리더보드
- [ ] WearOS / Apple Watch 연동 (flutter_wear_os)
- [ ] 오프라인 모드 (Hive 로컬 캐시)

---

## 11. Cursor 개발 프롬프트

```
# Flutter 친구 알림 구현
"Flutter에서 overlay_support 패키지와 firebase_messaging을 사용해서
친구가 러닝 시작 시 토스 앱처럼 상단에서 슬라이드 다운되는
FriendRunningToastWidget을 구현해줘.
같이 달리기 / 응원 보내기 버튼이 있고, 8초 후 자동 닫힘."

# 스탬프 GPS 검증
"FastAPI backend에서 running_session의 GPS route(List[LatLng])를
Python Shapely로 stamp의 route_polygon과 비교해서
70% 이상 오버랩되면 user_stamps 테이블에 INSERT하는
stamp_service.py verify_stamp() 함수를 구현해줘."

# LangGraph Orchestrator
"LangGraph StateGraph로 RunMate Orchestrator Agent를 구현해줘.
사용자 자연어 입력을 Claude API로 분석해서
marathon|course|stamp|friend|gear 중 하나로 intent를 분류하고
conditional_edge로 각 Sub-Agent 노드로 라우팅하는 코드를 작성해줘."

# Google Maps 러닝 경로
"google_maps_flutter로 러닝 중 실시간 GPS 경로를
Polyline으로 그리고 현재 위치 마커를 표시하는
RunningMapWidget Flutter 위젯을 만들어줘.
Riverpod RunningNotifier에서 route 상태를 구독해서 업데이트해."
```

---

## 12. 참고 자료

| 항목 | URL |
|------|-----|
| Flutter 공식 문서 | https://docs.flutter.dev |
| FlutterFire (Firebase) | https://firebase.flutter.dev |
| google_maps_flutter | https://pub.dev/packages/google_maps_flutter |
| LangGraph 공식 문서 | https://langchain-ai.github.io/langgraph/ |
| Claude API 문서 | https://docs.anthropic.com |
| FastAPI 문서 | https://fastapi.tiangolo.com |
| Google Maps Platform | https://developers.google.com/maps |
| Google Fit REST API | https://developers.google.com/fit |
| Firebase Console | https://console.firebase.google.com |
| 마라톤 일정 데이터 | https://marathongo.co.kr |
| pub.dev (Flutter 패키지) | https://pub.dev |

---

*RunMate AI PRD v2.0 — Flutter 전환 — 2026.03.24*
