from __future__ import annotations

import os

from django.db import transaction
from openai import OpenAI

from apps.materials.models import DocumentChunk, Material


DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"


class EmbeddingConfigurationError(Exception):
    pass


def get_embedding_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise EmbeddingConfigurationError(
            "No se pudieron generar embeddings porque falta configurar OPENAI_API_KEY."
        )
    return OpenAI(api_key=api_key)


def get_embedding_model() -> str:
    return os.getenv("EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL)


def generate_embedding(text: str) -> list[float]:
    normalized = " ".join(text.split()).strip()
    if not normalized:
        raise ValueError("Cannot generate an embedding for empty text.")

    client = get_embedding_client()
    response = client.embeddings.create(
        model=get_embedding_model(),
        input=normalized,
    )
    return response.data[0].embedding


def _generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    client = get_embedding_client()
    response = client.embeddings.create(
        model=get_embedding_model(),
        input=texts,
    )
    return [item.embedding for item in response.data]


def generate_embeddings_for_material(material_id: int) -> int:
    material = Material.objects.get(pk=material_id)
    chunks = list(material.chunks.order_by("chunk_index"))
    if not chunks:
        return 0

    texts = [" ".join(chunk.content.split()).strip() for chunk in chunks]
    embeddings = _generate_embeddings_batch(texts)

    for chunk, vector in zip(chunks, embeddings):
        chunk.embedding = vector
        chunk.embedding_id = f"{material_id}:{chunk.chunk_index}"

    with transaction.atomic():
        DocumentChunk.objects.bulk_update(chunks, ["embedding", "embedding_id"])

    return len(chunks)


def generate_missing_embeddings() -> int:
    chunk_ids = (
        DocumentChunk.objects.filter(embedding__isnull=True)
        .order_by("material_id", "chunk_index")
        .values_list("material_id", flat=True)
        .distinct()
    )

    generated = 0
    for material_id in chunk_ids:
        generated += generate_embeddings_for_material(material_id)
    return generated
