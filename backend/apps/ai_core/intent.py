from __future__ import annotations

import re
import unicodedata


INTENT_PATTERNS = {
    "ask_practice_question": [
        r"\bhazme una pregunta(?: para practicar)?\b",
        r"\bpreguntame\b",
        r"\bquiero practicar\b",
    ],
    "ask_next_practice_question": [
        r"\botra pregunta\b",
        r"\bsiguiente(?: pregunta)?\b",
        r"\bhazme otra\b",
    ],
    "ask_shorter": [
        r"\bmas corto\b",
        r"\bmas breve\b",
        r"\bresponde corto\b",
        r"\bresponde mas corto\b",
        r"\bresponde mas breve\b",
        r"\bhazlo corto\b",
        r"\bdimelo en pocas palabras\b",
    ],
    "ask_simplify": [
        r"\bexplicalo mas facil\b",
        r"\bexplicamelo\b",
        r"\bno entendi\b",
    ],
    "ask_example": [
        r"\bdame (?:un|otro) ejemplo\b",
    ],
    "ask_repeat": [
        r"\brepite(?:lo|me)?\b",
        r"\brepiteme\b",
    ],
    "ask_summary": [
        r"\bresumelo\b",
        r"\bhazlo mas resumido\b",
        r"\brepiteme lo importante\b",
    ],
}


QUESTION_PATTERNS = [
    r"^(que es|que significa|cual es|cuales son|como funciona|como se|por que|para que)\b",
    r"^(explica|explicame|define|describe|dime|hablame)\b",
]


FOLLOW_UP_INTENTS = {"ask_shorter", "ask_simplify", "ask_repeat", "ask_summary", "ask_example"}


def normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    without_marks = "".join(char for char in normalized if not unicodedata.combining(char))
    return without_marks.lower().strip()


def looks_like_practice_question(message: str) -> bool:
    normalized = normalize_text(message)
    if "pregunta para practicar" in normalized:
        return True
    if "quieres otra pregunta" in normalized or "repasamos esta parte" in normalized:
        return True
    return "?" in message or "¿" in message


def infer_session_state_from_history(conversation_history: list[dict[str, str]]) -> dict:
    last_user = next((item["content"] for item in reversed(conversation_history) if item["role"] == "user"), None)
    last_answer = next((item["content"] for item in reversed(conversation_history) if item["role"] == "assistant"), None)
    last_practice_question = next(
        (
            item["content"]
            for item in reversed(conversation_history)
            if item["role"] == "assistant" and looks_like_practice_question(item["content"])
        ),
        None,
    )
    practice_state = "idle"
    if last_practice_question and last_answer == last_practice_question:
        practice_state = "awaiting_answer"

    return {
        "practice_state": practice_state,
        "last_practice_question": last_practice_question,
        "last_topic": last_user,
        "last_answer": last_answer,
        "last_sources": [],
        "last_retrieval_query": None,
        "last_context_chunks": [],
    }


def detect_intent(user_message: str, conversation_history: list, session_state: dict | None = None) -> str:
    normalized = normalize_text(user_message)
    state = session_state or {}

    for intent, patterns in INTENT_PATTERNS.items():
        if any(re.search(pattern, normalized) for pattern in patterns):
            return intent

    if state.get("practice_state") == "awaiting_answer":
        return "answer_practice_question"

    if "?" in user_message or "¿" in user_message:
        return "normal_question"

    if any(re.search(pattern, normalized) for pattern in QUESTION_PATTERNS):
        return "normal_question"

    if len(normalized.split()) <= 2:
        return "unclear"

    return "normal_question"


def update_session_state(
    previous_state: dict | None,
    *,
    intent: str,
    answer: str,
    retrieval_query: str | None = None,
    sources: list | None = None,
    context_chunks: list | None = None,
    user_message: str | None = None,
) -> dict:
    state = dict(previous_state or {})
    state.setdefault("practice_state", "idle")
    state.setdefault("last_practice_question", None)
    state["last_answer"] = answer

    if sources is not None:
        state["last_sources"] = sources or state.get("last_sources", [])
    else:
        state.setdefault("last_sources", [])

    if context_chunks is not None:
        state["last_context_chunks"] = context_chunks or state.get("last_context_chunks", [])
    else:
        state.setdefault("last_context_chunks", [])

    if retrieval_query:
        state["last_retrieval_query"] = retrieval_query
    else:
        state.setdefault("last_retrieval_query", None)

    if user_message and intent not in FOLLOW_UP_INTENTS:
        state["last_topic"] = user_message

    if intent in {"ask_practice_question", "ask_next_practice_question"} and looks_like_practice_question(answer):
        state["practice_state"] = "awaiting_answer"
        state["last_practice_question"] = answer
        return state

    if intent == "answer_practice_question":
        state["practice_state"] = "idle"
        return state

    return state
