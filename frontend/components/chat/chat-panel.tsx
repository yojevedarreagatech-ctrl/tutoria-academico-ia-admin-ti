"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { askTutor } from "@/lib/api";
import type { ChatMessage } from "@/types/chat";
import { VoiceAgentPanel } from "@/components/chat/voice-agent-panel";
import { SectionCard } from "@/components/ui/section-card";

export function ChatPanel() {
  const [question, setQuestion] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!messagesRef.current) {
      return;
    }

    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, loading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setLoading(true);
    setError(null);

    try {
      const response = await askTutor(trimmedQuestion, conversationId);
      setConversationId(response.conversation_id);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.answer,
          sources: response.sources,
        },
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No fue posible obtener una respuesta del tutor."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetConversation() {
    setConversationId(null);
    setMessages([]);
    setQuestion("");
    setError(null);
  }

  return (
    <div className="space-y-8">
      <SectionCard
        title="Chat Tutor"
        description="Pregunta sobre tus materiales procesados. El tutor responde usando retrieval sobre chunks con embeddings."
      >
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.5rem] bg-slate-900 p-6 text-slate-50">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Modo actual</p>
            <h3 className="mt-3 text-2xl font-semibold">Chat RAG conversacional</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Conserva el contexto de la conversacion para preguntas de seguimiento. Primero debes tener
              materiales procesados con embeddings.
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-white/10 px-4 py-3 text-sm text-slate-200">
                Conversacion activa: {conversationId ? `#${conversationId}` : "nueva"}
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3 text-sm text-slate-200">
                Funciona bien para preguntas como "explicalo mas facil", "dame un ejemplo" o "resume lo mas
                importante".
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <div
              ref={messagesRef}
              className="max-h-[30rem] space-y-4 overflow-y-auto rounded-[1.25rem] bg-slate-50 p-4"
            >
              {messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
                  Aun no hay mensajes. Haz una pregunta sobre un material ya procesado y continua con preguntas
                  de seguimiento en la misma conversacion.
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="space-y-3">
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "ml-auto bg-brand-ink text-white"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      {message.content}
                    </div>

                    {message.role === "assistant" && message.sources && message.sources.length > 0 ? (
                      <div className="max-w-[90%] rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
                        <p className="font-semibold text-brand-ink">Fuentes consultadas</p>
                        <div className="mt-3 space-y-3">
                          {message.sources.map((source) => (
                            <div key={source.chunk_id} className="rounded-xl bg-slate-50 p-3">
                              <p className="font-medium text-slate-700">
                                {source.material_title}
                              </p>
                              <p className="mt-1 text-xs leading-6 text-slate-500">{source.content_preview}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))
              )}

              {loading ? (
                <div className="max-w-[90%] rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                  El tutor esta preparando una respuesta con base en los materiales cargados...
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Si quieres cambiar de tema por completo, reinicia la conversacion.
              </p>
              <button
                type="button"
                onClick={resetConversation}
                disabled={messages.length === 0 && !conversationId}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-teal hover:text-brand-teal disabled:cursor-not-allowed disabled:opacity-60"
              >
                Nueva conversacion
              </button>
            </div>

            {error ? <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Escribe una pregunta academica o una repregunta de seguimiento..."
                rows={2}
                className="flex-1 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-teal"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="rounded-full bg-brand-teal px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Enviar"}
              </button>
            </form>
          </div>
        </div>
      </SectionCard>

      <VoiceAgentPanel />
    </div>
  );
}
