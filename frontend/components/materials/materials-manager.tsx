"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  deleteMaterial,
  generateMaterialEmbeddings,
  getMaterials,
  uploadAudioMaterial,
  uploadMaterial,
} from "@/lib/api";
import { getFriendlyError } from "@/lib/ui-errors";
import type { Material, MaterialStatus } from "@/types/materials";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";

const statusConfig: Record<MaterialStatus, { label: string; tone: "warning" | "info" | "success" | "danger" }> = {
  pending: { label: "Pendiente", tone: "warning" },
  processing: { label: "Procesando", tone: "info" },
  processed: { label: "Procesado", tone: "success" },
  error: { label: "Error", tone: "danger" },
};

export function MaterialsManager() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [audioTitle, setAudioTitle] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [manualTranscription, setManualTranscription] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [embeddingMaterialId, setEmbeddingMaterialId] = useState<number | null>(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState<number | null>(null);

  async function ensureEmbeddings(material: Material) {
    if (material.status !== "processed" || material.chunks_count === 0 || material.embeddings_count > 0) {
      return material;
    }

    try {
      return await generateMaterialEmbeddings(material.id);
    } catch {
      return material;
    }
  }

  async function loadMaterials() {
    setLoading(true);
    try {
      const data = await getMaterials();
      setMaterials(data);
      setError(null);
    } catch (loadError) {
      setError(getFriendlyError(loadError, "No fue posible cargar materiales."));
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
      const uploadedMaterial = await uploadMaterial(title, file);
      await ensureEmbeddings(uploadedMaterial);
      setTitle("");
      setFile(null);
      const input = document.getElementById("material-file") as HTMLInputElement | null;
      if (input) {
        input.value = "";
      }
      await loadMaterials();
    } catch (submitError) {
      setError(getFriendlyError(submitError, "No fue posible subir el archivo."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateEmbeddings(materialId: number) {
    setEmbeddingMaterialId(materialId);
    setError(null);

    try {
      const updatedMaterial = await generateMaterialEmbeddings(materialId);
      setMaterials((current) =>
        current.map((material) => (material.id === materialId ? updatedMaterial : material))
      );
    } catch (generationError) {
      setError(getFriendlyError(generationError, "No fue posible generar embeddings para este material."));
    } finally {
      setEmbeddingMaterialId(null);
    }
  }

  async function handleDeleteMaterial(materialId: number) {
    setDeletingMaterialId(materialId);
    setError(null);

    try {
      await deleteMaterial(materialId);
      setMaterials((current) => current.filter((material) => material.id !== materialId));
    } catch (deleteError) {
      setError(getFriendlyError(deleteError, "No fue posible eliminar el material."));
    } finally {
      setDeletingMaterialId(null);
    }
  }

  async function handleAudioSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!audioFile) {
      setError("Selecciona un archivo de audio.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await uploadAudioMaterial(audioTitle, audioFile, manualTranscription);
      await ensureEmbeddings(response.material);
      setAudioTitle("");
      setAudioFile(null);
      setManualTranscription("");
      const input = document.getElementById("audio-file") as HTMLInputElement | null;
      if (input) {
        input.value = "";
      }
      await loadMaterials();
    } catch (submitError) {
      setError(getFriendlyError(submitError, "No fue posible subir el audio."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Biblioteca académica"
        title="Materiales de estudio"
        description="Carga documentos y audios para indexarlos y consultarlos desde el tutor."
      />

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Documentos" description="PDF y TXT listos para procesar.">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
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
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
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
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-500"
              />
            </div>

            <div className="rounded-2xl bg-brand-sand px-4 py-3 text-sm text-slate-600">
              Al subir un archivo, el sistema extrae texto, crea chunks e intenta indexarlo automaticamente.
            </div>

            {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-brand-teal px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Procesando..." : "Subir material"}
            </button>
          </form>
        </SectionCard>

        <div className="space-y-8">
          <SectionCard title="Audio" description="Convierte clases o notas de voz en material consultable.">
            <form onSubmit={handleAudioSubmit} className="grid gap-4 lg:grid-cols-2">
              <input
                type="text"
                value={audioTitle}
                onChange={(event) => setAudioTitle(event.target.value)}
                placeholder="Titulo opcional del audio"
                className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-teal"
              />
              <input
                id="audio-file"
                type="file"
                accept=".mp3,.wav,.m4a,.webm,.ogg"
                onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)}
                className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-500"
              />
              <textarea
                value={manualTranscription}
                onChange={(event) => setManualTranscription(event.target.value)}
                placeholder="Transcripcion manual opcional"
                className="min-h-28 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-teal lg:col-span-2"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-fit rounded-full bg-brand-gold px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Procesando audio..." : "Subir audio"}
              </button>
            </form>
          </SectionCard>

          <SectionCard title="Estado del módulo" description="Todo el contenido procesado queda listo para consultar en Tutor IA y Quizzes.">
            <div className="grid gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-brand-sand px-4 py-3">Contenido indexado con chunks y embeddings.</div>
              <div className="rounded-2xl bg-brand-sand px-4 py-3">Audio y documentos comparten la misma base de conocimiento.</div>
              <div className="rounded-2xl bg-brand-sand px-4 py-3">Los materiales procesados quedan listos para consulta y práctica.</div>
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Materiales cargados">
        {loading ? (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Cargando materiales...</div>
        ) : materials.length === 0 ? (
          <EmptyState
            title="Todavia no hay materiales"
            description="Sube un documento o un audio para empezar a construir tu base de estudio."
          />
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] border border-black/5 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">Titulo</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Estado</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Chunks</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Embeddings</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {materials.map((material) => (
                  <tr key={material.id}>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="font-medium">{material.title}</div>
                      {material.status === "processed" ? (
                        <div className="mt-1 text-xs text-emerald-700">Listo para consultar</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{material.file_type.toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={statusConfig[material.status].tone}>
                        {statusConfig[material.status].label}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(material.created_at).toLocaleString("es-GT")}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{material.chunks_count}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {material.embeddings_count > 0 ? "Contenido indexado" : "Pendiente"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {material.status === "processed" && material.embeddings_count === 0 ? (
                          <button
                            type="button"
                            onClick={() => void handleGenerateEmbeddings(material.id)}
                            disabled={embeddingMaterialId === material.id}
                            className="rounded-full border border-brand-mist px-3 py-2 text-xs font-semibold text-brand-teal transition hover:bg-brand-sand disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {embeddingMaterialId === material.id ? "Generando..." : "Reintentar embeddings"}
                          </button>
                        ) : null}

                        {material.embeddings_count > 0 ? (
                          <span className="self-center text-xs text-emerald-700">Listo para consultar</span>
                        ) : (
                          <span className="self-center text-xs text-slate-400">
                            {material.status === "processed" ? "Indexacion automatica" : "Disponible al procesar"}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => void handleDeleteMaterial(material.id)}
                          disabled={deletingMaterialId === material.id}
                          className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingMaterialId === material.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </td>
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
