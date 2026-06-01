from __future__ import annotations

from typing import Any, TypedDict


class TutorWorkflowState(TypedDict, total=False):
    question: str
    conversation_id: int | None
    top_k: int
    material_id: int | None
    conversation_history: list[dict[str, str]]
    retrieved_chunks: list[dict[str, Any]]
    sources: list[dict[str, Any]]
    answer: str | None
    error: str | None
