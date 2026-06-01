from __future__ import annotations

from typing import Any

from langgraph.graph import END, START, StateGraph

from .llm import LLMConfigurationError, LLMGenerationError, generate_tutor_answer
from .state import TutorWorkflowState
from .tools import search_materials_tool


WORKFLOW_NAME = "LangGraph"
WORKFLOW_NODES = [
    "receive_question",
    "retrieve_context",
    "decide_tool",
    "call_tool",
    "generate_answer",
    "save_conversation",
]
WORKFLOW_TOOLS = ["search_materials_tool"]


def receive_question(state: TutorWorkflowState) -> TutorWorkflowState:
    question = state.get("question", "").strip()
    if not question:
        return {"error": "La pregunta es obligatoria."}
    return {"question": question, "error": None}


def retrieve_context(state: TutorWorkflowState) -> TutorWorkflowState:
    return {
        "top_k": state.get("top_k", 5),
        "material_id": state.get("material_id"),
    }


def decide_tool(state: TutorWorkflowState) -> str:
    if state.get("error"):
        return "save_conversation"
    if state.get("question"):
        return "call_tool"
    return "save_conversation"


def call_tool(state: TutorWorkflowState) -> TutorWorkflowState:
    try:
        chunks = search_materials_tool.invoke(
            {
                "question": state["question"],
                "top_k": state.get("top_k", 5),
                "material_id": state.get("material_id"),
            }
        )
    except ValueError as exc:
        return {
            "error": str(exc),
            "retrieved_chunks": [],
            "sources": [],
        }

    if not chunks:
        return {
            "error": "No hay contenido indexado con embeddings para responder.",
            "retrieved_chunks": [],
            "sources": [],
        }

    return {
        "retrieved_chunks": chunks,
        "sources": [
            {
                "chunk_id": chunk["chunk_id"],
                "material_id": chunk["material_id"],
                "material_title": chunk["material_title"],
                "chunk_index": chunk["chunk_index"],
                "content_preview": chunk["content"][:220],
            }
            for chunk in chunks
        ],
        "error": None,
    }


def generate_answer(state: TutorWorkflowState) -> TutorWorkflowState:
    if state.get("error"):
        return state

    try:
        answer = generate_tutor_answer(
            question=state["question"],
            context_chunks=state.get("retrieved_chunks", []),
            conversation_history=state.get("conversation_history"),
        )
    except LLMConfigurationError as exc:
        return {"error": str(exc), "answer": None}
    except LLMGenerationError as exc:
        return {"error": str(exc), "answer": None}
    except Exception:
        return {"error": "No fue posible ejecutar el workflow del chat.", "answer": None}

    return {"answer": answer, "error": None}


def save_conversation(state: TutorWorkflowState) -> TutorWorkflowState:
    # El guardado real sigue orquestado en chat/views.py para mantener compatibilidad
    # con el flujo externo existente del endpoint /api/chat/ask/.
    return state


def _build_workflow():
    graph = StateGraph(TutorWorkflowState)
    graph.add_node("receive_question", receive_question)
    graph.add_node("retrieve_context", retrieve_context)
    graph.add_node("call_tool", call_tool)
    graph.add_node("generate_answer", generate_answer)
    graph.add_node("save_conversation", save_conversation)

    graph.add_edge(START, "receive_question")
    graph.add_edge("receive_question", "retrieve_context")
    graph.add_conditional_edges(
        "retrieve_context",
        decide_tool,
        {
            "call_tool": "call_tool",
            "save_conversation": "save_conversation",
        },
    )
    graph.add_edge("call_tool", "generate_answer")
    graph.add_edge("generate_answer", "save_conversation")
    graph.add_edge("save_conversation", END)

    return graph.compile()


TUTOR_WORKFLOW = _build_workflow()


def run_tutor_workflow(initial_state: TutorWorkflowState) -> TutorWorkflowState:
    try:
        result = TUTOR_WORKFLOW.invoke(initial_state)
    except Exception:
        return {
            **initial_state,
            "answer": None,
            "sources": [],
            "error": "No fue posible ejecutar el workflow del chat.",
        }

    return result


def get_workflow_info() -> dict[str, Any]:
    return {
        "workflow": WORKFLOW_NAME,
        "nodes": WORKFLOW_NODES,
        "tools": WORKFLOW_TOOLS,
    }
