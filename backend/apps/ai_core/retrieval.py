from __future__ import annotations

from typing import Any

from pgvector.django import CosineDistance

from apps.materials.models import DocumentChunk

from .embeddings import generate_embedding


def semantic_search(query: str, top_k: int = 5, material_id: int | None = None) -> list[dict[str, Any]]:
    normalized_query = query.strip()
    if not normalized_query:
        raise ValueError("Query is required.")

    query_embedding = generate_embedding(normalized_query)

    queryset = DocumentChunk.objects.select_related("material").filter(embedding__isnull=False)
    if material_id is not None:
        queryset = queryset.filter(material_id=material_id)

    matches = queryset.annotate(score=CosineDistance("embedding", query_embedding)).order_by("score")[:top_k]

    return [
        {
            "chunk_id": chunk.id,
            "material_id": chunk.material_id,
            "material_title": chunk.material.title,
            "content": chunk.content,
            "chunk_index": chunk.chunk_index,
            "score": float(chunk.score),
        }
        for chunk in matches
    ]
