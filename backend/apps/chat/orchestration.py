from __future__ import annotations

from typing import Any

from apps.ai_core.conversation_manager import ConversationManagerError, run_tutor_turn


class ChatFlowError(Exception):
    pass


def run_tutor_conversation_turn(
    question: str,
    conversation_id: int | None = None,
    top_k: int = 5,
    material_id: int | None = None,
    mode: str = "text",
    turn_id: str | None = None,
    session_state: dict[str, str | None] | None = None,
) -> dict[str, Any]:
    try:
        result = run_tutor_turn(
            user_message=question,
            conversation_id=conversation_id,
            mode=mode,
            material_id=material_id,
            top_k=top_k,
            session_state=session_state,
            turn_id=turn_id,
        )
    except ConversationManagerError as exc:
        raise ChatFlowError(str(exc)) from exc

    return {
        "conversation_id": result["conversation_id"],
        "answer": result["answer"],
        "sources": result["sources"],
        "turn_id": result["turn_id"],
        "detected_intent": result["intent"],
        "updated_session_state": result["session_state"],
        "action": result["action"],
        "decision": result["decision"],
    }


def run_tutor_chat_flow(
    question: str,
    conversation_id: int | None = None,
    top_k: int = 5,
    material_id: int | None = None,
    response_mode: str = "text",
) -> dict[str, Any]:
    return run_tutor_conversation_turn(
        question=question,
        conversation_id=conversation_id,
        top_k=top_k,
        material_id=material_id,
        mode=response_mode,
    )
