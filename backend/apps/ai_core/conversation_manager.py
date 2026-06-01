from __future__ import annotations

import logging
import os
import re
from typing import Any

from apps.chat.models import Conversation, Message
from apps.chat.services import build_conversation_title, has_indexed_content

from .graph import run_tutor_workflow
from .intent import detect_intent, infer_session_state_from_history, update_session_state
from .llm import generate_tutor_answer
from .retrieval import semantic_search


logger = logging.getLogger(__name__)


OUT_OF_SCOPE_MESSAGE = "No puedo responder eso con la informacion cargada."


class ConversationManagerError(Exception):
    pass


def _get_or_create_conversation(conversation_id: int | None, user_message: str) -> Conversation:
    if conversation_id:
        try:
            return Conversation.objects.get(pk=conversation_id)
        except Conversation.DoesNotExist as exc:
            raise ConversationManagerError("Conversation not found.") from exc
    return Conversation.objects.create(title=build_conversation_title(user_message))


def _build_history(conversation: Conversation) -> list[dict[str, str]]:
    history_qs = conversation.messages.exclude(role=Message.Role.SYSTEM).order_by("-created_at")[:8]
    return [{"role": message.role, "content": message.content} for message in reversed(list(history_qs))]


def _word_count(text: str) -> int:
    return len([token for token in text.split() if token.strip()])


def _limit_answer_length(text: str, *, max_sentences: int, max_words: int) -> str:
    cleaned = re.sub(r"\s{2,}", " ", text).strip()
    if not cleaned:
        return cleaned

    sentence_parts = re.split(r"(?<=[.!?])\s+", cleaned)
    if len(sentence_parts) > max_sentences:
        cleaned = " ".join(sentence_parts[:max_sentences]).strip()

    words = cleaned.split()
    if len(words) > max_words:
        cleaned = " ".join(words[:max_words]).rstrip(",;:")
        if cleaned and cleaned[-1] not in ".!?":
            cleaned = f"{cleaned}."
    return cleaned


def get_last_assistant_answer(conversation_id: int | None, session_state: dict | None) -> str | None:
    state = session_state or {}
    last_answer = state.get("last_answer")
    if isinstance(last_answer, str) and last_answer.strip():
        return last_answer.strip()

    if not conversation_id:
        return None

    message = (
        Message.objects.filter(conversation_id=conversation_id, role=Message.Role.ASSISTANT)
        .order_by("-created_at")
        .first()
    )
    if not message or not message.content.strip():
        return None
    return message.content.strip()


def retrieval_is_relevant(results: list[dict[str, Any]], *, mode: str = "text") -> bool:
    if not results:
        return False
    max_distance = float(os.getenv("RETRIEVAL_MAX_DISTANCE", "0.35"))
    min_score = float(os.getenv("RETRIEVAL_MIN_SCORE", "0.70"))
    best_distance = float(results[0].get("score", 1.0))
    similarity_score = 1.0 - best_distance
    return best_distance <= max_distance or similarity_score >= min_score


def _build_retrieval_query(user_message: str, intent: str, history: list[dict[str, str]], session_state: dict) -> str:
    if intent == "answer_practice_question":
        parts = [
            session_state.get("last_practice_question"),
            session_state.get("last_answer"),
            user_message,
        ]
        return "\n".join(part.strip() for part in parts if isinstance(part, str) and part.strip())

    if intent == "ask_next_practice_question":
        return session_state.get("last_retrieval_query") or session_state.get("last_topic") or user_message

    if intent == "ask_example":
        return session_state.get("last_retrieval_query") or session_state.get("last_topic") or user_message

    last_user = next((item["content"] for item in reversed(history) if item["role"] == "user"), "")
    last_answer = next((item["content"] for item in reversed(history) if item["role"] == "assistant"), "")
    if intent in {"ask_simplify", "ask_summary", "ask_repeat", "ask_shorter"}:
        return session_state.get("last_retrieval_query") or session_state.get("last_topic") or last_user or user_message

    if len(user_message.strip()) <= 28:
        parts = [last_user, last_answer, user_message]
        return "\n".join(part.strip() for part in parts if part and part.strip())

    return user_message


