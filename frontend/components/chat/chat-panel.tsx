"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { askTutor } from "@/lib/api";
import { getFriendlyError } from "@/lib/ui-errors";
import type { ChatMessage } from "@/types/chat";
import { VoiceAgentPanel } from "@/components/chat/voice-agent-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { TechnicalDetails } from "@/components/ui/technical-details";

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
      setError(getFriendlyError(requestError, "No fue posible obtener una respuesta del tutor."));
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
      <PageHeader
        eyebrow="Experiencia IA"
        title="Tutor IA"
        description="Conversa sobre tus materiales con una experiencia textual y por voz."
      />

      <SectionCard
        title="Chat textual"
        description="Pregunta, repregunta y revisa las fuentes consultadas."
      >
        <div className="rounded-[1.75rem] border border-brand-mist bg-white/92 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-ink">
                {conversationId ? `Sesion #${conversationId}` : "Sesion nueva"}
              </p>
              <p className="text-sm text-slate-500">Usa tus materiales procesados para obtener mejores respuestas.</p>
            </div>
            <button
              type="button"
              onClick={resetConversation}
              disabled={messages.length === 0 && !conversationId}
              className="rounded-full border border-brand-mist px-4 py-2 text-sm font-semibold text-brand-teal transition hover:bg-brand-sand disabled:cursor-not-allowed disabled:opacity-60"
            >
              Nueva sesion
            </button>
          </div>

          <div
            ref={messagesRef}
            className="max-h-[34rem] space-y-4 overflow-y-auto rounded-[1.5rem] bg-brand-sand/70 p-4"
          >
            {messages.length === 0 ? (
              <EmptyState
                title="Tu tutor esta listo"
                description="Haz una pregunta sobre un documento o audio que ya hayas cargado."
              />
            ) : (
              messages.map((message) => (
                <div key={message.id} className="space-y-3">
                  <div
                    className={`max-w-[92%] rounded-[1.5rem] px-4 py-3 text-sm leading-7 shadow-sm ${
                      message.role === "user"
                        ? "ml-auto bg-brand-teal text-white"
                        : "border border-brand-mist bg-white text-slate-700"
                    }`}
                  >
                    {message.content}
                  </div>

                  {message.role === "assistant" && message.sources && message.sources.length > 0 ? (
                    <div className="max-w-[92%]">
                      <TechnicalDetails summary="Ver fuentes consultadas">
                        <div className="space-y-3">
                          {message.sources.map((source) => (
                            <div key={source.chunk_id} className="rounded-xl bg-white p-3">
                              <p className="font-medium text-slate-700">{source.material_title}</p>
                              <p className="mt-1 text-xs leading-6 text-slate-500">{source.content_preview}</p>
                            </div>
                          ))}
                        </div>
                      </TechnicalDetails>
                    </div>
                  ) : null}
                </div>
              ))
            )}

            {loading ? (
              <div className="max-w-[92%] rounded-[1.5rem] border border-brand-mist bg-white px-4 py-3 text-sm text-slate-600">
                El tutor esta preparando una respuesta...
              </div>
            ) : null}
          </div>

          {error ? <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 border-t border-brand-mist pt-4 sm:flex-row sm:items-end">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Escribe una pregunta sobre tus materiales"
              rows={2}
              className="flex-1 rounded-[1.5rem] border border-brand-mist bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-teal"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="rounded-full bg-brand-teal px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </form>
        </div>
      </SectionCard>

      <VoiceAgentPanel />
    </div>
  );
}
