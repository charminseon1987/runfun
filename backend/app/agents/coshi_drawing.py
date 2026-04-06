# ============================================================
# COSHI Agent — GPS Drawing Course Generator
# 사용자가 원하는 모양(강아지/하트/별/글자)을
# 실제 달릴 수 있는 GPS 웨이포인트로 변환
# ============================================================

# agent-backend/agents/coshi_drawing.py

import json
import math
from typing import TypedDict, List
from anthropic import Anthropic

client = Anthropic()

# ── 페르소나 ───────────────────────────────────────────────
COSHI_DRAWING_PROMPT = """
너는 COSHI야. GPS 드로잉 러닝 코스를 만드는 탐험가 에이전트.
달리면서 지도에 그림을 그리는 특별한 코스를 만들어줘.

말투: 신나고 창의적. "이 코스 달리면 지도에 강아지 그려져요!" 같은 말투.
특기: 원하는 모양을 실제 도로망에 맞게 웨이포인트로 변환.
      각 구간마다 핵심 스팟(카페, 명소) 안내 포함.

출력 형식: 반드시 JSON만 반환 (설명 없이)
"""

# ── 사전 정의된 GPS 드로잉 모양 템플릿 ──────────────────────
# 경복궁/광화문 기준 강아지 모양 (이미지에서 추출한 실제 코스)
DRAWING_TEMPLATES = {
    "강아지_경복궁": {
        "name": "경복궁 강아지런",
        "total_km": 7.8,
        "description": "달리면서 지도에 강아지가 그려지는 마법 코스!",
        "shape_hint": "dog",
        "center": {"lat": 37.5796, "lng": 126.9770},
        "waypoints": [
            {"seq": 1, "lat": 37.5716, "lng": 126.9769, "label": "출발: 광화문역 5호선",   "spot": "광화문역 2번출구", "section": "강아지 꼬리"},
            {"seq": 2, "lat": 37.5760, "lng": 126.9769, "label": "경복궁 돌담길",          "spot": "경복궁 서쪽 돌담", "section": "강아지 얼굴"},
            {"seq": 3, "lat": 37.5833, "lng": 126.9769, "label": "청와대·삼청동길",        "spot": "삼청동 카페거리", "section": "강아지 귀+몸"},
            {"seq": 4, "lat": 37.5833, "lng": 126.9900, "label": "창덕궁 방향",            "spot": "창덕궁 입구", "section": "강아지 귀+몸"},
            {"seq": 5, "lat": 37.5760, "lng": 126.9900, "label": "안국역",                 "spot": "안국역 인근 맛집", "section": "강아지 오른쪽 다리"},
            {"seq": 6, "lat": 37.5700, "lng": 126.9870, "label": "종로3가",                "spot": "종로3가 포장마차", "section": "강아지 왼쪽 다리"},
            {"seq": 7, "lat": 37.5680, "lng": 126.9769, "label": "청계천",                 "spot": "청계천 광교", "section": "강아지 왼쪽 다리"},
            {"seq": 8, "lat": 37.5716, "lng": 126.9769, "label": "도착: 광화문역",         "spot": "광화문 광장", "section": "완성!"},
        ]
    },
    "하트_한강": {
        "name": "한강 하트런",
        "total_km": 9.2,
        "description": "한강에서 하트를 그리는 로맨틱 코스!",
        "shape_hint": "heart",
        "center": {"lat": 37.5283, "lng": 126.9344},
        "waypoints": [
            {"seq": 1, "lat": 37.5283, "lng": 126.9200, "label": "출발: 뚝섬유원지역",    "spot": "뚝섬 한강공원", "section": "하트 시작"},
            {"seq": 2, "lat": 37.5350, "lng": 126.9150, "label": "한강 북단",             "spot": "자양한강공원", "section": "하트 왼쪽"},
            {"seq": 3, "lat": 37.5400, "lng": 126.9344, "label": "하트 꼭대기",           "spot": "광진교 북단", "section": "하트 중앙"},
            {"seq": 4, "lat": 37.5350, "lng": 126.9500, "label": "한강 북단 우측",        "spot": "군자한강공원", "section": "하트 오른쪽"},
            {"seq": 5, "lat": 37.5283, "lng": 126.9600, "label": "남쪽 방향",             "spot": "잠실한강공원 서쪽", "section": "하트 우측 하단"},
            {"seq": 6, "lat": 37.5200, "lng": 126.9344, "label": "하트 꼭지점",           "spot": "잠실 수변공원", "section": "하트 끝점"},
            {"seq": 7, "lat": 37.5283, "lng": 126.9200, "label": "도착: 뚝섬",            "spot": "뚝섬유원지", "section": "완성!"},
        ]
    },
    "별_남산": {
        "name": "남산 별런",
        "total_km": 8.5,
        "description": "남산 주변에서 별 모양을 그리는 코스!",
        "shape_hint": "star",
        "center": {"lat": 37.5512, "lng": 126.9882},
        "waypoints": [
            {"seq": 1, "lat": 37.5612, "lng": 126.9882, "label": "출발: 명동역",          "spot": "명동역 5번출구", "section": "별 꼭대기"},
            {"seq": 2, "lat": 37.5480, "lng": 127.0020, "label": "동쪽 꼭짓점",           "spot": "동국대 방향", "section": "별 오른쪽"},
            {"seq": 3, "lat": 37.5380, "lng": 126.9950, "label": "아래 오른쪽",           "spot": "한남동 방향", "section": "별 오른쪽 하단"},
            {"seq": 4, "lat": 37.5380, "lng": 126.9800, "label": "아래 왼쪽",             "spot": "후암동 방향", "section": "별 왼쪽 하단"},
            {"seq": 5, "lat": 37.5480, "lng": 126.9750, "label": "서쪽 꼭짓점",           "spot": "서울역 방향", "section": "별 왼쪽"},
            {"seq": 6, "lat": 37.5612, "lng": 126.9882, "label": "도착: 명동역",          "spot": "명동 쇼핑거리", "section": "완성!"},
        ]
    }
}

