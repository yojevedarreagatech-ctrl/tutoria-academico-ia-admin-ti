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
        title="Admin"
        description="Vista operativa del backend y el stack."
      >
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.75rem] bg-black p-6 text-white">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Operations</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Observabilidad para demo</h3>
            <div className="mt-5 grid gap-3 text-sm text-slate-200">
              <div className="rounded-2xl bg-white/10 px-4 py-3">Backend health</div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">Busqueda semantica</div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">Servicios esperados</div>
            </div>
          </div>

          <HealthStatus mode="technical" />
        </div>
      </SectionCard>

      <SectionCard title="Servicios esperados">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {expectedServices.map((service) => (
            <div key={service} className="rounded-[1.5rem] border border-black/5 bg-white p-5">
              <p className="text-lg font-semibold text-brand-ink">{service}</p>
              <p className="mt-2 text-sm text-slate-500">Componente previsto del sistema.</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SemanticSearchPanel />
    </div>
  );
}
