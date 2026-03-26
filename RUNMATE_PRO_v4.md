# RunMate AI — 개발 PRD v4.0

> **작성일**: 2026.03.24  
> **버전**: v4.0 (Stitch + Tailwind + Supabase 전환)  
> **개발 환경**: Cursor IDE  
> **기술 스택**: Stitch → Next.js / Tailwind CSS / Node.js 18+ + Supabase + LangGraph + Claude API

---

## 0. 기술 스택 선택 배경

| 레이어 | 도구 | 역할 |
|--------|------|------|
| **UI 생성** | **Google Stitch** (stitch.withgoogle.com) | Gemini 2.5 Pro 기반 UI 자동 생성 → 코드 Export |
| **프론트엔드** | **Next.js 15** (Node.js 18+ 필수) | Stitch가 생성한 코드를 통합하는 메인 프레임워크 |
| **스타일** | **Tailwind CSS v4** | Stitch Export 코드의 기본 스타일 시스템 |
| **런타임** | **Node.js 18 LTS 이상** | Next.js 15 최소 요구사항 |
| **백엔드 + DB** | **Supabase** | PostgreSQL + Auth + Realtime + Storage + Edge Functions |
| **AI 에이전트** | **LangGraph + Claude API** | 멀티 에이전트 + 페르소나 구성 |
| **동영상 편집** | **FFmpeg.wasm + Canvas API** | 러닝코스별 속도 편집 인브라우저 툴 |

---

## 1. 프로젝트 개요

### 1.1 앱 비전
**RunMate AI**는 다중 에이전트(Multi-Agent) 시스템 기반의 글로벌 러닝 플랫폼이다.  
UI는 **Google Stitch**로 빠르게 프로토타입을 생성하고, **Tailwind CSS**로 다듬는다.  
백엔드는 **Supabase** 하나로 DB / 인증 / 실시간 / 스토리지를 모두 처리한다.  
AI 에이전트는 **LangGraph 페르소나 멀티 에이전트** 구조로 각 Sub-Agent가 고유한 성격을 가진다.

### 1.2 핵심 기능
- LangGraph 페르소나 기반 멀티 에이전트 (10개 Sub-Agent, 각자 고유 역할/성격)
- 친구 실시간 러닝 감지 → 토스 스타일 플로팅 알림 (Supabase Realtime)
- 코스 완주 스탬프 수집 (도감/여권 컨셉)
- 전국 + 세계 마라톤 일정 DB + 신청 알림
- **🎬 동영상 러닝코스 속도 편집 툴** ← 신규
- GPS 기록 → 영상 편집 → SNS 원스텝 업로드

### 1.3 Stitch 활용 워크플로우

```
1. Google Stitch (stitch.withgoogle.com)
   └── 프롬프트로 화면 UI 생성
       예: "러닝앱 홈화면, 어두운 테마, GPS 카드, 친구 알림 배너"
   └── Tailwind CSS 코드로 Export
   └── Figma로 Export (디자인 검토)

2. Cursor IDE
   └── Stitch Export 코드 → Next.js 컴포넌트로 통합
   └── Supabase 연동, 에이전트 로직 추가

3. 배포
   └── Vercel (Next.js) + Supabase Cloud
```

---

## 2. 멀티 에이전트 아키텍처 (페르소나 구성)

### 2.1 페르소나 에이전트 설계 원칙

> 각 Sub-Agent는 단순한 기능 모듈이 아니라 **고유한 성격·말투·전문성을 가진 페르소나**다.  
> Orchestrator는 사용자 의도를 파악해 가장 적합한 페르소나 에이전트에게 대화를 위임한다.

### 2.2 페르소나 에이전트 정의

| 에이전트 | 페르소나 이름 | 성격/말투 | 전문 영역 |
|----------|-------------|----------|----------|
| **Orchestrator** | **RAMI (러닝 AI 매니저)** | 친근하고 똑똑한 코치, 간결한 말투 | 의도 분석, 에이전트 라우팅, 응답 통합 |
| Marathon Schedule | **마라 (MARA)** | 열정적, 대회광, 숫자에 강함 | 전국·세계 마라톤 일정, 신청 알림 |
| World Marathon | **글로비 (GLOBI)** | 세계 여행을 사랑하는 국제파 | 세계 6대 메이저 마라톤 정보 |
| Course Discovery | **코시 (COSHI)** | 탐험가 기질, 숨은 명소 발굴 | 지역별·글로벌 핫코스 큐레이션 |
| Travel Running | **트래비 (TRAVI)** | 여행 덕후, 이색 경험 추구 | 해외 여행지 러닝코스 추천 |
| Gear Advisor | **기어스 (GEARS)** | 장비 마니아, 데이터 기반 추천 | 러닝화·양말·용품 전문 큐레이터 |
| GPS Record | **트래커 (TRACKER)** | 냉정한 분석가, 숫자로 말함 | 실시간 GPS 기록, 페이스 분석 |
| Media Publisher | **비디 (VIDY)** | 크리에이터 감성, 영상 편집 고수 | 러닝 영상 편집, SNS 업로드 |
| Friend Alert | **소셜 (SOAR)** | 사교적, 친구 연결 전문가 | 주변 친구 러닝 감지·알림 |
| Stamp Collection | **스탬피 (STAMPY)** | 수집광, 도장 하나하나에 의미 부여 | 코스 완주 스탬프 검증·발급 |
| Global Chat | **링구아 (LINGUA)** | 다국어 능통, 문화 중재자 | 다국어 커뮤니티 번역·소통 |

### 2.3 전체 구조