def _build_sources(context_chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "chunk_id": chunk["chunk_id"],
            "material_id": chunk["material_id"],
            "material_title": chunk["material_title"],
            "chunk_index": chunk["chunk_index"],
            "content_preview": chunk["content"][:220],
        }
        for chunk in context_chunks
    ]


def _build_decision(intent: str, session_state: dict) -> dict[str, Any]:
    if intent == "ask_shorter":
        return {
            "intent": intent,
            "action": "shorten_previous_answer",
            "needs_retrieval": False,
            "needs_llm": True,
            "reason": "Use the previous answer without spending retrieval again.",
        }
    if intent == "ask_simplify":
        return {
            "intent": intent,
            "action": "simplify_previous_answer",
            "needs_retrieval": False,
            "needs_llm": True,
            "reason": "Simplify the previous answer directly.",
        }
    if intent in {"ask_repeat", "ask_summary"}:
        return {
            "intent": intent,
            "action": "repeat_previous_answer",
            "needs_retrieval": False,
            "needs_llm": True,
            "reason": "Reuse the previous answer without spending retrieval again.",
        }
    if intent == "ask_example":
        return {
            "intent": intent,
            "action": "give_example",
            "needs_retrieval": not bool(session_state.get("last_context_chunks")),
            "needs_llm": True,
            "reason": "Give an example based on the latest topic and context.",
        }
    if intent in {"ask_practice_question", "ask_next_practice_question"}:
        return {
            "intent": intent,
            "action": "ask_practice_question",
            "needs_retrieval": not bool(session_state.get("last_context_chunks")),
            "needs_llm": True,
            "reason": "Generate a single practice question.",
        }
    if intent == "answer_practice_question":
        return {
            "intent": intent,
            "action": "evaluate_practice_answer",
            "needs_retrieval": not bool(session_state.get("last_context_chunks")),
            "needs_llm": True,
            "reason": "Evaluate the user answer to the pending practice question.",
        }
    if intent == "unclear":
        return {
            "intent": intent,
            "action": "clarify",
            "needs_retrieval": False,
            "needs_llm": False,
            "reason": "The turn is too ambiguous and should be clarified briefly.",
        }
    return {
        "intent": intent,
        "action": "answer_from_material",
        "needs_retrieval": True,
        "needs_llm": True,
        "reason": "Normal question over loaded materials.",
    }


def _max_tokens_for_turn(mode: str, intent: str) -> int | None:
    if mode != "voice":
        if intent == "ask_shorter":
            return 120
        return 260
    if intent == "ask_shorter":
        return 60
    return 140


