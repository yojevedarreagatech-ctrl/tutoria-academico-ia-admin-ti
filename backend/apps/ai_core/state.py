from __future__ import annotations

from typing import Any, TypedDict


class TutorWorkflowState(TypedDict, total=False):
    question: str
    retrieval_query: str
    user_intent: str
    awaiting_practice_answer: bool
    last_practice_question: str | None
    turn_id: str | None
    conversation_id: int | None
    top_k: int
    material_id: int | None
    response_mode: str
    conversation_history: list[dict[str, str]]
    retrieved_chunks: list[dict[str, Any]]
    sources: list[dict[str, Any]]
    answer: str | None
    error: str | None