```
사용자 입력 (자연어 / 버튼)
        │
        ▼
┌──────────────────────────────────┐
│  🎯 RAMI — Orchestrator Agent     │
│  페르소나: 친근한 러닝 AI 코치     │
│  - 의도 분석 (Claude API)         │
│  - 최적 페르소나 선택             │
│  - 응답 통합 및 말투 조율         │
└────────────┬─────────────────────┘
             │ LangGraph conditional_edge
             ▼
   ┌─────────────────────┐
   │    Intent Router    │
   │   (StateGraph 분기) │
   └──────┬──────────────┘
          │
    ┌─────┴──────────────────────────────────────────────┐
    │                                                    │
    ▼                                                    ▼
페르소나 Group A (정보/일정)            페르소나 Group B (기록/소통)
──────────────────────────────        ──────────────────────────────
🏅 MARA   — Marathon Schedule         📍 TRACKER — GPS Record
🌐 GLOBI  — World Marathon            🎬 VIDY    — Media Publisher
🗺️  COSHI  — Course Discovery         👥 SOAR    — Friend Alert
✈️  TRAVI  — Travel Running           🏅 STAMPY  — Stamp Collection
👟 GEARS  — Gear Advisor             💬 LINGUA  — Global Chat

          │                                              │
          └──────────────────┬───────────────────────────┘
                             ▼
               ┌──────────────────────────────┐
               │       Shared Layer            │
               │  LangGraph State              │
               │  Supabase PostgreSQL (기록)   │
               │  Supabase Realtime (친구위치) │
               │  Supabase Auth (인증)         │
               │  Supabase Storage (영상/이미지│
               │  Supabase Edge Functions      │
               └──────────────────────────────┘
```

### 2.4 페르소나 시스템 프롬프트 예시

```python
# backend/agents/personas.py

PERSONAS = {
    "RAMI": {
        "name": "RAMI",
        "role": "RunMate AI 총괄 코치",
        "system_prompt": """
너는 RAMI야. RunMate의 AI 러닝 코치로, 사용자의 러닝 파트너다.
말투: 친근하고 에너지 넘치지만 간결함. 불필요한 설명 없이 핵심만.
특기: 사용자 의도를 정확히 파악해서 최적의 전문가(페르소나)에게 연결.
        """,
    },
    "MARA": {
        "name": "MARA",
        "role": "마라톤 일정 전문가",
        "system_prompt": """
너는 MARA야. 마라톤 대회라면 국내외 모두 꿰고 있는 대회광 전문가다.
말투: 열정적이고 구체적. 날짜, 접수 기간, D-Day를 정확히 알려줌.
특기: 신청 마감 임박한 대회는 특별히 강조. 알림 설정을 적극 권유.
        """,
    },
    "VIDY": {
        "name": "VIDY",
        "role": "러닝 미디어 크리에이터",
        "system_prompt": """
너는 VIDY야. 러닝 영상 편집의 달인. 크리에이터 감성으로 러닝 기록을 콘텐츠로 만들어줌.
말투: 트렌디하고 감각적. "이 장면 완전 레전드다", "이 속도 구간 하이라이트로 뽑자" 같은 말투.
특기: GPS 속도 데이터 기반으로 하이라이트 구간 자동 추천.
        """,
    },
    "STAMPY": {
        "name": "STAMPY",
        "role": "코스 스탬프 수집 전문가",
        "system_prompt": """
너는 STAMPY야. 스탬프 하나하나에 진심인 수집광이다.
말투: 수집에 진심. 희귀 스탬프에 특별히 흥분함. "이 스탬프 진짜 구하기 힘든 거야!" 같은 말투.
특기: 사용자의 GPS 데이터로 코스 완주를 검증하고 스탬프를 발급함.
        """,
    },
}

# 페르소나 선택 로직
def select_persona(intent: str) -> str:
    mapping = {
        "marathon_schedule": "MARA",
        "world_marathon":    "GLOBI",
        "course_discovery":  "COSHI",
        "travel_running":    "TRAVI",
        "gear_advice":       "GEARS",
        "gps_record":        "TRACKER",
        "media_publish":     "VIDY",
        "friend_alert":      "SOAR",
        "stamp":             "STAMPY",
        "community":         "LINGUA",
    }
    return mapping.get(intent, "RAMI")
```

### 2.5 LangGraph 워크플로우 코드

```python
# backend/agents/orchestrator.py

from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages
from .personas import PERSONAS, select_persona

class RunMateState(TypedDict):
    messages:       Annotated[list, add_messages]
    intent:         str
    persona:        str        # 선택된 페르소나 이름
    agent_result:   dict
    user_location:  dict
    user_id:        str

async def orchestrator_node(state: RunMateState):
    """RAMI — 의도 분석 + 페르소나 선택"""
    from anthropic import Anthropic
    client = Anthropic()

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=256,
        system=PERSONAS["RAMI"]["system_prompt"],
        messages=[{
            "role": "user",
            "content": f"""
다음 사용자 메시지의 의도를 분류해줘.
반드시 아래 중 하나로만 답해:
marathon_schedule | world_marathon | course_discovery |
travel_running | gear_advice | gps_record | media_publish |
friend_alert | stamp | community

메시지: {state['messages'][-1].content}
"""
        }]
    )
    intent  = response.content[0].text.strip()
    persona = select_persona(intent)

    return {"intent": intent, "persona": persona}

def intent_router(state: RunMateState) -> str:
    route_map = {
        "marathon_schedule": "mara_agent",
        "world_marathon":    "globi_agent",
        "course_discovery":  "coshi_agent",
        "travel_running":    "travi_agent",
        "gear_advice":       "gears_agent",
        "gps_record":        "tracker_agent",
        "media_publish":     "vidy_agent",
        "friend_alert":      "soar_agent",
        "stamp":             "stampy_agent",
        "community":         "lingua_agent",
    }
    return route_map.get(state["intent"], END)

# StateGraph 구성
workflow = StateGraph(RunMateState)
workflow.add_node("orchestrator", orchestrator_node)
workflow.add_node("mara_agent",    mara_node)
workflow.add_node("globi_agent",   globi_node)
workflow.add_node("coshi_agent",   coshi_node)
workflow.add_node("travi_agent",   travi_node)
workflow.add_node("gears_agent",   gears_node)
workflow.add_node("tracker_agent", tracker_node)
workflow.add_node("vidy_agent",    vidy_node)
workflow.add_node("soar_agent",    soar_node)
workflow.add_node("stampy_agent",  stampy_node)
workflow.add_node("lingua_agent",  lingua_node)

workflow.set_entry_point("orchestrator")
workflow.add_conditional_edges("orchestrator", intent_router)

for node in ["mara_agent","globi_agent","coshi_agent","travi_agent","gears_agent",
             "tracker_agent","vidy_agent","soar_agent","stampy_agent","lingua_agent"]:
    workflow.add_edge(node, END)

app = workflow.compile()
```

