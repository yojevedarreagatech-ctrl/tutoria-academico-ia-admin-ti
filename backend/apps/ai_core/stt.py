from __future__ import annotations

import os

import assemblyai as aai


class STTConfigurationError(Exception):
    pass


def get_stt_provider() -> str:
    return os.getenv("STT_PROVIDER", "assemblyai").strip().lower()


def get_prerecorded_speech_models() -> list[str]:
    raw_value = os.getenv("ASSEMBLYAI_SPEECH_MODEL", "").strip()
    if not raw_value:
        return ["universal-3-pro", "universal-2"]

    normalized = [item.strip() for item in raw_value.split(",") if item.strip()]
    mapped: list[str] = []

    for model_name in normalized:
        if model_name.startswith("universal-streaming"):
            mapped.extend(["universal-3-pro", "universal-2"])
        else:
            mapped.append(model_name)

    # Remove duplicates preserving order
    unique_models: list[str] = []
    for model_name in mapped:
        if model_name not in unique_models:
            unique_models.append(model_name)

    return unique_models or ["universal-3-pro", "universal-2"]


def transcribe_audio_file(audio_path: str, manual_text: str | None = None) -> str:
    provider = get_stt_provider()

    if provider == "manual":
        text = (manual_text or "").strip()
        if not text:
            raise STTConfigurationError("Debes enviar transcription_text cuando STT_PROVIDER=manual.")
        return text

    if provider == "mock":
        return "Transcripcion de prueba generada en modo mock para demo local."

    if provider != "assemblyai":
        raise STTConfigurationError("STT_PROVIDER no soportado.")

    api_key = os.getenv("ASSEMBLYAI_API_KEY", "").strip()
    if not api_key:
        raise STTConfigurationError("Falta configurar ASSEMBLYAI_API_KEY.")

    aai.settings.api_key = api_key
    config = aai.TranscriptionConfig(
        speech_models=get_prerecorded_speech_models(),
        language_detection=True,
    )
    transcriber = aai.Transcriber(config=config)
    transcript = transcriber.transcribe(audio_path)

    if transcript.status == aai.TranscriptStatus.error:
        raise STTConfigurationError(f"No fue posible transcribir el audio: {transcript.error}")

    return (transcript.text or "").strip()
