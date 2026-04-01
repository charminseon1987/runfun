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
    agent_name: str                # 응답 에이전트 이름 (프론트 표시용)
    health_disclaimer_shown: bool  # HELIA 중복 면책 방지