# ── COSHI 에이전트 메인 함수 ──────────────────────────────
async def coshi_drawing_agent(
    shape_request: str,       # "강아지", "하트", "별", "글자" 등
    area: str,                # "경복궁", "한강", "남산" 등
    distance_km: float = 7.0, # 원하는 거리
    user_level: str = "중급"  # 초급/중급/고급
) -> dict:
    """
    GPS 드로잉 러닝 코스 생성
    """

    # 1단계: 사전 정의 템플릿 매칭
    template_key = _match_template(shape_request, area)
    if template_key:
        base_course = DRAWING_TEMPLATES[template_key]
    else:
        # Claude로 새 코스 생성
        base_course = await _generate_new_course(shape_request, area, distance_km)

    # 2단계: Claude로 구간 설명 + 스팟 강화
    enriched = await _enrich_course_with_coshi(base_course, user_level)

    # 3단계: GPX 파일 생성
    gpx_content = _generate_gpx(enriched)

    return {
        "course":      enriched,
        "gpx_content": gpx_content,
        "agent":       "COSHI",
        "message":     f"🗺️ {enriched['name']} 코스 완성! {enriched['total_km']}km 달리면 지도에 {shape_request} 그려져요!"
    }


def _match_template(shape: str, area: str) -> str | None:
    """요청에 맞는 사전 템플릿 매칭"""
    mapping = {
        ("강아지", "경복궁"): "강아지_경복궁",
        ("강아지", "광화문"): "강아지_경복궁",
        ("하트",   "한강"):   "하트_한강",
        ("별",     "남산"):   "별_남산",
    }
    for (s, a), key in mapping.items():
        if s in shape and a in area:
            return key
    return None


