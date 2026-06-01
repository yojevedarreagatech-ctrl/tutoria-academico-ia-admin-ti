from __future__ import annotations

from .stt import transcribe_audio_file


def transcribe_stream_fallback(audio_path: str, manual_text: str | None = None) -> str:
    """Fallback funcional para demo local: procesa el audio completo al finalizar la grabacion."""
    return transcribe_audio_file(audio_path, manual_text=manual_text)
