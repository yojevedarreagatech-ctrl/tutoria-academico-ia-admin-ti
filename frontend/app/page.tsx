import { SectionCard } from "@/components/ui/section-card";
import { HealthStatus } from "@/components/ui/health-status";

const dashboardCards = [
  {
    title: "Materiales",
    value: "PDF, TXT, audio",
  },
  {
    title: "Chat",
    value: "RAG",
  },
  {
    title: "Quizzes",
    value: "Practica",
  },
  {
    title: "Admin",
    value: "Health",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-hero p-8 shadow-panel md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="max-w-3xl">
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-brand-ink md:text-5xl">
              TutorIA
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Materiales, chat, quizzes y admin.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[1.5rem] border border-black/5 bg-white/85 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Secciones</p>
              <p className="mt-2 text-2xl font-semibold text-brand-ink">5</p>
            </div>
            <div className="rounded-[1.5rem] border border-black/5 bg-white/85 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Chat</p>
              <p className="mt-2 text-2xl font-semibold text-brand-ink">Activo</p>
            </div>
            <div className="rounded-[1.5rem] border border-black/5 bg-white/85 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Backend</p>
              <p className="mt-2 text-2xl font-semibold text-brand-ink">Online</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => (
          <SectionCard key={card.title} title={card.title}>
            <p className="text-2xl font-semibold tracking-tight text-brand-ink">{card.value}</p>
          </SectionCard>
        ))}
      </section>

      <SectionCard title="Estado">
        <HealthStatus />
      </SectionCard>
    </div>
  );
}
