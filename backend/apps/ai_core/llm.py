from __future__ import annotations

import os
from typing import Any

from openai import OpenAI


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


def generate_tutor_answer(
    question: str,
    context_chunks: list[dict[str, Any]],
    conversation_history: list[dict[str, str]] | None = None,
) -> str:
    client = get_llm_client()

    system_prompt = (
        "Eres un tutor academico claro, paciente y util. "
        "Responde usando principalmente el contexto recuperado. "
        "Si el contexto no es suficiente, dilo claramente. "
        "No inventes datos fuera del material disponible. "
        "Explica con lenguaje sencillo cuando sea util. "
        "Menciona brevemente el material o chunk usado cuando corresponda."
    )

    user_prompt = (
        f"Pregunta del estudiante:\n{question}\n\n"
        f"Historial reciente:\n{_build_history_text(conversation_history)}\n\n"
        f"Contexto recuperado:\n{_build_context_text(context_chunks)}\n\n"
        "Responde en espanol. Si no hay suficiente informacion en el contexto, indicalo con honestidad."
    )

    try:
        response = client.chat.completions.create(
            model=get_chat_model(),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return (response.choices[0].message.content or "").strip()
    except Exception as exc:
        raise LLMGenerationError("No fue posible generar la respuesta del tutor.") from exc
