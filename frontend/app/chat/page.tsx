import { SectionCard } from "@/components/ui/section-card";

const sampleMessages = [
  {
    role: "system",
    content: "En proximos sprints, este espacio conectara preguntas del estudiante con materiales procesados.",
  },
  {
    role: "user",
    content: "Quiero repasar redes y arquitectura de servicios.",
  },
  {
    role: "assistant",
    content: "La logica del chat tutor con RAG se implementara mas adelante. Por ahora esta es una interfaz base.",
  },
];

export default function ChatPage() {
  return (
    <div className="space-y-8">
      <SectionCard
        title="Chat Tutor"
        description="Interfaz visual inicial del futuro chat academico. En este sprint se valida navegacion, disposicion y experiencia base."
      >
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.5rem] bg-slate-900 p-6 text-slate-50">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Estado actual</p>
            <h3 className="mt-3 text-2xl font-semibold">Chat conectado visualmente, sin IA real todavia</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              La integracion de RAG, embeddings, agentes y memoria conversacional quedara para sprints posteriores.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <div className="space-y-3 rounded-[1.25rem] bg-slate-50 p-4">
              {sampleMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "ml-auto bg-brand-ink text-white"
                      : message.role === "assistant"
                        ? "bg-white text-slate-700"
                        : "border border-dashed border-slate-300 bg-slate-100 text-slate-600"
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                placeholder="Escribe una pregunta academica..."
                className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-teal"
              />
              <button className="rounded-full bg-brand-teal px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700">
                Enviar
              </button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
