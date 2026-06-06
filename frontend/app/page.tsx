import Link from "next/link";
import { HealthStatus } from "@/components/ui/health-status";
import { PageHeader } from "@/components/ui/page-header";
import { PrimaryActionCard } from "@/components/ui/primary-action-card";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";

const capabilityCards = [
  {
    title: "RAG sobre documentos",
    value: "Consulta tus materiales con contexto recuperado.",
  },
  {
    title: "Voz con STT/TTS",
    value: "Habla con el tutor y recibe respuesta en audio.",
  },
  {
    title: "Quizzes estructurados",
    value: "Practica con preguntas validadas desde el material.",
  },
  {
    title: "Despliegue administrado en VPS",
    value: "Infraestructura, CI/CD, Terraform y backups.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2.25rem] border border-brand-mist bg-hero p-8 shadow-panel md:p-10">
        <PageHeader
          eyebrow="TutorIA Académico"
          title="Estudia mejor con un tutor de IA basado en tus materiales xdxd"
          description="Sube documentos o audios, conversa con un tutor académico, practica con quizzes y repasa por voz."
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="grid gap-4 md:grid-cols-3">
            <PrimaryActionCard
              href="/materiales"
              title="Subir material"
              description="Carga documentos y audio para indexarlos."
            />
            <PrimaryActionCard
              href="/chat"
              title="Abrir Tutor IA"
              description="Consulta, resume y practica sobre tus contenidos."
            />
            <PrimaryActionCard
              href="/quizzes"
              title="Generar quiz"
              description="Crea práctica automática desde materiales procesados."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <StatCard label="Experiencia" value="RAG + Voz" hint="Texto y voz en una misma experiencia." />
            <StatCard label="Materiales" value="PDF, TXT, Audio" hint="Contenido listo para estudio y práctica." />
            <StatCard label="Infraestructura" value="VPS + CI/CD" hint="Despliegue, backups y validación continua." />
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {capabilityCards.map((card) => (
          <SectionCard key={card.title} title={card.title}>
            <p className="text-sm leading-7 text-slate-600">{card.value}</p>
          </SectionCard>
        ))}
      </section>

      <SectionCard title="Estado del sistema" description="Validación rápida del backend conectado a la demo.">
        <div className="flex items-center justify-between gap-4">
          <HealthStatus />
          <Link
            href="/admin-tecnico"
            className="hidden rounded-full border border-brand-mist bg-white px-4 py-2 text-sm font-semibold text-brand-teal transition hover:bg-brand-sand md:inline-flex"
          >
            Ver infraestructura
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