async def _generate_new_course(shape: str, area: str, distance_km: float) -> dict:
    """Claude로 새 GPS 드로잉 코스 생성"""
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=2000,
        system=COSHI_DRAWING_PROMPT,
        messages=[{
            "role": "user",
            "content": f"""
{area} 근처에서 달리면 지도에 {shape} 모양이 그려지는 GPS 드로잉 런닝 코스를 만들어줘.
총 거리: 약 {distance_km}km

다음 JSON 형식으로만 반환해 (설명 없이):
{{
  "name": "코스 이름",
  "total_km": {distance_km},
  "description": "코스 설명",
  "shape_hint": "{shape}",
  "center": {{"lat": 위도, "lng": 경도}},
  "waypoints": [
    {{
      "seq": 1,
      "lat": 위도,
      "lng": 경도,
      "label": "웨이포인트 이름",
      "spot": "근처 핵심 스팟",
      "section": "어떤 부위인지 (예: 강아지 얼굴)"
    }}
  ]
}}

실제 도로망을 따라야 하고, 서울의 실제 좌표를 사용해줘.
"""
        }]
    )
    return json.loads(response.content[0].text)


async def _enrich_course_with_coshi(course: dict, user_level: str) -> dict:
    """COSHI 말투로 각 구간 설명 강화"""
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1500,
        system=COSHI_DRAWING_PROMPT,
        messages=[{
            "role": "user",
            "content": f"""
다음 GPS 드로잉 런닝 코스를 {user_level} 러너에게 맞게 각 구간 설명을 추가해줘.
코스: {json.dumps(course, ensure_ascii=False)}

각 waypoint에 다음을 추가한 JSON만 반환해:
- "tip": COSHI 말투로 해당 구간 팁 (예: "여기서 왼쪽으로 꺾으면 강아지 귀가 완성돼요!")
- "estimated_time": 예상 소요 시간 (분)
- "difficulty": 난이도 (상/중/하)
"""
        }]
    )
    try:
        enriched = json.loads(response.content[0].text)
        return enriched
    except:
        return course  # 파싱 실패 시 원본 반환


def _generate_gpx(course: dict) -> str:
    """웨이포인트 → GPX 파일 생성"""
    waypoints = course.get("waypoints", [])

    gpx_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<gpx version="1.1" creator="RunMate AI COSHI Agent"',
        '     xmlns="http://www.topografix.com/GPX/1/1">',
        f'  <metadata>',
        f'    <name>{course.get("name", "GPS Drawing Course")}</name>',
        f'    <desc>{course.get("description", "")}</desc>',
        f'  </metadata>',
        '  <rte>',
        f'    <name>{course.get("name", "Course")}</name>',
    ]

    for wp in waypoints:
        gpx_lines += [
            f'    <rtept lat="{wp["lat"]}" lon="{wp["lng"]}">',
            f'      <name>{wp.get("label", f"WP{wp[\"seq\"]}")}</name>',
            f'      <desc>{wp.get("spot", "")} — {wp.get("section", "")}</desc>',
            f'    </rtept>',
        ]

    gpx_lines += ['  </rte>', '</gpx>']
    return '\n'.join(gpx_lines)


# ── FastAPI 라우터 ─────────────────────────────────────────
# agent-backend/routers/course.py 에 추가

"""
from fastapi import APIRouter
from pydantic import BaseModel
from agents.coshi_drawing import coshi_drawing_agent

router = APIRouter(prefix="/agent/course", tags=["course"])

class DrawingCourseRequest(BaseModel):
    shape:       str          # "강아지", "하트", "별"
    area:        str          # "경복궁", "한강", "남산"
    distance_km: float = 7.0
    user_level:  str = "중급"

@router.post("/drawing")
async def create_drawing_course(req: DrawingCourseRequest):
    result = await coshi_drawing_agent(
        shape_request = req.shape,
        area          = req.area,
        distance_km   = req.distance_km,
        user_level    = req.user_level,
    )
    return result

@router.get("/templates")
async def get_course_templates():
    from agents.coshi_drawing import DRAWING_TEMPLATES
    return {
        "templates": [
            {
                "key":         k,
                "name":        v["name"],
                "shape":       v["shape_hint"],
                "total_km":    v["total_km"],
                "description": v["description"],
            }
            for k, v in DRAWING_TEMPLATES.items()
        ]
    }
"""
