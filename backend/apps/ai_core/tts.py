from __future__ import annotations

import base64
import os

import httpx


CARTESIA_VERSION = "2024-11-13"
CARTESIA_TTS_URL = "https://api.cartesia.ai/tts/bytes"
CARTESIA_MODEL_ID = "sonic-2"


class TTSConfigurationError(Exception):
    pass


class TTSGenerationError(Exception):
    pass


def synthesize_speech(text: str) -> str:
    api_key = os.getenv("CARTESIA_API_KEY", "").strip()
    if not api_key:
        raise TTSConfigurationError("Falta configurar CARTESIA_API_KEY para generar respuesta por voz.")

    payload = {
        "model_id": CARTESIA_MODEL_ID,
        "transcript": text,
        "voice": {
            "mode": "id",
            "id": os.getenv("CARTESIA_VOICE_ID", ""),
        },
        "output_format": {
            "container": "wav",
            "encoding": "pcm_f32le",
            "sample_rate": int(os.getenv("VOICE_AGENT_SAMPLE_RATE", "16000")),
        },
        "language": os.getenv("CARTESIA_LANGUAGE", "es"),
    }

    headers = {
        "X-API-Key": api_key,
        "Cartesia-Version": CARTESIA_VERSION,
        "Content-Type": "application/json",
    }

    timeout = float(os.getenv("CARTESIA_WS_OPEN_TIMEOUT", "90"))
    with httpx.Client(timeout=timeout) as client:
        try:
            response = client.post(CARTESIA_TTS_URL, headers=headers, json=payload)
            response.raise_for_status()
            audio_bytes = response.content
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            if status_code == 402:
                raise TTSGenerationError(
                    "Cartesia no pudo generar audio porque la cuenta no tiene credito disponible."
                ) from exc
            raise TTSGenerationError(
                f"Cartesia devolvio un error HTTP {status_code} al generar audio."
            ) from exc
        except httpx.HTTPError as exc:
            raise TTSGenerationError("No fue posible conectar con el servicio de TTS.") from exc

    return base64.b64encode(audio_bytes).decode("utf-8")
