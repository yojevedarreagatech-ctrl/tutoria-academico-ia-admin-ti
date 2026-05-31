import { SemanticSearchPanel } from "@/components/admin/semantic-search-panel";
import { SectionCard } from "@/components/ui/section-card";
import { HealthStatus } from "@/components/ui/health-status";

const expectedServices = [
  "frontend",
  "backend",
  "db",
  "vector store",
  "backups",
  "CI/CD",
  "Terraform",
];

export default function AdminTecnicoPage() {
  return (
    <div className="space-y-8">
      <SectionCard
        title="Admin Tecnico"
        description="Vista inicial pensada para el curso de Administracion de TI, con foco en despliegue, observabilidad basica y servicios esperados."
      >
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.5rem] bg-slate-900 p-6 text-slate-50">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-300">Despliegue previsto</p>
            <h3 className="mt-3 text-2xl font-semibold">VPS Linux con Docker Compose</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              El despliegue objetivo se mantendra sobre VPS, con automatizaciones graduales para CI/CD, backups e
              infraestructura como codigo.
            </p>
          </div>

          <HealthStatus mode="technical" />
        </div>
      </SectionCard>

      <SectionCard title="Servicios esperados">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {expectedServices.map((service) => (
            <div key={service} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <p className="text-lg font-semibold text-brand-ink">{service}</p>
              <p className="mt-2 text-sm text-slate-600">Componente previsto dentro de la arquitectura general.</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SemanticSearchPanel />
    </div>
  );
}