def _generate_answer_for_action(
    *,
    action: str,
    user_message: str,
    mode: str,
    context_chunks: list[dict[str, Any]],
    history: list[dict[str, str]],
    session_state: dict,
    intent: str,
) -> str:
    task_instruction = None
    prompt_message = user_message

    if action == "shorten_previous_answer":
        prompt_message = user_message
        task_instruction = (
            "Resume la respuesta previa del tutor en una version realmente corta. "
            "Si el usuario pidio algo mas corto, en modo texto usa maximo 2 oraciones o 70 palabras. "
            "En modo voz usa maximo 1 oracion o 40 palabras."
        )
        context_chunks = session_state.get("last_context_chunks") or context_chunks
        history = history + [{"role": "assistant", "content": session_state.get("last_answer", "")}]
    elif action == "simplify_previous_answer":
        task_instruction = "Explica la respuesta previa de forma mas simple, breve y clara, sin agregar informacion nueva."
        context_chunks = session_state.get("last_context_chunks") or context_chunks
        history = history + [{"role": "assistant", "content": session_state.get("last_answer", "")}]
    elif action == "repeat_previous_answer":
        task_instruction = (
            "Repite la idea principal de la respuesta previa con palabras claras y directas, "
            "sin agregar informacion nueva."
        )
        context_chunks = session_state.get("last_context_chunks") or context_chunks
        history = history + [{"role": "assistant", "content": session_state.get("last_answer", "")}]
    elif action == "give_example":
        task_instruction = "Da un ejemplo breve y claro, basado solo en el material y en el ultimo tema tratado."
    elif action == "ask_practice_question":
        task_instruction = "Genera una sola pregunta de practica, clara y corta, basada en el material. No des la respuesta."
    elif action == "evaluate_practice_answer":
        prompt_message = (
            f"Pregunta de practica:\n{session_state.get('last_practice_question', '')}\n\n"
            f"Respuesta del estudiante:\n{user_message}"
        )
        task_instruction = (
            "Evalua la respuesta del estudiante. Indica si va bien, es parcial o necesita mejora. "
            "Explica brevemente por que usando el material. No hagas otra pregunta automaticamente. "
            "Cierra con: 'Quieres otra pregunta o repasamos esta parte?'."
        )

    return generate_tutor_answer(
        question=prompt_message,
        context_chunks=context_chunks,
        conversation_history=history,
        response_mode=mode,
        user_intent=intent,
        awaiting_practice_answer=session_state.get("practice_state") == "awaiting_answer",
        last_practice_question=session_state.get("last_practice_question"),
        task_instruction=task_instruction,
        max_tokens=_max_tokens_for_turn(mode, intent),
        previous_answer=session_state.get("last_answer"),
    )


def _generate_answer_from_workflow(
    *,
    user_message: str,
    mode: str,
    context_chunks: list[dict[str, Any]],
    history: list[dict[str, str]],
    session_state: dict,
    intent: str,
    top_k: int,
    material_id: int | None,
    retrieval_query: str,
    conversation_id: int,
) -> tuple[str, list[dict[str, Any]]]:
    workflow_result = run_tutor_workflow(
        {
            "question": user_message,
            "retrieval_query": retrieval_query,
            "user_intent": intent,
            "awaiting_practice_answer": session_state.get("practice_state") == "awaiting_answer",
            "last_practice_question": session_state.get("last_practice_question"),
            "turn_id": None,
            "conversation_id": conversation_id,
            "top_k": top_k,
            "material_id": material_id,
            "conversation_history": history,
            "retrieved_chunks": context_chunks,
            "sources": _build_sources(context_chunks),
            "answer": None,
            "error": None,
            "response_mode": mode,
        }
    )
    answer = workflow_result.get("answer")
    if workflow_result.get("error") or not answer:
        raise ConversationManagerError(str(workflow_result.get("error") or "No fue posible generar la respuesta del tutor."))
    return str(answer), workflow_result.get("sources", _build_sources(context_chunks))


