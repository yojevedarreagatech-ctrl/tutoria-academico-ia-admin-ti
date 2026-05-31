"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { getMaterials, uploadMaterial } from "@/lib/api";
import type { Material, MaterialStatus } from "@/types/materials";
import { SectionCard } from "@/components/ui/section-card";

const statusStyles: Record<MaterialStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  processing: "bg-sky-50 text-sky-800",
  processed: "bg-emerald-50 text-emerald-800",
  error: "bg-rose-50 text-rose-800",
};

export function MaterialsManager() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMaterials() {
    setLoading(true);
    try {
      const data = await getMaterials();
      setMaterials(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar materiales.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMaterials();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Selecciona un archivo PDF o TXT.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await uploadMaterial(title, file);
      setTitle("");
      setFile(null);
      const input = document.getElementById("material-file") as HTMLInputElement | null;
      if (input) {
        input.value = "";
      }
      await loadMaterials();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No fue posible subir el archivo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <SectionCard
        title="Materiales"
        description="Carga documentos PDF o TXT para extraer texto y generar chunks listos para siguientes sprints."
      >
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="title">
                Titulo opcional
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej. Guia de estudio de bases de datos"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-teal"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="material-file">
                Archivo PDF o TXT
              </label>
              <input
                id="material-file"
                type="file"
                accept=".pdf,.txt"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500"
              />
            </div>

            <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              En este sprint solo se realiza extraccion y chunking. Aun no hay embeddings ni RAG.
            </div>

            {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-brand-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Procesando..." : "Subir material"}
            </button>
          </form>

          <div className="rounded-[1.5rem] bg-slate-900 p-6 text-slate-50">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Flujo actual</p>
            <h3 className="mt-3 text-2xl font-semibold">Upload, extraccion y chunking</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Cada documento se guarda en media, se lee de forma sincronica y se divide en chunks persistidos en la
              base de datos para sprints futuros.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Materiales cargados">
        {loading ? (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Cargando materiales...</div>
        ) : materials.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Aun no hay materiales cargados.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">Titulo</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Estado</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Chunks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {materials.map((material) => (
                  <tr key={material.id}>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="font-medium">{material.title}</div>
                      {material.status === "processed" ? (
                        <div className="mt-1 text-xs text-emerald-700">Listo para futuros sprints de embeddings y RAG.</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{material.file_type.toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[material.status]}`}>
                        {material.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(material.created_at).toLocaleString("es-GT")}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{material.chunks_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
