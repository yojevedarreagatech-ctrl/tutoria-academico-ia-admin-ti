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
      setError(submitError instanceof Error ? submitError.message : "No fue posible subir el archivo.");
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
      setError(
        generationError instanceof Error
          ? generationError.message
          : "No fue posible generar embeddings para este material."
      );
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
      setError(deleteError instanceof Error ? deleteError.message : "No fue posible eliminar el material.");
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
      setError(submitError instanceof Error ? submitError.message : "No fue posible subir el audio.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <SectionCard
        title="Materiales"
        description="Sube contenido y preparalo para consulta, voz y quizzes."
      >
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-[1.75rem] border border-black/5 bg-white/90 p-6"
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

            <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
              Soporta PDF, TXT y flujo posterior de embeddings.
            </div>

            {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Procesando..." : "Subir material"}
            </button>
          </form>

          <div className="rounded-[1.75rem] bg-black p-6 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Pipeline</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Contenido listo para IA</h3>
            <div className="mt-5 grid gap-3 text-sm text-slate-200">
              <div className="rounded-2xl bg-white/10 px-4 py-3">Carga y extraccion</div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">Chunking persistido</div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">Embeddings bajo demanda</div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Audio"
        description="Sube una clase o nota de voz y conviertela en material consultable."
      >
        <form onSubmit={handleAudioSubmit} className="grid gap-4 lg:grid-cols-2">
          <input
            type="text"
            value={audioTitle}
            onChange={(event) => setAudioTitle(event.target.value)}
            placeholder="Titulo opcional del audio"
            className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
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
            className="min-h-28 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black lg:col-span-2"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-fit rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Procesando audio..." : "Subir audio"}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Materiales cargados">
        {loading ? (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Cargando materiales...</div>
        ) : materials.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No hay materiales todavia.
          </div>
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
                          <div className="mt-1 text-xs text-emerald-700">Listo para consulta y practica.</div>
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
                    <td className="px-4 py-3 text-slate-700">
                      {material.embeddings_count > 0 ? material.embeddings_count : "Pendiente"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {material.status === "processed" && material.embeddings_count === 0 ? (
                          <button
                            type="button"
                            onClick={() => void handleGenerateEmbeddings(material.id)}
                            disabled={embeddingMaterialId === material.id}
                            className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {embeddingMaterialId === material.id ? "Generando..." : "Reintentar embeddings"}
                          </button>
                        ) : null}

                        {material.embeddings_count > 0 ? (
                          <span className="self-center text-xs text-emerald-700">Embeddings listos</span>
                        ) : (
                          <span className="self-center text-xs text-slate-400">
                            {material.status === "processed" ? "Auto" : "Disponible al procesar"}
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
