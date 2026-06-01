from __future__ import annotations

from typing import Any

from langchain_core.tools import tool

from .embeddings import EmbeddingConfigurationError
from .retrieval import semantic_search


@tool("search_materials_tool")
def search_materials_tool(
    question: str,
    retrieval_query: str | None = None,
    top_k: int = 5,
    material_id: int | None = None,
) -> list[dict[str, Any]]:
    """Busca chunks relevantes en materiales procesados usando retrieval semantico."""
    try:
        return semantic_search(query=(retrieval_query or question), top_k=top_k, material_id=material_id)
    except EmbeddingConfigurationError as exc:
        raise ValueError(str(exc)) from exc
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("No fue posible recuperar contexto desde los materiales.") from exc
