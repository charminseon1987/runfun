from typing import Annotated, TypedDict

from langgraph.graph.message import add_messages


class RunMateState(TypedDict, total=False):
    messages: Annotated[list, add_messages]
    intent: str
    agent_result: dict
    user_location: dict
    user_id: str
    # 오케스트레이터가 사전 로드하는 컨텍스트
    run_history: list[dict]        # 최근 5회 세션 [{distance_km, avg_pace, started_at}]
    stamp_ids: list[str]           # 사용자 획득 스탬프 ID 목록
    marathon_context: list[dict]   # 예정 마라톤 DB 데이터
    applied_marathons: list[dict]  # 사용자가 신청(알림설정)한 마라톤

    # ── ChefMyFridge(냉장고) 워크플로우 컨텍스트 ──────────────────────────────
    image_url: str | None              # Supabase Storage에 업로드된 냉장고 이미지 URL
    ingredients: list[dict] | None     # YOLO/Claude Vision 기반 인식 재료
    recipes: list[dict] | None         # CHEFIE 결과 레시피들
    nutrition_plan: dict | None        # NUTRI 결과 식단 계획
    running_session: dict | None      # CHEFIE에 필요한 running_session(distance_km, calories 등)
    goal: str | None                 # NUTRI 목표(감량/유지/증량) — diet_goal과 동의어
    diet_goal: str | None            # 폼/요청에서 오는 식단 목표

    agent_name: str                # 응답 에이전트 이름 (프론트 표시용)
    health_disclaimer_shown: bool  # HELIA 중복 면책 방지