---

## 3. 기능 명세

### 3.1 기능 우선순위

| 우선순위 | 기능 | 담당 페르소나 | 복잡도 |
|---------|------|-------------|-------|
| P0 | GPS 러닝 기록 | TRACKER | 높음 |
| P0 | 전국 마라톤 일정 + 신청 연동 | MARA | 중간 |
| P0 | 친구 러닝 실시간 알림 | SOAR | 높음 |
| P0 | 러닝코스 스탬프 수집 | STAMPY | 중간 |
| **P0** | **🎬 동영상 속도 편집 툴** | **VIDY** | **높음** |
| P1 | 지역별 핫코스 추천 | COSHI | 중간 |
| P1 | 세계 마라톤 일정 | GLOBI | 중간 |
| P1 | SNS 원스텝 업로드 | VIDY | 높음 |
| P2 | 글로벌 커뮤니티 | LINGUA | 높음 |
| P2 | 러닝화·용품 추천 | GEARS | 낮음 |
| P2 | 해외 여행지 코스 | TRAVI | 낮음 |

---

### 3.2 🎬 동영상 러닝코스 속도 편집 툴 (핵심 신규 기능)

#### 개념
러닝 중 GPS로 기록된 **속도 데이터**와 **촬영된 영상**을 동기화하여,  
코스 구간별로 영상 속도를 자동/수동으로 편집하는 **인브라우저 편집 툴**.

#### 핵심 기능 상세

```
🎬 VideoRunEditor — 동영상 러닝코스 속도 편집 툴

① 영상 + GPS 자동 동기화
   - 러닝 세션 시작 timestamp ↔ 영상 시작 timestamp 매핑
   - GPS 속도 데이터를 타임라인으로 시각화 (속도 그래프)
   - 구간별 색상 표시:
       🔴 빠름 (5:00/km 미만) — 하이라이트 구간
       🟡 보통 (5:00~7:00/km)
       🔵 느림 (7:00/km 초과)

② 구간별 배속 편집 (수동)
   - 타임라인에서 구간 드래그로 선택
   - 선택 구간 배속: 0.5x / 1x / 1.5x / 2x / 4x / 8x
   - 느린 구간 자동 패스트포워드 추천

③ 자동 하이라이트 편집 (AI — VIDY 에이전트)
   - VIDY가 GPS 속도 급상승 구간 자동 감지
   - 최고 속도 구간 → 슬로우모션 (0.5x)
   - 휴식·걷기 구간 → 패스트포워드 (4x)
   - 언덕 정복 구간 → 극적 음악 + 슬로우 연출 자동 제안

④ 코스 오버레이
   - 영상 위에 GPS 경로 미니맵 오버레이 (우하단)
   - 현재 재생 위치 = 지도 위 점 실시간 이동
   - 속도계 오버레이 표시 (현재 페이스 숫자)

⑤ 편집 완료 → 내보내기
   - 웹 브라우저 내에서 FFmpeg.wasm으로 영상 렌더링
   - 출력 포맷: MP4 (SNS 업로드) / GIF (숏폼) / 9:16 세로 (Instagram Reels / YouTube Shorts)
   - Supabase Storage에 자동 저장
   - 원스텝 SNS 공유 (Web Share API)
```

#### 기술 구현

```typescript
// components/editor/VideoRunEditor.tsx

/*
 핵심 기술 스택:
 - FFmpeg.wasm (@ffmpeg/ffmpeg ^0.12.x) : 브라우저 내 영상 처리
 - Canvas API : 속도 오버레이, 미니맵 렌더링
 - Web Workers : FFmpeg 처리를 별도 스레드에서 실행 (UI 블로킹 방지)
 - Supabase Storage : 원본/완성 영상 저장
*/

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

interface Segment {
  startTime: number    // 영상 내 시작 초
  endTime:   number    // 영상 내 종료 초
  speed:     number    // GPS 속도 (km/h)
  playbackRate: number // 편집 배속 (0.5 / 1 / 2 / 4)
  isHighlight: boolean // VIDY 추천 하이라이트
}

// VIDY 에이전트가 자동 분석한 구간 배속 추천
async function analyzeRunSegments(
  gpsRoute: { timestamp: number; speedKmh: number }[]
): Promise<Segment[]> {
  // 속도 기반 자동 구간 분류
  return gpsRoute.reduce<Segment[]>((segments, point, i) => {
    const prevSpeed = i > 0 ? gpsRoute[i-1].speedKmh : point.speedKmh
    const playbackRate =
      point.speedKmh >= 12 ? 0.5  :  // 최고속 → 슬로우
      point.speedKmh >= 8  ? 1.0  :  // 보통 → 정속
      point.speedKmh >= 4  ? 2.0  :  // 느림 → 2배속
                             4.0      // 걷기/정지 → 4배속
    // ...구간 병합 로직
    return segments
  }, [])
}

// FFmpeg.wasm으로 배속 편집 렌더링
async function renderEditedVideo(
  ffmpeg:    FFmpeg,
  videoFile: File,
  segments:  Segment[]
): Promise<Blob> {
  await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))

  // 구간별 filter_complex 생성
  const filterComplex = segments.map((seg, i) => {
    const pts = seg.playbackRate === 1 ? '' : `,setpts=${1/seg.playbackRate}*PTS`
    return `[0:v]trim=start=${seg.startTime}:end=${seg.endTime}${pts}[v${i}]`
  }).join(';')

  const concatInputs = segments.map((_,i) => `[v${i}]`).join('')
  const filter = `${filterComplex};${concatInputs}concat=n=${segments.length}:v=1[outv]`

  await ffmpeg.exec([
    '-i', 'input.mp4',
    '-filter_complex', filter,
    '-map', '[outv]',
    '-c:v', 'libx264',
    '-preset', 'fast',
    'output.mp4'
  ])

  const data = await ffmpeg.readFile('output.mp4')
  return new Blob([data], { type: 'video/mp4' })
}
```

