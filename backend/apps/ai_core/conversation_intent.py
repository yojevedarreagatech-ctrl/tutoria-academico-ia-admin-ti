from __future__ import annotations

import re
import unicodedata


PRACTICE_REQUEST_PATTERNS = [
    r"\bhazme una pregunta(?: para practicar)?\b",
    r"\bpreguntame\b",
    r"\bquiero practicar\b",
    r"\botra pregunta\b",
    r"\bhazme otra\b",
    r"\bsiguiente\b",
]

SIMPLIFY_PATTERNS = [
    r"\bexplicalo mas facil\b",
    r"\bexplicamelo\b",
    r"\bno entendi\b",
    r"\bmas corto\b",
    r"\bm[aá]s corto\b",
    r"\bdefinicion mas corta\b",
    r"\bdefinici[oó]n m[aá]s corta\b",
]

EXAMPLE_PATTERNS = [
    r"\bdame (?:un|otro) ejemplo\b",
]

SUMMARIZE_PATTERNS = [
    r"\bresumelo\b",
    r"\brepiteme lo importante\b",
]


def _normalize(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    without_marks = "".join(char for char in normalized if not unicodedata.combining(char))
    return without_marks.lower().strip()


def _matches_any(text: str, patterns: list[str]) -> bool:
    return any(re.search(pattern, text) for pattern in patterns)


def looks_like_practice_question(message: str) -> bool:
    normalized = _normalize(message)
    if "pregunta para practicar" in normalized:
        return True
    if "quieres otra pregunta" in normalized:
        return True
    return "?" in message or "¿" in message


def get_last_practice_question(conversation_history: list[dict[str, str]]) -> str | None:
    for item in reversed(conversation_history):
        if item["role"] == "assistant" and looks_like_practice_question(item["content"]):
            return item["content"]
    return None


def infer_practice_state(conversation_history: list[dict[str, str]]) -> dict[str, str | None]:
    last_practice_question = get_last_practice_question(conversation_history)
    if not last_practice_question:
        return {"practice_state": "idle", "last_practice_question": None}

    last_assistant = next((item for item in reversed(conversation_history) if item["role"] == "assistant"), None)
    if last_assistant and last_assistant["content"] == last_practice_question:
        return {
            "practice_state": "awaiting_answer",
            "last_practice_question": last_practice_question,
        }

    return {"practice_state": "idle", "last_practice_question": last_practice_question}


def update_practice_state(
    user_intent: str,
    assistant_answer: str,
    current_state: dict[str, str | None] | None = None,
) -> dict[str, str | None]:
    state = {
        "practice_state": (current_state or {}).get("practice_state") or "idle",
        "last_practice_question": (current_state or {}).get("last_practice_question"),
    }

    if user_intent == "ask_practice_question":
        if looks_like_practice_question(assistant_answer):
            return {
                "practice_state": "awaiting_answer",
                "last_practice_question": assistant_answer,
            }
        return {"practice_state": "idle", "last_practice_question": state["last_practice_question"]}

    if user_intent == "answer_practice_question":
        return {"practice_state": "idle", "last_practice_question": state["last_practice_question"]}

    return state


def detect_user_intent(
    message: str,
    conversation_history: list[dict[str, str]],
    session_state: dict[str, str | None] | None = None,
) -> str:
    normalized = _normalize(message)

    if _matches_any(normalized, PRACTICE_REQUEST_PATTERNS):
        return "ask_practice_question"
    if _matches_any(normalized, SIMPLIFY_PATTERNS):
        return "simplify"
    if _matches_any(normalized, EXAMPLE_PATTERNS):
        return "example"
    if _matches_any(normalized, SUMMARIZE_PATTERNS):
        return "summarize"

    practice_state = (session_state or {}).get("practice_state") or "idle"
    if practice_state == "awaiting_answer":
        return "answer_practice_question"

    last_assistant = next((item["content"] for item in reversed(conversation_history) if item["role"] == "assistant"), "")
    if last_assistant and looks_like_practice_question(last_assistant):
        return "answer_practice_question"

    if len(normalized) <= 28:
        return "explain"
    return "normal_question"
