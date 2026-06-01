from __future__ import annotations

from typing import Any


class StructuredOutputValidationError(Exception):
    pass


def _normalize_correct_answer(correct_answer: str, options: list[str]) -> str:
    normalized = correct_answer.strip()
    if normalized in options:
        return normalized

    upper = normalized.upper()
    answer_map = {"A": 0, "B": 1, "C": 2, "D": 3}
    if upper in answer_map:
        return options[answer_map[upper]]

    prefixed_option = next(
        (
            option
            for option in options
            if option.lower().startswith(f"{normalized.lower()}.")
            or option.lower().startswith(f"{normalized.lower()})")
        ),
        None,
    )
    if prefixed_option:
        return prefixed_option

    raise StructuredOutputValidationError("La respuesta correcta debe coincidir con una opcion o con la letra A, B, C o D.")


def validate_quiz_question_payload(question_payload: dict[str, Any]) -> dict[str, Any]:
    question = str(question_payload.get("question", "")).strip()
    explanation = str(question_payload.get("explanation", "")).strip()
    options_raw = question_payload.get("options", [])
    correct_answer = str(question_payload.get("correct_answer", "")).strip()

    if not question:
        raise StructuredOutputValidationError("Cada pregunta del quiz debe incluir texto.")
    if not isinstance(options_raw, list) or len(options_raw) != 4:
        raise StructuredOutputValidationError("Cada pregunta del quiz debe tener exactamente 4 opciones.")

    options = [str(option).strip() for option in options_raw]
    if any(not option for option in options):
        raise StructuredOutputValidationError("Las opciones del quiz no pueden estar vacias.")
    correct_answer = _normalize_correct_answer(correct_answer, options)

    return {
        "question": question,
        "options": options,
        "correct_answer": correct_answer,
        "explanation": explanation,
    }


def validate_quiz_payload(payload: dict[str, Any], *, max_questions: int = 5) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise StructuredOutputValidationError("El structured output del quiz debe ser un objeto JSON.")

    title = str(payload.get("title", "")).strip() or "Quiz sobre el material"
    description = str(payload.get("description", "")).strip()
    questions_raw = payload.get("questions", [])

    if not isinstance(questions_raw, list) or not questions_raw:
        raise StructuredOutputValidationError("El quiz debe incluir al menos 1 pregunta.")
    if len(questions_raw) > max_questions:
        raise StructuredOutputValidationError(f"El quiz no puede exceder {max_questions} preguntas.")

    validated_questions = [validate_quiz_question_payload(question) for question in questions_raw]

    return {
        "title": title,
        "description": description,
        "questions": validated_questions,
    }