#### 편집 UI 구조

```
┌─────────────────────────────────────────────────────┐
│  🎬 RunMate 영상 편집기                              │
├──────────────────────────┬──────────────────────────┤
│                          │  📊 GPS 속도 그래프       │
│   📹 영상 미리보기        │  ████████▄▄▄▄████ (속도) │
│   (현재 재생 위치 표시)   │                          │
│                          │  🗺️ 코스 미니맵           │
│   [ 속도계: 4:32/km ]    │  (현재 위치 점 이동)      │
│   [ 고도: 42m ]          │                          │
└──────────────────────────┴──────────────────────────┘
│                  타임라인                            │
│  ──🟥🟥🟥🟡🟡🟡🔵🔵🟥🟥🟥🟡🔵─────────────────  │
│    5:30━━━ 6:10━━━ 7:20━━━ 5:00━━━ 6:30━━━         │
│    [0.5x]  [1x]   [4x]  [0.5x]  [2x]              │
├─────────────────────────────────────────────────────┤
│  ✨ VIDY AI 추천:                                   │
│  "2:30~3:15 구간 최고 속도! 슬로우 강추 👟"         │
│  "5:00~6:30 걷기 구간 → 4배속 자동 적용할까요?"     │
├─────────────────────────────────────────────────────┤
│  [🤖 AI 자동편집] [▶ 미리보기] [📤 내보내기]        │
│  포맷: [MP4] [9:16 Reels] [GIF]                    │
└─────────────────────────────────────────────────────┘
```

---

### 3.3 GPS 러닝 기록 (P0)
```
- 브라우저 Geolocation API 실시간 GPS
- Google Maps JS SDK 경로 Polyline
- 거리 / 페이스 / 칼로리 / 고도 실시간 표시
- 러닝 세션 → Supabase running_sessions 저장
- PWA Service Worker 백그라운드 GPS 유지
```

### 3.4 친구 러닝 알림 (P0)
```
- Supabase Realtime 채널로 친구 위치 구독
- 친구 isRunning=true 감지 → 토스 스타일 플로팅 알림
- Framer Motion 슬라이드 다운 애니메이션
- "같이 달리기" / "응원 보내기" 액션 버튼
```

### 3.5 러닝코스 스탬프 (P0)
```
- GPS 트랙 → 코스 폴리곤 매칭 (70% 이상 → 획득)
- Framer Motion 카드 Flip 애니메이션
- canvas-confetti 파티클 효과
- Supabase user_stamps 테이블 관리
- 희귀도: 브론즈/실버/골드/스페셜/에픽/레전드
```

---

## 4. 기술 스택 상세

### 4.1 전체 아키텍처

```
┌──────────────────────────────────────────────────────────┐
│          FRONTEND (Next.js 15 + Tailwind CSS v4)          │
│                                                           │
│  Google Stitch → UI 생성 → Tailwind 코드 Export          │
│  Next.js 15 App Router (Node.js 18+ 필수)                │
│  TypeScript 5                                            │
│  Tailwind CSS v4                                         │
│  Zustand (클라이언트 상태)                               │
│  TanStack Query v5 (서버 상태)                           │
│  Framer Motion (애니메이션)                              │
│  canvas-confetti (스탬프 파티클)                         │
│  FFmpeg.wasm (인브라우저 영상 편집)         ← NEW        │
│  @vis.gl/react-google-maps (지도)                        │
└──────────────────────────────────────────────────────────┘
                    │ REST API / Supabase Client
┌──────────────────────────────────────────────────────────┐
│          SUPABASE (Backend as a Service)                   │
│                                                           │
│  PostgreSQL     DB (러닝기록, 스탬프, 마라톤, 유저)      │
│  Auth           Google OAuth + JWT                       │
│  Realtime       친구 러닝 위치 실시간 채널               │
│  Storage        영상/이미지 원본 + 편집본 저장            │
│  Edge Functions 스탬프 검증, FCM 알림 발송 (Deno)        │
└──────────────────────────────────────────────────────────┘
                    │
┌──────────────────────────────────────────────────────────┐
│          AI AGENT BACKEND (FastAPI + LangGraph)            │
│  FastAPI + Python 3.11+                                  │
│  LangGraph 0.2+ (페르소나 멀티 에이전트)                 │
│  Claude API claude-sonnet-4-5                            │
│  Vercel / Railway 배포                                   │
└──────────────────────────────────────────────────────────┘
```

### 4.2 package.json

