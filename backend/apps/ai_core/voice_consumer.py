from __future__ import annotations

import base64
import json
import os
import logging
from tempfile import NamedTemporaryFile

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from apps.chat.orchestration import ChatFlowError, run_tutor_conversation_turn

from .stt import STTConfigurationError, transcribe_audio_file
from .tts import TTSConfigurationError, TTSGenerationError, synthesize_speech


logger = logging.getLogger(__name__)


def is_tts_enabled() -> bool:
    return os.getenv("VOICE_AGENT_TTS_ENABLED", "True").strip().lower() in {"1", "true", "yes", "on"}


class VoiceAgentConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.conversation_id: int | None = None
        self.material_id: int | None = None
        self.session_started = False
        self.is_processing_turn = False
        self.practice_state: dict[str, str | None] = {
            "practice_state": "idle",
            "last_practice_question": None,
        }
        self.current_turn_id: str | None = None

    async def connect(self):
        enabled = os.getenv("VOICE_AGENT_ENABLED", "True").strip().lower() in {"1", "true", "yes", "on"}
        if not enabled:
            await self.close()
            return
        await self.accept()

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            await self.send_json({"type": "error", "message": "Solo se soportan mensajes JSON en este sprint."})
            return

        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_json({"type": "error", "message": "El mensaje recibido no es JSON valido."})
            return

        event_type = payload.get("type")

        if event_type == "start_session":
            self.session_started = True
            self.material_id = payload.get("material_id")
            if payload.get("conversation_id"):
                self.conversation_id = payload.get("conversation_id")
            await self.send_json(
                {
                    "type": "session_started",
                    "conversation_id": self.conversation_id,
                    "practice_state": self.practice_state["practice_state"],
                }
            )
            await self.send_json({"type": "listening", "practice_state": self.practice_state["practice_state"]})
            return

        if event_type == "user_turn_started":
            turn_id = payload.get("turn_id")
            if self.is_processing_turn:
                await self.send_json(
                    {
                        "type": "error",
                        "turn_id": turn_id,
                        "message": "El agente todavia esta procesando el turno anterior.",
                    }
                )
                return
            self.current_turn_id = turn_id
            return

        if event_type in {"audio_chunk", "end_user_turn"}:
            turn_id = payload.get("turn_id")
            if not self.session_started:
                await self.send_json({"type": "error", "turn_id": turn_id, "message": "Primero debes iniciar una sesion de voz."})
                return

            if self.is_processing_turn:
                await self.send_json(
                    {
                        "type": "error",
                        "turn_id": turn_id,
                        "message": "El agente todavia esta procesando el turno anterior.",
                    }
                )
                return

            transcript_hint = payload.get("transcription_text")
            audio_base64 = payload.get("audio_base64")
            if not audio_base64:
                await self.send_json({"type": "error", "turn_id": turn_id, "message": "No se recibio audio para procesar."})
                return

            self.is_processing_turn = True
            self.current_turn_id = turn_id
            await self.send_json({"type": "agent_thinking", "turn_id": turn_id})

            try:
                final_transcript = await self._transcribe_audio(audio_base64, transcript_hint)
                if not final_transcript.strip():
                    await self.send_json({"type": "error", "turn_id": turn_id, "message": "No se pudo detectar una pregunta valida en el audio."})
                    await self.send_json({"type": "listening_again", "turn_id": turn_id, "practice_state": self.practice_state["practice_state"]})
                    return

                logger.info(
                    "Voice turn transcript | conversation_id=%s turn_id=%s transcript=%s practice_state_before=%s",
                    self.conversation_id,
                    turn_id,
                    final_transcript,
                    self.practice_state.get("practice_state", "idle"),
                )

                await self.send_json({"type": "final_transcript", "turn_id": turn_id, "text": final_transcript})

                result = await sync_to_async(run_tutor_conversation_turn)(
                    question=final_transcript,
                    conversation_id=payload.get("conversation_id") or self.conversation_id,
                    top_k=5,
                    material_id=payload.get("material_id") or self.material_id,
                    mode="voice",
                    turn_id=turn_id,
                    session_state=self.practice_state,
                )
                self.conversation_id = result["conversation_id"]
                self.practice_state = result.get("updated_session_state", self.practice_state)

                logger.info(
                    "Voice turn result | conversation_id=%s turn_id=%s intent=%s action=%s practice_state_after=%s",
                    self.conversation_id,
                    turn_id,
                    result.get("detected_intent"),
                    result.get("action"),
                    self.practice_state.get("practice_state", "idle"),
                )

                await self.send_json(
                    {
                        "type": "agent_response_text",
                        "turn_id": turn_id,
                        "conversation_id": result["conversation_id"],
                        "text": result["answer"],
                        "sources": result["sources"],
                        "practice_state": self.practice_state["practice_state"],
                        "intent": result.get("detected_intent"),
                        "action": result.get("action"),
                    }
                )

                if is_tts_enabled():
                    try:
                        audio_response = await sync_to_async(synthesize_speech)(result["answer"])
                        await self.send_json(
                            {
                                "type": "agent_response_audio",
                                "turn_id": turn_id,
                                "audio_base64": audio_response,
                                "mime_type": "audio/wav",
                                "practice_state": self.practice_state["practice_state"],
                            }
                        )
                        await self.send_json({"type": "agent_finished_speaking", "turn_id": turn_id, "practice_state": self.practice_state["practice_state"]})
                    except (TTSConfigurationError, TTSGenerationError) as exc:
                        await self.send_json(
                            {
                                "type": "error",
                                "turn_id": turn_id,
                                "message": str(exc),
                            }
                        )
                        await self.send_json(
                            {
                                "type": "agent_finished_speaking",
                                "turn_id": turn_id,
                                "practice_state": self.practice_state["practice_state"],
                            }
                        )
                else:
                    await self.send_json(
                        {
                            "type": "agent_finished_speaking",
                            "turn_id": turn_id,
                            "practice_state": self.practice_state["practice_state"],
                        }
                    )

                await self.send_json({"type": "listening_again", "turn_id": turn_id, "practice_state": self.practice_state["practice_state"]})
            except (STTConfigurationError, ChatFlowError) as exc:
                await self.send_json({"type": "error", "turn_id": turn_id, "message": str(exc)})
                await self.send_json({"type": "listening_again", "turn_id": turn_id, "practice_state": self.practice_state["practice_state"]})
            except Exception:
                await self.send_json({"type": "error", "turn_id": turn_id, "message": "No fue posible procesar la sesion de voz."})
                await self.send_json({"type": "listening_again", "turn_id": turn_id, "practice_state": self.practice_state["practice_state"]})
            finally:
                self.is_processing_turn = False
            return

        if event_type == "stop_session":
            self.session_started = False
            self.is_processing_turn = False
            self.current_turn_id = None
            self.practice_state = {"practice_state": "idle", "last_practice_question": None}
            await self.send_json({"type": "session_finished", "practice_state": "idle"})
            return

        await self.send_json({"type": "error", "turn_id": payload.get("turn_id"), "message": "Evento no soportado."})

    async def send_json(self, payload):
        await self.send(text_data=json.dumps(payload))

    async def _transcribe_audio(self, audio_base64: str, transcript_hint: str | None = None) -> str:
        audio_bytes = base64.b64decode(audio_base64)
        with NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            temp_audio.write(audio_bytes)
            temp_path = temp_audio.name

        try:
            return await sync_to_async(transcribe_audio_file)(temp_path, manual_text=transcript_hint)
        finally:
            try:
                os.remove(temp_path)
            except OSError:
                pass
