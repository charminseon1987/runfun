from typing import Annotated, TypedDict

from langgraph.graph.message import add_messages


class RunMateState(TypedDict, total=False):
    messages: Annotated[list, add_messages]
    intent: str
    agent_result: dict
    user_location: dict
    user_id: str
