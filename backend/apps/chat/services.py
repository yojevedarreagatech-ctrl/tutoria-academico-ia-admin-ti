from __future__ import annotations

from apps.materials.models import DocumentChunk


def has_indexed_content(material_id: int | None = None) -> bool:
    queryset = DocumentChunk.objects.filter(embedding__isnull=False)
    if material_id is not None:
        queryset = queryset.filter(material_id=material_id)
    return queryset.exists()


def build_conversation_title(question: str) -> str:
    normalized = " ".join(question.split()).strip()
    if len(normalized) <= 80:
        return normalized
    return f"{normalized[:77]}..."