```json
{
  "name": "runmate-ai",
  "version": "1.0.0",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "dev":        "next dev --turbopack",
    "build":      "next build",
    "start":      "next start",
    "type-check": "tsc --noEmit",
    "lint":       "next lint"
  },
  "dependencies": {
    "next":       "15.2.0",
    "react":      "^19.0.0",
    "react-dom":  "^19.0.0",
    "typescript": "^5.7.0",

    "── Supabase ──────────────────────────": "",
    "@supabase/supabase-js":    "^2.47.0",
    "@supabase/ssr":            "^0.5.2",

    "── Google Maps ───────────────────────": "",
    "@vis.gl/react-google-maps": "^1.4.0",

    "── 상태관리 ──────────────────────────": "",
    "zustand":                  "^5.0.2",
    "@tanstack/react-query":    "^5.62.0",

    "── 스타일 ────────────────────────────": "",
    "tailwindcss":              "^4.0.0",
    "clsx":                     "^2.1.1",
    "tailwind-merge":           "^2.5.5",

    "── 애니메이션 ────────────────────────": "",
    "framer-motion":            "^12.0.0",
    "canvas-confetti":          "^1.9.3",
    "lottie-web":               "^5.12.2",

    "── 🎬 동영상 편집 ────────────────────": "",
    "@ffmpeg/ffmpeg":           "^0.12.10",
    "@ffmpeg/util":             "^0.12.1",

    "── PWA ───────────────────────────────": "",
    "next-pwa":                 "^5.6.0",

    "── UI 컴포넌트 ───────────────────────": "",
    "@radix-ui/react-dialog":   "^1.1.4",
    "@radix-ui/react-slider":   "^1.2.2",
    "@radix-ui/react-tabs":     "^1.1.2",
    "@radix-ui/react-toast":    "^1.2.4",
    "lucide-react":             "^0.469.0",

    "── 유틸 ──────────────────────────────": "",
    "date-fns":                 "^4.1.0",
    "axios":                    "^1.7.9"
  },
  "devDependencies": {
    "@types/react":             "^19.0.0",
    "@types/node":              "^22.0.0",
    "@types/canvas-confetti":   "^1.9.0",
    "eslint":                   "^9.0.0",
    "eslint-config-next":       "15.2.0",
    "prettier":                 "^3.4.0",
    "prettier-plugin-tailwindcss": "^0.6.9"
  }
}
```

### 4.3 AI Agent Backend (requirements.txt)

```txt
fastapi==0.115.0
uvicorn[standard]==0.30.0
langgraph==0.2.50
langchain-anthropic==0.3.0
anthropic==0.40.0
supabase==2.10.0          # Supabase Python 클라이언트
pydantic==2.9.0
pydantic-settings==2.6.0
httpx==0.27.0
shapely==2.0.6            # 스탬프 코스 폴리곤 매칭
geopy==2.4.1
Pillow==11.0.0
```

---

## 5. Supabase 스키마

```sql
-- ───────────────────────────────────────
-- Supabase에서 직접 실행 (SQL Editor)
-- ───────────────────────────────────────

-- 사용자 프로필 (Supabase Auth users 테이블 확장)
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          VARCHAR(50)  NOT NULL,
  avatar_url    TEXT,
  runner_grade  VARCHAR(20)  DEFAULT 'bronze',
  gps_share     BOOLEAN      DEFAULT false,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "프로필 본인만 수정" ON profiles
  FOR ALL USING (auth.uid() = id);

-- 친구 관계
CREATE TABLE friendships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id),
  friend_id  UUID REFERENCES profiles(id),
  status     VARCHAR(20) DEFAULT 'pending',  -- pending|accepted|blocked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 친구 실시간 러닝 위치 (Supabase Realtime 활용)
CREATE TABLE friend_running_status (
  user_id      UUID PRIMARY KEY REFERENCES profiles(id),
  is_running   BOOLEAN     DEFAULT false,
  lat          DECIMAL(9,6),
  lng          DECIMAL(9,6),
  distance_km  DECIMAL(6,3) DEFAULT 0,
  course_name  VARCHAR(100),
  started_at   TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE friend_running_status ENABLE ROW LEVEL SECURITY;
-- 친구만 위치 조회 가능
CREATE POLICY "친구 위치 조회" ON friend_running_status
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friendships
      WHERE user_id = auth.uid() AND friend_id = friend_running_status.user_id
      AND status = 'accepted'
    )
  );

-- 러닝 세션
CREATE TABLE running_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id),
  started_at   TIMESTAMPTZ NOT NULL,
  ended_at     TIMESTAMPTZ,
  distance_km  DECIMAL(6,3),
  duration_sec INTEGER,
  avg_pace     DECIMAL(5,2),
  calories     INTEGER,
  route        JSONB,   -- [{lat, lng, timestamp, speed_kmh}] ← 속도 포함!
  course_id    VARCHAR(50),
  video_url    TEXT,    -- Supabase Storage 원본 영상 URL
  edited_video_url TEXT, -- 편집 완료 영상 URL
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 스탬프 정의
CREATE TABLE stamps (
  id             VARCHAR(20) PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  region         VARCHAR(50),
  icon           VARCHAR(10),
  distance_km    DECIMAL(6,3),
  rarity         VARCHAR(20),
  route_polygon  JSONB,
  description    TEXT,
  season_start   DATE,
  season_end     DATE
);

-- 사용자 스탬프 획득
CREATE TABLE user_stamps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id),
  stamp_id     VARCHAR(20) REFERENCES stamps(id),
  earn_count   INTEGER     DEFAULT 1,
  first_earned TIMESTAMPTZ DEFAULT NOW(),
  session_id   UUID REFERENCES running_sessions(id),
  UNIQUE(user_id, stamp_id)
);

-- 마라톤 대회
CREATE TABLE marathons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(200) NOT NULL,
  region         VARCHAR(50),
  country        VARCHAR(10) DEFAULT 'KR',
  race_date      DATE NOT NULL,
  location       VARCHAR(200),
  distances      JSONB,
  status         VARCHAR(20),
  apply_url      TEXT,
  apply_start    DATE,
  apply_end      DATE,
  entry_fee      INTEGER,
  is_world_major BOOLEAN DEFAULT false
);

-- 마라톤 알림
CREATE TABLE marathon_alerts (
  user_id     UUID REFERENCES profiles(id),
  marathon_id UUID REFERENCES marathons(id),
  PRIMARY KEY (user_id, marathon_id)
);

-- 동영상 편집 기록
CREATE TABLE video_edits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id),
  session_id   UUID REFERENCES running_sessions(id),
  original_url TEXT NOT NULL,          -- Supabase Storage 원본
  edited_url   TEXT,                   -- 편집 완료본
  segments     JSONB,                  -- [{startTime, endTime, playbackRate, isHighlight}]
  vidy_suggest JSONB,                  -- VIDY AI 추천 구간
  format       VARCHAR(20),            -- mp4 | reels | gif
  status       VARCHAR(20) DEFAULT 'pending',  -- pending|processing|done|error
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 커뮤니티 포스트
CREATE TABLE posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id),
  session_id UUID REFERENCES running_sessions(id),
  content    TEXT,
  media_urls JSONB,
  lang       VARCHAR(10) DEFAULT 'ko',
  likes      INTEGER     DEFAULT 0,
  is_global  BOOLEAN     DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.1 Supabase Realtime — 친구 위치 구독

```typescript
// hooks/useFriendRunning.ts
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFriendStore } from '@/stores/friendStore'

