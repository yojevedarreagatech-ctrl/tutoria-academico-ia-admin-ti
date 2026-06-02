"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getConfiguredWsUrl } from "@/lib/api";
import { getFriendlyError } from "@/lib/ui-errors";
import type { ChatSource } from "@/types/chat";
import type { VoiceAgentEvent, VoiceAgentPhase, VoiceConnectionStatus } from "@/types/voice";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { TechnicalDetails } from "@/components/ui/technical-details";

type VoiceTurn = {
  id: string;
  userText: string;
  assistantText?: string;
  sources: ChatSource[];
  state: "processing" | "answered" | "error";
};

const DEFAULT_SILENCE_MS = Number.parseInt(process.env.NEXT_PUBLIC_VOICE_AGENT_SILENCE_MS || "1500", 10);
const MIN_TURN_MS = 900;
const VOLUME_THRESHOLD = 0.045;

export function VoiceAgentPanel() {
  const [connectionStatus, setConnectionStatus] = useState<VoiceConnectionStatus>("disconnected");
  const [phase, setPhase] = useState<VoiceAgentPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [micPaused, setMicPaused] = useState(false);
  const [practiceState, setPracticeState] = useState<"idle" | "awaiting_answer">("idle");
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null);
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const shouldSubmitTurnRef = useRef(true);
  const speechDetectedRef = useRef(false);
  const turnStartedAtRef = useRef(0);
  const lastSpeechAtRef = useRef(0);
  const sessionActiveRef = useRef(false);
  const micPausedRef = useRef(false);
  const connectionStatusRef = useRef<VoiceConnectionStatus>("disconnected");
  const conversationIdRef = useRef<number | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);
  const currentTurnIdRef = useRef<string | null>(null);
  const turnCounterRef = useRef(0);

  const wsUrl = useMemo(() => `${getConfiguredWsUrl()}/voice-agent/`, []);

  useEffect(() => {
    return () => {
      cleanupSession(false);
    };
  }, []);

  useEffect(() => {
    if (!historyRef.current) {
      return;
    }

    historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [turns, partialTranscript, finalTranscript]);

  useEffect(() => {
    sessionActiveRef.current = sessionActive;
  }, [sessionActive]);

  useEffect(() => {
    micPausedRef.current = micPaused;
  }, [micPaused]);

  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    currentTurnIdRef.current = currentTurnId;
  }, [currentTurnId]);

  function logDebug(label: string, payload?: unknown) {
    console.debug(`[voice-agent] ${label}`, payload || "");
  }

  function isStaleTurn(turnId?: string) {
    if (!turnId) {
      return false;
    }
    const isStale = currentTurnIdRef.current !== null && turnId !== currentTurnIdRef.current;
    if (isStale) {
      logDebug("Ignoring stale turn event", {
        currentTurnId: currentTurnIdRef.current,
        incomingTurnId: turnId,
      });
    }
    return isStale;
  }

  function createTurnId() {
    turnCounterRef.current += 1;
    return `turn-${Date.now()}-${turnCounterRef.current}`;
  }

  function updateTurn(turnId: string, updater: (turn: VoiceTurn) => VoiceTurn) {
    setTurns((current) => current.map((turn) => (turn.id === turnId ? updater(turn) : turn)));
  }

  async function ensureMicrophoneReady() {
    if (streamRef.current) {
      return streamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const audioContext = new window.AudioContext();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyserRef.current = analyser;

    return stream;
  }

  function connectSocket() {
    if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setConnectionStatus("connecting");
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnectionStatus("connected");
      if (sessionActiveRef.current) {
        socket.send(
          JSON.stringify({
            type: "start_session",
            conversation_id: conversationIdRef.current,
          })
        );
      }
    };

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as VoiceAgentEvent;
      logDebug("Event received", payload);

      if (payload.type === "session_started") {
        if (typeof payload.conversation_id === "number") {
          setConversationId(payload.conversation_id);
        }
        if (payload.practice_state) {
          setPracticeState(payload.practice_state);
        }
        setLastIntent(null);
        setLastAction(null);
        setPhase("listening");
        return;
      }

      if (payload.type === "listening" || payload.type === "listening_again") {
        if (payload.practice_state) {
          setPracticeState(payload.practice_state);
        }
        if (isStaleTurn(payload.turn_id)) {
          return;
        }
        if (sessionActiveRef.current && !micPausedRef.current && !currentAudioRef.current) {
          void beginListeningTurn();
        }
        return;
      }

      if (payload.type === "partial_transcript") {
        if (isStaleTurn(payload.turn_id)) {
          return;
        }
        setPartialTranscript(payload.text);
        return;
      }

      if (payload.type === "final_transcript") {
        if (isStaleTurn(payload.turn_id)) {
          return;
        }
        const turnId = payload.turn_id || currentTurnIdRef.current || createTurnId();
        setCurrentTurnId(turnId);
        setPartialTranscript("");
        setFinalTranscript(payload.text);
        setTurns((current) => [
          ...current,
          {
            id: turnId,
            userText: payload.text,
            assistantText: "",
            sources: [],
            state: "processing",
          },
        ]);
        setPhase("processing");
        return;
      }

      if (payload.type === "agent_thinking") {
        if (isStaleTurn(payload.turn_id)) {
          return;
        }
        setPhase("processing");
        return;
      }

      if (payload.type === "agent_response_text") {
        if (isStaleTurn(payload.turn_id)) {
          return;
        }
        if (payload.practice_state) {
          setPracticeState(payload.practice_state);
        }
        setLastIntent(payload.intent || null);
        setLastAction(payload.action || null);
        setConversationId(payload.conversation_id);
        const turnId = payload.turn_id || currentTurnIdRef.current;
        if (turnId) {
          updateTurn(turnId, (turn) => ({
            ...turn,
            assistantText: payload.text,
            sources: payload.sources,
            state: "answered",
          }));
        }
        setPhase("speaking");
        return;
      }

      if (payload.type === "agent_response_audio") {
        if (isStaleTurn(payload.turn_id)) {
          return;
        }
        if (payload.practice_state) {
          setPracticeState(payload.practice_state);
        }
        const mimeType = payload.mime_type || "audio/wav";
        const binary = Uint8Array.from(atob(payload.audio_base64), (char) => char.charCodeAt(0));
        const blob = new Blob([binary], { type: mimeType });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          setCurrentTurnId(null);
          if (sessionActiveRef.current && !micPausedRef.current) {
            setPhase("listening");
            void beginListeningTurn();
          } else {
            setPhase("stopped");
          }
        };
        void audio.play().catch(() => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          setCurrentTurnId(null);
          setError("La respuesta se genero, pero el navegador no pudo reproducir el audio automaticamente.");
          if (sessionActiveRef.current && !micPausedRef.current) {
            setPhase("listening");
            void beginListeningTurn();
          }
        });
        setPhase("speaking");
        return;
      }

      if (payload.type === "agent_finished_speaking") {
        return;
      }

      if (payload.type === "session_finished") {
        setPracticeState("idle");
        setLastIntent(null);
        setLastAction(null);
        setPhase("stopped");
        setCurrentTurnId(null);
        return;
      }

      if (payload.type === "error") {
        if (isStaleTurn(payload.turn_id)) {
          return;
        }
        const turnId = payload.turn_id || currentTurnIdRef.current;
        if (turnId) {
          updateTurn(turnId, (turn) => ({
            ...turn,
            state: "error",
            assistantText: turn.assistantText || payload.message,
          }));
        }
        setError(payload.message);
        setPhase(micPausedRef.current ? "stopped" : "idle");
      }
    };

    socket.onerror = () => {
      setError("No se pudo conectar con el backend. Verifica que el servicio este activo.");
      setConnectionStatus("disconnected");
      setPhase("stopped");
    };

    socket.onclose = () => {
      setConnectionStatus("disconnected");
      if (sessionActiveRef.current) {
        setError((current) => current || "La sesion de voz se cerro inesperadamente.");
      }
      setPhase("stopped");
      stopCurrentTurn(false);
    };
  }

  function stopAudioPlayback() {
    const currentAudio = currentAudioRef.current;
    if (!currentAudio) {
      return;
    }

    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudioRef.current = null;
  }

  function stopMonitoring() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  function stopCurrentTurn(shouldSubmit: boolean) {
    shouldSubmitTurnRef.current = shouldSubmit;
    stopMonitoring();

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }

  function monitorSilence() {
    const analyser = analyserRef.current;
    if (!analyser || !mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") {
      return;
    }

    const dataArray = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (const value of dataArray) {
      const normalized = (value - 128) / 128;
      sum += normalized * normalized;
    }

    const rms = Math.sqrt(sum / dataArray.length);
    const now = Date.now();

    if (rms > VOLUME_THRESHOLD) {
      speechDetectedRef.current = true;
      lastSpeechAtRef.current = now;
      setPartialTranscript("Escuchando tu turno...");
    }

    if (
      speechDetectedRef.current &&
      now - lastSpeechAtRef.current >= DEFAULT_SILENCE_MS &&
      now - turnStartedAtRef.current >= MIN_TURN_MS
    ) {
      setPartialTranscript("Turno detectado. Procesando pregunta...");
      stopCurrentTurn(true);
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(monitorSilence);
  }

  async function beginListeningTurn() {
    if (
      !sessionActiveRef.current ||
      micPausedRef.current ||
      connectionStatusRef.current !== "connected" ||
      currentAudioRef.current ||
      mediaRecorderRef.current?.state === "recording" ||
      phase === "processing" ||
      phase === "speaking"
    ) {
      return;
    }

    const stream = await ensureMicrophoneReady();
    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }

    const turnId = createTurnId();
    setCurrentTurnId(turnId);
    currentTurnIdRef.current = turnId;
    logDebug("Starting turn", { currentTurnId: turnId, conversationId: conversationIdRef.current, practiceState });

    socketRef.current?.send(JSON.stringify({ type: "user_turn_started", turn_id: turnId }));

    audioChunksRef.current = [];
    shouldSubmitTurnRef.current = true;
    speechDetectedRef.current = false;
    turnStartedAtRef.current = Date.now();
    lastSpeechAtRef.current = Date.now();

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      mediaRecorderRef.current = null;

      if (!shouldSubmitTurnRef.current || audioChunksRef.current.length === 0) {
        setPartialTranscript("");
        if (sessionActiveRef.current && !micPausedRef.current && !currentAudioRef.current) {
          setPhase("listening");
        }
        return;
      }

      const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
      audioChunksRef.current = [];

      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      bytes.forEach((value) => {
        binary += String.fromCharCode(value);
      });

      socketRef.current?.send(
        JSON.stringify({
          type: "audio_chunk",
          turn_id: turnId,
          audio_base64: btoa(binary),
          conversation_id: conversationIdRef.current,
        })
      );

      setPhase("processing");
    };

    recorder.start(250);
    setPhase("listening");
    setError(null);
    setFinalTranscript("");
    setPartialTranscript("Escuchando...");
    animationFrameRef.current = window.requestAnimationFrame(monitorSilence);
  }

  function cleanupSession(notifyServer = true) {
    stopMonitoring();
    stopAudioPlayback();
    stopCurrentTurn(false);

    if (notifyServer && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "stop_session" }));
    }

    socketRef.current?.close();
    socketRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
  }

  async function startConversation() {
    try {
      sessionActiveRef.current = true;
      micPausedRef.current = false;
      setError(null);
      setSessionActive(true);
      setMicPaused(false);
      setPhase("idle");
      await ensureMicrophoneReady();
      connectSocket();

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "start_session",
            conversation_id: conversationIdRef.current,
          })
        );
      }
    } catch (micError) {
      setSessionActive(false);
      setError(getFriendlyError(micError, "No fue posible acceder al microfono para iniciar la conversacion."));
    }
  }

  function stopConversation() {
    sessionActiveRef.current = false;
    micPausedRef.current = false;
    setSessionActive(false);
    setMicPaused(false);
    setPracticeState("idle");
    setLastIntent(null);
    setLastAction(null);
    setCurrentTurnId(null);
    setPhase("stopped");
    setPartialTranscript("");
    cleanupSession(true);
  }

  function toggleMicPause() {
    if (!sessionActiveRef.current) {
      return;
    }

    if (!micPausedRef.current) {
      micPausedRef.current = true;
      setMicPaused(true);
      setPhase("stopped");
      setPartialTranscript("");
      stopCurrentTurn(false);
      stopAudioPlayback();
      return;
    }

    micPausedRef.current = false;
    setMicPaused(false);
    setError(null);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      setPhase("listening");
      void beginListeningTurn();
    }
  }

  function getReadableStatus() {
    if (connectionStatus === "disconnected") {
      return "Desconectado";
    }
    if (connectionStatus === "connecting") {
      return "Conectando";
    }
    if (phase === "listening") {
      return "Escuchando";
    }
    if (phase === "processing") {
      return "Procesando";
    }
    if (phase === "speaking") {
      return "Hablando";
    }
    if (phase === "stopped") {
      return micPaused ? "Pausado" : "Detenido";
    }
    return "Listo";
  }

  return (
    <SectionCard
      title="Conversación por voz"
      description="Habla con el tutor y recibe una respuesta textual y hablada."
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
            <div
              className={`h-6 w-6 rounded-full ${
                phase === "listening" ? "animate-pulse bg-brand-teal" : "bg-brand-gold"
              }`}
            />
          </div>
          <button
            type="button"
            onClick={() => void startConversation()}
            disabled={sessionActive}
            className="rounded-full bg-brand-teal px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sessionActive ? "Conversacion activa" : "Iniciar conversación"}
          </button>
          <button
            type="button"
            onClick={stopConversation}
            disabled={!sessionActive}
            className="rounded-full border border-brand-mist px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Finalizar
          </button>
          <button
            type="button"
            onClick={toggleMicPause}
            disabled={!sessionActive}
            className="rounded-full border border-brand-mist px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-brand-sand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {micPaused ? "Reanudar microfono" : "Pausar microfono"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-brand-mist bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Estado</p>
            <p className="mt-2 text-lg font-semibold text-brand-ink">{getReadableStatus()}</p>
          </div>
          <div className="rounded-[1.5rem] border border-brand-mist bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Conexión</p>
            <p className="mt-2 text-lg font-semibold text-brand-ink">
              {connectionStatus === "connected" ? "Estable" : connectionStatus === "connecting" ? "Conectando" : "Sin conexión"}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-brand-mist bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Modo</p>
            <p className="mt-2 text-lg font-semibold text-brand-ink">Tutor por voz</p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-brand-mist bg-white p-4">
            <div
              ref={historyRef}
              className="max-h-[28rem] space-y-4 overflow-y-auto rounded-[1.25rem] bg-brand-sand/70 p-4"
            >
              {turns.length === 0 ? (
                <EmptyState
                  title="Listo para conversar"
                  description="Pulsa iniciar conversación y habla con naturalidad cuando el estado cambie a escuchando."
                />
              ) : (
                turns.map((turn) => (
                  <div key={turn.id} className="space-y-3">
                    <div className="ml-auto max-w-[88%] rounded-2xl bg-brand-teal px-4 py-3 text-sm leading-6 text-white">
                      {turn.userText}
                    </div>
                    <div className="max-w-[92%] rounded-2xl border border-brand-mist bg-white px-4 py-4 text-sm text-slate-700 shadow-sm">
                      {turn.assistantText ? (
                        <p className="leading-7">{turn.assistantText}</p>
                      ) : (
                        <p className="text-slate-500">
                          {turn.state === "error"
                            ? "El agente no pudo responder este turno."
                            : "El tutor esta preparando la respuesta..."}
                        </p>
                      )}

                      {turn.sources.length > 0 ? (
                        <div className="mt-4">
                          <TechnicalDetails summary="Ver fuentes consultadas">
                            <div className="space-y-3">
                              {turn.sources.map((source) => (
                                <div key={`${turn.id}-${source.chunk_id}`} className="rounded-lg bg-white p-3">
                                  <p className="font-medium text-slate-700">{source.material_title}</p>
                                  <p className="mt-1 text-xs leading-6 text-slate-500">{source.content_preview}</p>
                                </div>
                              ))}
                            </div>
                          </TechnicalDetails>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}

              {partialTranscript ? (
                <div className="rounded-2xl border border-dashed border-brand-mist bg-white px-4 py-3 text-sm text-slate-600">
                  <span className="font-semibold text-brand-ink">Transcripción en curso:</span> {partialTranscript}
                </div>
              ) : null}
            </div>
        </div>

        {finalTranscript ? (
          <div className="rounded-[1.25rem] border border-brand-mist bg-white p-4 text-sm text-slate-700">
            <span className="font-semibold text-brand-ink">Última transcripción:</span> {finalTranscript}
          </div>
        ) : null}

        <TechnicalDetails>
          <div className="space-y-2 font-mono text-xs">
            <p>conversation_id={conversationId ?? "null"}</p>
            <p>current_turn_id={currentTurnId ?? "null"}</p>
            <p>status={phase}</p>
            <p>practice_state={practiceState}</p>
            <p>intent={lastIntent ?? "null"}</p>
            <p>action={lastAction ?? "null"}</p>
            <p>silence_ms={DEFAULT_SILENCE_MS}</p>
          </div>
        </TechnicalDetails>

        {error ? <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
      </div>
    </SectionCard>
  );
}
