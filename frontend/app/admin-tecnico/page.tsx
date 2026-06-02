import { SemanticSearchPanel } from "@/components/admin/semantic-search-panel";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { HealthStatus } from "@/components/ui/health-status";

export default function AdminTecnicoPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operación técnica"
        title="Infraestructura"
        description="Resumen del entorno de despliegue, servicios y componentes operativos de la demo."
      />

      <SectionCard
        title="Estado del backend"
        description="Salud del servicio principal y conectividad base."
      >
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.75rem] bg-brand-teal p-6 text-white">
            <p className="text-sm uppercase tracking-[0.18em] text-cyan-100">Entorno de despliegue</p>
            <div className="mt-5 grid gap-3 text-sm text-slate-100">
              <div className="rounded-2xl bg-white/10 px-4 py-3">VPS Linux existente</div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">docker-compose v1</div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">HTTPS + WSS para voz</div>
            </div>
          </div>

          <HealthStatus mode="technical" />
        </div>
      </SectionCard>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Servicios Docker" value="db · backend · frontend · nginx" />
        <StatCard label="CI/CD" value="GitHub Actions" hint="Validacion y deploy por SSH a la VPS." />
        <StatCard label="Terraform / IaC" value="Seguro y documental" hint="Sin cambios reales sobre produccion." />
        <StatCard label="Backups" value="DB + media" hint="Retencion simple de ultimos 7 respaldos." />
        <StatCard label="Dominio" value="tutoria.centromedicolosencinos.tech" />
        <StatCard label="Docker Compose" value="docker-compose.prod.yml" />
      </section>

      <SectionCard title="URLs importantes">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[1.5rem] border border-brand-mist bg-white p-5">
            <p className="text-sm font-semibold text-brand-ink">Aplicacion</p>
            <p className="mt-2 break-all text-sm text-slate-600">https://tutoria.centromedicolosencinos.tech</p>
          </div>
          <div className="rounded-[1.5rem] border border-brand-mist bg-white p-5">
            <p className="text-sm font-semibold text-brand-ink">Healthcheck</p>
            <p className="mt-2 break-all text-sm text-slate-600">https://tutoria.centromedicolosencinos.tech/api/health/</p>
          </div>
          <div className="rounded-[1.5rem] border border-brand-mist bg-white p-5">
            <p className="text-sm font-semibold text-brand-ink">WebSocket</p>
            <p className="mt-2 break-all text-sm text-slate-600">wss://tutoria.centromedicolosencinos.tech/ws</p>
          </div>
        </div>
      </SectionCard>

      <SemanticSearchPanel />
    </div>
  );
}
