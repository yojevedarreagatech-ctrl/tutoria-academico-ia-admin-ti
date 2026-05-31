from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader

from .models import DocumentChunk, Material


SUPPORTED_FILE_TYPES = {
    ".txt": "txt",
    ".pdf": "pdf",
}


def detect_file_type(file_name: str) -> str:
    suffix = Path(file_name).suffix.lower()
    file_type = SUPPORTED_FILE_TYPES.get(suffix)
    if not file_type:
        raise ValueError("Unsupported file type. Only PDF and TXT are supported.")
    return file_type


def extract_text_from_txt(file_path: str) -> str:
    return Path(file_path).read_text(encoding="utf-8-sig", errors="ignore")


def extract_text_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(page.strip() for page in pages if page.strip())


def split_text_into_chunks(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    normalized = " ".join(text.split())
    if not normalized:
        return []

    chunks: list[str] = []
    start = 0
    step = max(chunk_size - overlap, 1)

    while start < len(normalized):
        end = min(start + chunk_size, len(normalized))
        chunk = normalized[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(normalized):
            break
        start += step

    return chunks


def process_material(material: Material) -> Material:
    try:
        material.status = Material.Status.PROCESSING
        material.save(update_fields=["status", "updated_at"])

        file_type = detect_file_type(material.file.name)
        file_path = material.file.path

        if file_type == "txt":
            extracted_text = extract_text_from_txt(file_path)
        elif file_type == "pdf":
            extracted_text = extract_text_from_pdf(file_path)
        else:
            raise ValueError("Unsupported file type.")

        material.file_type = file_type
        material.original_text = extracted_text
        material.chunks.all().delete()

        chunks = split_text_into_chunks(extracted_text)
        DocumentChunk.objects.bulk_create(
            [
                DocumentChunk(
                    material=material,
                    content=chunk,
                    chunk_index=index,
                    metadata={
                        "source_file": Path(material.file.name).name,
                        "file_type": file_type,
                        "chunk_size": len(chunk),
                    },
                )
                for index, chunk in enumerate(chunks)
            ]
        )

        try:
            from apps.ai_core.embeddings import generate_embeddings_for_material

            generate_embeddings_for_material(material.id)
        except Exception:
            pass

        material.status = Material.Status.PROCESSED
        material.save(update_fields=["file_type", "original_text", "status", "updated_at"])
    except Exception:
        material.status = Material.Status.ERROR
        material.save(update_fields=["status", "updated_at"])
        raise

    return material
