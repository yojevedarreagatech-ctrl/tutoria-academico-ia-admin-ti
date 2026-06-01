"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getConfiguredWsUrl } from "@/lib/api";
import type { ChatSource } from "@/types/chat";
import type { VoiceAgentEvent, VoiceAgentPhase, VoiceConnectionStatus } from "@/types/voice";
import { SectionCard } from "@/components/ui/section-card";

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
      setError("No fue posible conectar el voice agent.");
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
      setError(
        micError instanceof Error
          ? micError.message
          : "No fue posible acceder al microfono para iniciar la conversacion."
      );
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
      title="Voice Agent"
      description="Sesion conversacional por WebSocket con orden de turnos explicito, RAG y respuesta hablada."
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void startConversation()}
            disabled={sessionActive}
            className="rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sessionActive ? "Conversacion iniciada" : "Iniciar conversacion"}
          </button>
          <button
            type="button"
            onClick={stopConversation}
            disabled={!sessionActive}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Finalizar conversacion
          </button>
          <button
            type="button"
            onClick={toggleMicPause}
            disabled={!sessionActive}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-teal hover:text-brand-teal disabled:cursor-not-allowed disabled:opacity-60"
          >
            {micPaused ? "Reanudar microfono" : "Pausar microfono"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <span className="font-semibold text-brand-ink">Conexion:</span> {connectionStatus}
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <span className="font-semibold text-brand-ink">Estado:</span> {getReadableStatus()}
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <span className="font-semibold text-brand-ink">Conversacion:</span>{" "}
            {conversationId ? `#${conversationId}` : "sin iniciar"}
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <span className="font-semibold text-brand-ink">Practice:</span> {practiceState}
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          Debug: conversation_id={conversationId ?? "null"} | current_turn_id={currentTurnId ?? "null"} | status={phase} | practice_state={practiceState} | intent={lastIntent ?? "null"} | action={lastAction ?? "null"}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.25rem] bg-slate-900 p-5 text-slate-50">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Modo conversacional</p>
            <h3 className="mt-3 text-xl font-semibold">Turnos ordenados por sesion</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Cada turno tiene `turn_id`, el backend procesa uno a la vez y el frontend ignora eventos atrasados.
            </p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="rounded-xl bg-white/10 px-4 py-3">
                <span className="font-semibold">Estado actual:</span> {getReadableStatus()}
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3">
                <span className="font-semibold">Silencio para cerrar turno:</span> {DEFAULT_SILENCE_MS} ms
              </div>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
            <div
              ref={historyRef}
              className="max-h-[28rem] space-y-4 overflow-y-auto rounded-[1rem] bg-slate-50 p-4"
            >
              {turns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-600">
                  Inicia una conversacion y habla con normalidad. El sistema mantendra el orden de turnos y
                  evitara procesar respuestas atrasadas.
                </div>
              ) : (
                turns.map((turn) => (
                  <div key={turn.id} className="space-y-3">
                    <div className="ml-auto max-w-[88%] rounded-2xl bg-brand-ink px-4 py-3 text-sm leading-6 text-white">
                      {turn.userText}
                    </div>
                    <div className="max-w-[92%] rounded-2xl bg-white px-4 py-4 text-sm text-slate-700 shadow-sm">
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
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="font-semibold text-brand-ink">Fuentes consultadas</p>
                          <div className="mt-3 space-y-3">
                            {turn.sources.map((source) => (
                              <div key={`${turn.id}-${source.chunk_id}`} className="rounded-lg bg-white p-3">
                                <p className="font-medium text-slate-700">{source.material_title}</p>
                                <p className="mt-1 text-xs leading-6 text-slate-500">{source.content_preview}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}

              {partialTranscript ? (
                <div className="rounded-2xl border border-dashed border-brand-teal/40 bg-white px-4 py-3 text-sm text-slate-600">
                  <span className="font-semibold text-brand-ink">Captura actual:</span> {partialTranscript}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {finalTranscript ? (
          <div className="rounded-xl bg-white p-4 text-sm text-slate-700">
            <span className="font-semibold text-brand-ink">Ultima transcripcion final:</span> {finalTranscript}
          </div>
        ) : null}

        {error ? <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
      </div>
    </SectionCard>
  );
}
