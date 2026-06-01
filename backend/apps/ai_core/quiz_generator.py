from __future__ import annotations

import json
import logging
from typing import Any

from apps.materials.models import DocumentChunk, Material

from .llm import LLMConfigurationError, LLMGenerationError, get_chat_model, get_llm_client
from .structured_outputs import StructuredOutputValidationError, validate_quiz_payload as validate_structured_quiz_payload


logger = logging.getLogger(__name__)


class QuizGenerationError(Exception):
    pass


MAX_QUIZ_QUESTIONS = 10
DEFAULT_QUIZ_QUESTIONS = 5
DEFAULT_MAX_CONTEXT_CHUNKS = 8


def build_quiz_context(material_id: int, max_chunks: int = DEFAULT_MAX_CONTEXT_CHUNKS) -> str:
    chunks = list(
        DocumentChunk.objects.filter(material_id=material_id)
        .select_related("material")
        .order_by("chunk_index")[:max_chunks]
    )
    if not chunks:
        raise QuizGenerationError("El material seleccionado no tiene chunks disponibles para generar un quiz.")

    sections = []
    for chunk in chunks:
        sections.append(
            f"Material: {chunk.material.title}\nChunk {chunk.chunk_index}:\n{chunk.content}"
        )
    return "\n\n---\n\n".join(sections)


def validate_quiz_payload(payload: dict[str, Any], *, num_questions: int = DEFAULT_QUIZ_QUESTIONS) -> dict[str, Any]:
    return validate_structured_quiz_payload(payload, max_questions=num_questions)


def _build_quiz_prompt(context: str, num_questions: int) -> str:
    return (
        "Eres un generador de quizzes academicos.\n"
        "Usa unicamente el contenido proporcionado.\n"
        "No inventes datos.\n"
        "Si el contenido no es suficiente, genera preguntas solo sobre lo que si aparece.\n"
        "Devuelve unicamente JSON valido con esta estructura exacta:\n"
        '{'
        '"title": "Quiz sobre el material", '
        '"description": "Descripcion breve opcional", '
        '"questions": ['
        '{'
        '"question": "Texto de la pregunta", '
        '"options": ["Opcion 1", "Opcion 2", "Opcion 3", "Opcion 4"], '
        '"correct_answer": "Opcion 1", '
        '"explanation": "Explicacion breve basada en el material"'
        '}'
        "]"
        '}\n'
        f"Debes generar exactamente {num_questions} preguntas.\n"
        "Cada pregunta debe tener exactamente 4 opciones de texto completas.\n"
        "correct_answer debe ser el texto completo de una de las opciones. Si usas letras A, B, C o D, deben corresponder claramente a esas opciones.\n"
        "No incluyas markdown.\n"
        "No incluyas texto fuera del JSON.\n\n"
        f"Contenido del material:\n{context}"
    )


def generate_quiz_structured(material_id: int, num_questions: int = DEFAULT_QUIZ_QUESTIONS) -> dict[str, Any]:
    if num_questions < 1 or num_questions > MAX_QUIZ_QUESTIONS:
        raise QuizGenerationError("num_questions debe estar entre 1 y 10.")

    context = build_quiz_context(material_id=material_id)

    try:
        client = get_llm_client()
    except LLMConfigurationError as exc:
        raise QuizGenerationError(str(exc)) from exc

    try:
        response = client.chat.completions.create(
            model=get_chat_model(),
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": "Genera quizzes solo en JSON valido y solo con el contenido dado.",
                },
                {
                    "role": "user",
                    "content": _build_quiz_prompt(context=context, num_questions=num_questions),
                },
            ],
        )
        raw_content = (response.choices[0].message.content or "").strip()
    except LLMGenerationError as exc:
        raise QuizGenerationError(str(exc)) from exc
    except Exception as exc:
        raise QuizGenerationError("No fue posible generar el quiz con el modelo.") from exc

    try:
        payload = json.loads(raw_content)
    except json.JSONDecodeError as exc:
        logger.warning("Quiz generator devolvio JSON invalido: %s", raw_content[:500])
        raise QuizGenerationError("El modelo devolvio JSON invalido para el quiz.") from exc

    try:
        return validate_quiz_payload(payload, num_questions=num_questions)
    except StructuredOutputValidationError as exc:
        logger.warning("Quiz payload invalido: %s | payload=%s", exc, raw_content[:1000])
        raise QuizGenerationError(str(exc)) from exc


def get_material_for_quiz(material_id: int) -> Material:
    try:
        return Material.objects.get(pk=material_id)
    except Material.DoesNotExist as exc:
        raise QuizGenerationError("El material seleccionado no existe.") from exc