def run_tutor_turn(
    user_message: str,
    conversation_id: int | None,
    mode: str = "text",
    material_id: int | None = None,
    top_k: int = 5,
    session_state: dict | None = None,
    turn_id: str | None = None,
) -> dict:
    conversation = _get_or_create_conversation(conversation_id, user_message)
    history_before = _build_history(conversation)
    merged_state = infer_session_state_from_history(history_before)
    merged_state.update(session_state or {})
    merged_state["last_answer"] = get_last_assistant_answer(conversation.id, merged_state)

    intent = detect_intent(user_message, history_before, merged_state)
    decision = _build_decision(intent, merged_state)
    retrieval_query = None
    context_chunks: list[dict[str, Any]] = list(merged_state.get("last_context_chunks") or [])
    retrieval_passed = False
    best_retrieval_distance: float | None = None
    best_retrieval_score: float | None = None
    used_last_answer = False
    retrieval_skipped_reason: str | None = None

    if decision["action"] in {
        "shorten_previous_answer",
        "simplify_previous_answer",
        "repeat_previous_answer",
    }:
        if merged_state.get("last_answer"):
            used_last_answer = True
            retrieval_skipped_reason = "follow_up_on_previous_answer"
        else:
            retrieval_skipped_reason = "missing_previous_answer"

    if decision["needs_retrieval"]:
        if not has_indexed_content(material_id=material_id):
            raise ConversationManagerError("No hay contenido indexado con embeddings para responder.")

        retrieval_query = _build_retrieval_query(user_message, intent, history_before, merged_state)
        context_chunks = semantic_search(query=retrieval_query, top_k=top_k, material_id=material_id)
        if context_chunks:
            best_retrieval_distance = float(context_chunks[0].get("score", 1.0))
            best_retrieval_score = 1.0 - best_retrieval_distance
        retrieval_passed = retrieval_is_relevant(context_chunks, mode=mode)

        if not retrieval_passed:
            decision = {
                **decision,
                "intent": "out_of_scope_question",
                "action": "refuse_out_of_scope",
                "needs_retrieval": False,
                "needs_llm": False,
                "reason": "No relevant retrieval context passed the threshold.",
            }

    Message.objects.create(conversation=conversation, role=Message.Role.USER, content=user_message)

    answer = OUT_OF_SCOPE_MESSAGE
    sources = _build_sources(context_chunks)
    if decision["action"] in {
        "shorten_previous_answer",
        "simplify_previous_answer",
        "repeat_previous_answer",
    } and not merged_state.get("last_answer"):
        answer = "Todavia no tengo una respuesta anterior para resumir."
    elif decision["action"] == "clarify":
        answer = "No entendi del todo. Puedes decirlo de otra forma o preguntar algo del material cargado."
    elif decision["action"] == "refuse_out_of_scope":
        answer = OUT_OF_SCOPE_MESSAGE
    elif decision["action"] == "answer_from_material":
        answer, sources = _generate_answer_from_workflow(
            user_message=user_message,
            mode=mode,
            context_chunks=context_chunks,
            history=history_before,
            session_state=merged_state,
            intent=decision["intent"],
            top_k=top_k,
            material_id=material_id,
            retrieval_query=retrieval_query or user_message,
            conversation_id=conversation.id,
        )
    else:
        answer = _generate_answer_for_action(
            action=decision["action"],
            user_message=user_message,
            mode=mode,
            context_chunks=context_chunks,
            history=history_before,
            session_state=merged_state,
            intent=decision["intent"],
        )

    if decision["action"] == "shorten_previous_answer":
        if mode == "voice":
            answer = _limit_answer_length(answer, max_sentences=1, max_words=40)
        else:
            answer = _limit_answer_length(answer, max_sentences=2, max_words=70)

    Message.objects.create(conversation=conversation, role=Message.Role.ASSISTANT, content=answer)

    updated_state = update_session_state(
        merged_state,
        intent=decision["intent"],
        answer=answer,
        retrieval_query=retrieval_query,
        sources=sources,
        context_chunks=context_chunks,
        user_message=user_message,
    )

    logger.info(
        "Conversation manager | conversation_id=%s turn_id=%s mode=%s intent=%s action=%s needs_retrieval=%s used_last_answer=%s retrieval_skipped_reason=%s retrieval_passed=%s best_retrieval_distance=%s best_retrieval_score=%s practice_state_before=%s practice_state_after=%s answer_length_words=%s",
        conversation.id,
        turn_id,
        mode,
        decision["intent"],
        decision["action"],
        decision["needs_retrieval"],
        used_last_answer,
        retrieval_skipped_reason,
        retrieval_passed,
        best_retrieval_distance,
        best_retrieval_score,
        merged_state.get("practice_state", "idle"),
        updated_state.get("practice_state", "idle"),
        _word_count(answer),
    )

    return {
        "conversation_id": conversation.id,
        "turn_id": turn_id,
        "answer": answer,
        "sources": sources,
        "action": decision["action"],
        "intent": decision["intent"],
        "session_state": updated_state,
        "should_speak": mode == "voice",
        "decision": decision,
    }
