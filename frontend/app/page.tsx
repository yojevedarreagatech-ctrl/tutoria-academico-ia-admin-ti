import { SectionCard } from "@/components/ui/section-card";
import { HealthStatus } from "@/components/ui/health-status";

const dashboardCards = [
  {
    title: "Materiales de estudio",
    description: "Base para cargar documentos, audios y futuros procesos de extraccion de contenido.",
  },
  {
    title: "Chat tutor con RAG",
    description: "La interfaz ya queda preparada, mientras la logica de recuperacion llegara en sprints posteriores.",
  },
  {
    title: "Quizzes de practica",
    description: "Habra generacion guiada y trazabilidad academica, sin implementar IA real todavia.",
  },
  {
    title: "Despliegue administrado en VPS",
    description: "El proyecto se orienta a Docker Compose, backups, CI/CD y Terraform como parte del curso de TI.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/70 bg-hero p-8 shadow-panel">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-teal">
            Sprint 2
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-brand-ink">
            TutorIA Academico
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            Interfaz base para un sistema de tutoria academica que integrara IA y buenas practicas de
            administracion de TI sin adelantar funcionalidades complejas antes de tiempo.
          </p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => (
          <SectionCard key={card.title} title={card.title}>
            <p className="text-sm leading-6 text-slate-600">{card.description}</p>
          </SectionCard>
        ))}
      </section>

      <SectionCard
        title="Estado del backend"
        description="Consulta en tiempo real al endpoint GET /api/health/ para validar conectividad entre frontend y backend."
      >
        <HealthStatus />
      </SectionCard>
    </div>
  );
}
