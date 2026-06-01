from __future__ import annotations

import os
import re
from typing import Any

from openai import OpenAI

from .prompts import SYSTEM_PROMPT_TUTOR


DEFAULT_CHAT_MODEL = "gpt-4o-mini"


class LLMConfigurationError(Exception):
    pass


class LLMGenerationError(Exception):
    pass


def get_llm_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise LLMConfigurationError("Falta configurar OPENAI_API_KEY.")
    return OpenAI(api_key=api_key)


def get_chat_model() -> str:
    return os.getenv("CHAT_MODEL", DEFAULT_CHAT_MODEL)


def _build_context_text(context_chunks: list[dict[str, Any]]) -> str:
    if not context_chunks:
        return "No hay contexto recuperado."

    parts = []
    for chunk in context_chunks:
        parts.append(
            (
                f"Material: {chunk['material_title']}\n"
                f"Chunk: {chunk['chunk_index']}\n"
                f"Contenido: {chunk['content']}"
            )
        )
    return "\n\n---\n\n".join(parts)


def _build_history_text(conversation_history: list[dict[str, str]] | None = None) -> str:
    if not conversation_history:
        return "Sin historial previo."

    return "\n".join(f"{item['role']}: {item['content']}" for item in conversation_history)


def _build_intent_text(
    user_intent: str | None = None,
    awaiting_practice_answer: bool = False,
    last_practice_question: str | None = None,
) -> str:
    lines = [f"Intent detectada: {user_intent or 'normal_question'}"]
    lines.append(f"Esperando respuesta de practica: {'si' if awaiting_practice_answer else 'no'}")
    if last_practice_question:
        lines.append(f"Ultima pregunta de practica del tutor: {last_practice_question}")
    return "\n".join(lines)


def _build_response_mode_instruction(response_mode: str) -> str:
    if response_mode != "voice":
        return (
            "Responde en espanol con tono de tutor conversacional. Puedes usar una explicacion un poco "
            "mas desarrollada si el contexto lo permite. No enumeres fuentes tecnicas ni menciones "
            "identificadores internos."
        )

    max_sentences = max(
        1,
        int(
            os.getenv(
                "VOICE_AGENT_MAX_SENTENCES",
                os.getenv("VOICE_AGENT_MAX_RESPONSE_SENTENCES", "3"),
            )
        ),
    )
    max_words = max(20, int(os.getenv("VOICE_AGENT_MAX_WORDS", "80")))
    return (
        "Responde en espanol para modo voz. La respuesta debe sonar natural al escucharla, "
        f"ser breve, no exceder aproximadamente {max_sentences} oraciones ni {max_words} palabras, "
        "y no mencionar chunks, fragmentos numerados ni metadatos tecnicos."
    )


def clean_answer_for_voice(answer: str) -> str:
    cleaned = answer
    patterns = [
        r"\bchunk\s*#?\s*\d+\b",
        r"\bfragmento\s*#?\s*\d+\b",
        r"\bchunk_id\b",
        r"\bchunk_index\b",
        r"\bmetadata\b",
        r"\bsegun el chunk\b",
        r"\bsegun el fragmento\b",
    ]
    for pattern in patterns:
        cleaned = re.sub(pattern, "segun el material cargado", cleaned, flags=re.IGNORECASE)

    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
    max_sentences = max(
        1,
        int(
            os.getenv(
                "VOICE_AGENT_MAX_SENTENCES",
                os.getenv("VOICE_AGENT_MAX_RESPONSE_SENTENCES", "3"),
            )
        ),
    )
    max_words = max(20, int(os.getenv("VOICE_AGENT_MAX_WORDS", "80")))

    sentence_parts = re.split(r"(?<=[.!?])\s+", cleaned)
    if len(sentence_parts) > max_sentences:
        cleaned = " ".join(sentence_parts[:max_sentences]).strip()

    words = cleaned.split()
    if len(words) > max_words:
        cleaned = " ".join(words[:max_words]).rstrip(",;:")
        if cleaned and cleaned[-1] not in ".!?":
            cleaned = f"{cleaned}."
    return cleaned


def generate_tutor_answer(
    question: str,
    context_chunks: list[dict[str, Any]],
    conversation_history: list[dict[str, str]] | None = None,
    response_mode: str = "text",
    user_intent: str | None = None,
    awaiting_practice_answer: bool = False,
    last_practice_question: str | None = None,
    task_instruction: str | None = None,
    max_tokens: int | None = None,
    previous_answer: str | None = None,
) -> str:
    client = get_llm_client()

    user_prompt = (
        f"Pregunta del estudiante:\n{question}\n\n"
        f"Estado conversacional:\n{_build_intent_text(user_intent, awaiting_practice_answer, last_practice_question)}\n\n"
        f"Historial reciente:\n{_build_history_text(conversation_history)}\n\n"
        f"Respuesta previa del tutor:\n{previous_answer or 'Sin respuesta previa.'}\n\n"
        f"Contexto recuperado:\n{_build_context_text(context_chunks)}\n\n"
        f"Instruccion de tarea:\n{task_instruction or 'Responde como tutor conversacional.'}\n\n"
        f"{_build_response_mode_instruction(response_mode)}\n"
        "Si no hay suficiente informacion en el contexto, indicalo con honestidad."
    )

    try:
        response = client.chat.completions.create(
            model=get_chat_model(),
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_TUTOR},
                {"role": "user", "content": user_prompt},
            ],
        )
        answer = (response.choices[0].message.content or "").strip()
        if response_mode == "voice":
            return clean_answer_for_voice(answer)
        return answer
    except Exception as exc:
        raise LLMGenerationError("No fue posible generar la respuesta del tutor.") from exc