export function useFriendRunning(friendIds: string[]) {
  const supabase = createClient()
  const { setRunningFriends, triggerToast } = useFriendStore()

  useEffect(() => {
    if (!friendIds.length) return

    // Supabase Realtime 채널 구독
    const channel = supabase
      .channel('friend-running')
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'friend_running_status',
          filter: `user_id=in.(${friendIds.join(',')})`,
        },
        (payload) => {
          const data = payload.new as FriendRunningStatus
          if (data.is_running) {
            setRunningFriends(prev => ({ ...prev, [data.user_id]: data }))
            triggerToast(data)   // 토스 스타일 알림 트리거
          } else {
            setRunningFriends(prev => {
              const next = { ...prev }
              delete next[data.user_id]
              return next
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [friendIds])
}
```

---

## 6. API 엔드포인트

### 6.1 Supabase 직접 호출 (클라이언트)
```
Supabase Auth   → Google OAuth 소셜 로그인
Supabase DB     → 러닝 기록 CRUD, 스탬프 조회
Supabase RT     → 친구 위치 실시간 구독
Supabase Storage→ 영상/이미지 업로드·다운로드
```

### 6.2 AI Agent API (FastAPI)
```
BASE URL: https://agent.runmate.ai/v1

POST  /agent/chat              RAMI Orchestrator 자연어 호출
POST  /agent/stamp/verify      STAMPY 코스 완주 GPS 검증
POST  /agent/video/analyze     VIDY 영상 구간 자동 분석
GET   /agent/course/recommend  COSHI 코스 추천
GET   /agent/gear/recommend    GEARS 용품 추천
POST  /agent/translate         LINGUA 다국어 번역

WS    /ws/running/{session_id} TRACKER 러닝 실시간 스트리밍
```

### 6.3 Next.js API Routes (BFF)
```
POST  /api/auth/callback       Supabase Auth 콜백
POST  /api/video/render        FFmpeg.wasm 렌더링 트리거
POST  /api/notify/fcm          FCM 마라톤 알림 발송
POST  /api/sns/share           SNS 공유 처리
```

---

## 7. 프로젝트 폴더 구조

```
runmate-ai/
│
├── frontend/                              # Next.js 15
│   ├── app/
│   │   ├── layout.tsx                     # Root Layout
│   │   ├── page.tsx                       # 랜딩 (/)
│   │   │
│   │   ├── (main)/                        # 인증 후 레이아웃
│   │   │   ├── layout.tsx                 # 바텀 네비게이션
│   │   │   ├── page.tsx                   # 홈 피드
│   │   │   ├── courses/page.tsx
│   │   │   ├── record/page.tsx
│   │   │   ├── stamps/page.tsx
│   │   │   ├── community/page.tsx
│   │   │   └── my/page.tsx
│   │   │
│   │   ├── running/
│   │   │   ├── active/page.tsx            # 러닝 중
│   │   │   └── result/[id]/page.tsx       # 러닝 완료
│   │   │
│   │   ├── editor/                        # 🎬 동영상 편집 툴
│   │   │   └── [sessionId]/page.tsx       # 세션별 편집 화면
│   │   │
│   │   ├── marathon/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/callback/route.ts     # Supabase Auth
│   │       ├── video/render/route.ts      # FFmpeg 트리거
│   │       └── notify/route.ts
│   │
│   ├── components/
│   │   ├── home/
│   │   │   ├── FriendRunningToast.tsx     # 토스 스타일 알림
│   │   │   ├── FriendAlertBanner.tsx
│   │   │   ├── GpsRunCard.tsx
│   │   │   └── AgentChatBar.tsx           # AI Agent 입력
│   │   │
│   │   ├── editor/                        # 🎬 영상 편집 컴포넌트
│   │   │   ├── VideoRunEditor.tsx         # 메인 편집 툴
│   │   │   ├── SpeedTimeline.tsx          # GPS 속도 타임라인
│   │   │   ├── VideoPreview.tsx           # 영상 미리보기
│   │   │   ├── SegmentControls.tsx        # 구간별 배속 컨트롤
│   │   │   ├── CourseOverlay.tsx          # 코스 미니맵 오버레이
│   │   │   ├── VidyAISuggest.tsx          # VIDY AI 추천 패널
│   │   │   └── ExportPanel.tsx            # 내보내기 (포맷/SNS)
│   │   │
│   │   ├── running/
│   │   │   ├── RunningMap.tsx
│   │   │   └── RunningStats.tsx
│   │   │
│   │   ├── stamps/
│   │   │   ├── StampBook.tsx
│   │   │   ├── StampCard.tsx
│   │   │   ├── StampDetailSheet.tsx
│   │   │   ├── PassportCard.tsx
│   │   │   └── EarnAnimation.tsx
│   │   │
│   │   ├── marathon/
│   │   │   ├── MarathonCard.tsx
│   │   │   └── RegionFilterTabs.tsx
│   │   │
│   │   └── common/
│   │       ├── BottomSheet.tsx
│   │       ├── Toast.tsx
│   │       ├── ConfettiEffect.tsx
│   │       └── BottomNav.tsx
│   │
│   ├── hooks/
│   │   ├── useGPS.ts                      # Geolocation GPS 훅
│   │   ├── useFriendRunning.ts            # Supabase Realtime 친구 구독
│   │   ├── useVideoEditor.ts              # FFmpeg.wasm 편집 훅
│   │   ├── useStampVerify.ts              # 스탬프 검증
│   │   └── useAuth.ts                     # Supabase Auth
│   │
│   ├── stores/
│   │   ├── runningStore.ts
│   │   ├── stampStore.ts
│   │   ├── friendStore.ts
│   │   ├── editorStore.ts                 # 영상 편집 상태
│   │   └── userStore.ts
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                  # 브라우저용 Supabase 클라이언트
│   │   │   ├── server.ts                  # 서버용 Supabase 클라이언트
│   │   │   └── middleware.ts              # Auth 미들웨어
│   │   ├── ffmpeg.ts                      # FFmpeg.wasm 초기화
│   │   └── api.ts                         # Agent API Axios 인스턴스
│   │
│   ├── constants/
│   │   ├── stampData.ts
│   │   ├── marathonData.ts
│   │   └── colors.ts
│   │
│   ├── public/
│   │   ├── manifest.json                  # PWA
│   │   └── ffmpeg/                        # FFmpeg.wasm 바이너리
│   │       ├── ffmpeg-core.js
│   │       └── ffmpeg-core.wasm
│   │
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.local
│
├── agent-backend/                         # FastAPI + LangGraph
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   │
│   │   ├── agents/
│   │   │   ├── orchestrator.py            # RAMI
│   │   │   ├── personas.py                # 11개 페르소나 정의
│   │   │   ├── state.py                   # RunMateState
│   │   │   ├── mara.py                    # 마라톤 일정
│   │   │   ├── globi.py                   # 세계 마라톤
│   │   │   ├── coshi.py                   # 코스 추천
│   │   │   ├── travi.py                   # 여행 러닝
│   │   │   ├── gears.py                   # 용품 추천
│   │   │   ├── tracker.py                 # GPS 분석
│   │   │   ├── vidy.py                    # 영상 편집 AI  ← NEW
│   │   │   ├── soar.py                    # 친구 알림
│   │   │   ├── stampy.py                  # 스탬프 검증
│   │   │   └── lingua.py                  # 커뮤니티 번역
│   │   │
│   │   ├── services/
│   │   │   ├── gps_service.py
│   │   │   ├── stamp_service.py           # Shapely 폴리곤 매칭
│   │   │   ├── video_service.py           # VIDY 구간 분석  ← NEW
│   │   │   └── supabase_service.py        # Supabase Python 클라이언트
│   │   │
│   │   └── routers/
│   │       ├── agent.py
│   │       ├── stamp.py
│   │       └── video.py                   # 영상 분석 API  ← NEW
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── supabase/                              # Supabase 로컬 개발
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   ├── functions/                         # Supabase Edge Functions
│   │   ├── notify-marathon/              # 마라톤 알림 크론 함수
│   │   │   └── index.ts
│   │   └── stamp-verify/                 # 스탬프 서버사이드 검증
│   │       └── index.ts
│   └── config.toml
│
└── README.md
```

---

## 8. 환경변수

```bash
# frontend/.env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key

# AI Agent Backend
NEXT_PUBLIC_AGENT_API_URL=https://agent.runmate.ai/v1

# FFmpeg CDN (wasm 로딩)
NEXT_PUBLIC_FFMPEG_CDN=https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd
```

```bash
# agent-backend/.env

ANTHROPIC_API_KEY=your-anthropic-api-key
CLAUDE_MODEL=claude-sonnet-4-5
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # 서버사이드 전용
GOOGLE_MAPS_API_KEY=your-maps-key
```

---

## 9. Stitch 활용 가이드

### 9.1 Stitch로 생성할 주요 화면

```
Stitch 프롬프트 예시:

① 홈 화면
"러닝앱 홈화면. 다크 테마 (#0D0D14 배경). 상단에 친구 러닝중 알림 배너
(초록색 border-left, 아바타, 이름, 거리, 같이달려/응원 버튼).
중앙에 GPS 러닝 카드 (실시간 거리/페이스/칼로리 3열 통계).
큰 초록색 시작 버튼. Tailwind CSS 코드로 출력."

② 스탬프 도감
"러닝앱 스탬프 도감. 패스포트 카드 상단 (러너 이름, 등급 프로그레스바).
3열 그리드 스탬프 카드 (획득=골드 border, 미획득=회색 흐림).
스탬프 아이콘, 코스명, 거리, 획득 횟수. Tailwind CSS."

③ 동영상 편집 툴
"러닝 동영상 편집기. 좌측 영상 미리보기, 우측 GPS 속도 그래프.
하단 타임라인 바 (색상: 빨강=빠름, 노랑=보통, 파랑=느림).
AI 추천 텍스트 박스. 내보내기 버튼들. 다크 테마. Tailwind CSS."
```

### 9.2 Stitch Export → Next.js 통합 체크리스트

```
[ ] Stitch에서 Tailwind CSS 코드 Export
[ ] components/ 폴더에 .tsx 파일로 저장
[ ] 'use client' 디렉티브 추가 (인터랙션 있는 컴포넌트)
[ ] Tailwind 클래스 → tailwind.config.ts 커스텀 색상 적용
[ ] 정적 텍스트 → 실제 데이터 props로 교체
[ ] Supabase 데이터 훅 연결
[ ] Framer Motion 애니메이션 추가
```

---

## 10. 개발 로드맵

### Phase 1 — MVP (4주)
- [ ] Next.js 15 + Tailwind v4 + Supabase 초기 세팅
- [ ] Supabase Google OAuth 로그인
- [ ] Google Stitch로 홈/GPS/스탬프 UI 생성 + 통합
- [ ] GPS 러닝 기록 (useGPS + Google Maps Polyline)
- [ ] 마라톤 일정 목록 (Supabase DB)
- [ ] 스탬프 도감 UI
- [ ] PWA 설정

### Phase 2 — 핵심 기능 (4주)
- [ ] LangGraph 페르소나 멀티 에이전트 구성 (11개 페르소나)
- [ ] STAMPY — 스탬프 GPS 코스 매칭 (Shapely)
- [ ] SOAR — Supabase Realtime 친구 러닝 알림
- [ ] **🎬 VIDY — 동영상 속도 편집 툴 (FFmpeg.wasm)**
- [ ] Supabase Edge Functions (마라톤 알림 크론)

### Phase 3 — 소셜 기능 (3주)
- [ ] LINGUA — 커뮤니티 피드 + 다국어 번역
- [ ] 러닝 기록 카드 이미지 생성 (Canvas API)
- [ ] SNS 원스텝 업로드 (Web Share API + 각 플랫폼 API)
- [ ] Stitch로 커뮤니티/MY 화면 추가 생성

### Phase 4 — 고도화 (지속)
- [ ] GEARS — 용품 추천 Agent
- [ ] TRAVI — 해외 여행 코스 Agent
- [ ] 스탬프 랭킹 / 리더보드
- [ ] 영상 편집 → AI 자동 BGM 추가 (VIDY)
- [ ] 오프라인 모드 (Service Worker + Supabase 로컬 캐시)

---

## 11. Cursor 개발 프롬프트

```
# Supabase 친구 실시간 알림
"Next.js 15 + Supabase에서 friend_running_status 테이블의
postgres_changes를 Realtime 채널로 구독하고,
친구가 is_running=true로 업데이트되면
Framer Motion AnimatePresence로 상단 슬라이드 다운 FriendRunningToast를
표시하는 useFriendRunning 훅과 컴포넌트를 구현해줘."

# 🎬 동영상 속도 편집 툴
"FFmpeg.wasm을 사용해서 Next.js에서 인브라우저 러닝 동영상 편집 툴을 만들어줘.
GPS route의 speed_kmh 데이터를 기반으로 타임라인을 색상 구분하고
(빨강=빠름, 노랑=보통, 파랑=느림), 각 구간의 배속을 0.5x/1x/2x/4x로
설정하면 FFmpeg filter_complex로 최종 영상을 렌더링하는
useVideoEditor 훅과 VideoRunEditor 컴포넌트를 구현해줘."

# VIDY AI 구간 분석
"FastAPI에서 VIDY 페르소나 에이전트를 구현해줘.
GPS route의 speed_kmh 배열을 받아서 Claude API로
하이라이트 구간(최고속도), 슬로우 구간(느림), 패스트포워드 구간(걷기)을
JSON으로 분류하고 편집 추천 이유를 VIDY의 크리에이터 말투로 설명하는
vidy.py 에이전트를 작성해줘."

# 페르소나 멀티 에이전트
"LangGraph StateGraph로 RunMate 페르소나 멀티 에이전트를 구현해줘.
RAMI가 Claude API로 의도를 분류하고 MARA/GLOBI/COSHI/TRAVI/GEARS/
TRACKER/VIDY/SOAR/STAMPY/LINGUA 중 적절한 페르소나로 라우팅.
각 페르소나는 자신만의 system_prompt 말투로 응답하게 해줘."

# Supabase + Stitch 통합
"Stitch에서 생성한 Tailwind CSS 홈화면 컴포넌트에
Supabase Realtime useFriendRunning 훅과
useGPS 훅을 연결해서 실제 동작하는 홈 화면을 완성해줘."
```

---

## 12. 참고 자료

| 항목 | URL |
|------|-----|
| **Google Stitch** | https://stitch.withgoogle.com |
| Next.js 15 | https://nextjs.org/docs |
| Tailwind CSS v4 | https://tailwindcss.com/docs |
| **Supabase 공식 문서** | https://supabase.com/docs |
| Supabase Realtime | https://supabase.com/docs/guides/realtime |
| Supabase Edge Functions | https://supabase.com/docs/guides/functions |
| **FFmpeg.wasm** | https://ffmpegwasm.netlify.app |
| @ffmpeg/ffmpeg npm | https://www.npmjs.com/package/@ffmpeg/ffmpeg |
| LangGraph 공식 문서 | https://langchain-ai.github.io/langgraph/ |
| Claude API | https://docs.anthropic.com |
| Google Maps Platform | https://developers.google.com/maps |
| Framer Motion | https://www.framer.com/motion |
| 마라톤 일정 | https://marathongo.co.kr |
| Node.js LTS | https://nodejs.org/en/download (18+ 필수) |

---

*RunMate AI PRD v4.0 — Stitch + Tailwind + Node.js 18+ + Supabase + 페르소나 멀티 에이전트 + 동영상 편집툴 — 2026.03.24*