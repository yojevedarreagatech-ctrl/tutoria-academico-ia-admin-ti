import { SectionCard } from "@/components/ui/section-card";

const sampleMaterials = [
  { title: "Apuntes de redes.pdf", type: "PDF", status: "processed" },
  { title: "Clase de arquitectura.mp3", type: "Audio", status: "pending" },
  { title: "Resumen IA unidad 1.docx", type: "Documento", status: "processing" },
];

export default function MaterialesPage() {
  return (
    <div className="space-y-8">
      <SectionCard
        title="Materiales"
        description="Aqui se concentrara la carga y gestion de documentos de estudio. En Sprint 2 el formulario es visual y deja lista la experiencia para el siguiente paso."
      >
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form className="space-y-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="title">
                Titulo del material
              </label>
              <input
                id="title"
                type="text"
                placeholder="Ej. Guia de estudio de bases de datos"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-brand-teal"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="file">
                Archivo
              </label>
              <input
                id="file"
                type="file"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500"
              />
            </div>

            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              El endpoint real de carga se integrara en un sprint posterior. Esta vista deja listo el flujo visual.
            </div>

            <button
              type="button"
              className="rounded-full bg-brand-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Subir material
            </button>
          </form>

          <div className="rounded-[1.5rem] bg-slate-900 p-6 text-slate-50">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Proposito del modulo</p>
            <h3 className="mt-3 text-2xl font-semibold">Punto de entrada para contenidos academicos</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Aqui se administraran documentos, audios y metadatos antes del procesamiento de chunks, embeddings y
              futuros flujos de recuperacion.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Lista placeholder de materiales">
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Titulo</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Tipo</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sampleMaterials.map((material) => (
                <tr key={material.title}>
                  <td className="px-4 py-3 text-slate-700">{material.title}</td>
                  <td className="px-4 py-3 text-slate-500">{material.type}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {material.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
