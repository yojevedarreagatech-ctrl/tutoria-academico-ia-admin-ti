"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { getMaterials, semanticSearch } from "@/lib/api";
import type { Material } from "@/types/materials";
import type { RetrievalResult } from "@/types/retrieval";
import { SectionCard } from "@/components/ui/section-card";

export function SemanticSearchPanel() {
  const [query, setQuery] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [results, setResults] = useState<RetrievalResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMaterials()
      .then((data) => setMaterials(data))
      .catch(() => setMaterials([]));
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await semanticSearch(query, 5, materialId ? Number(materialId) : undefined);
      setResults(response.results);
    } catch (searchError) {
      setResults([]);
      setError(
        searchError instanceof Error
          ? searchError.message
          : "No fue posible ejecutar la busqueda semantica."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      title="Semantic search"
      description="Explora resultados recuperados por embeddings."
    >
      <form onSubmit={handleSearch} className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto]">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar conceptos o temas"
          className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
        />
        <select
          value={materialId}
          onChange={(event) => setMaterialId(event.target.value)}
          className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
        >
          <option value="">Todos los materiales</option>
          {materials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.title}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {error ? <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-6 space-y-4">
        {results.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Aun no hay resultados.
          </div>
        ) : (
          results.map((result) => (
            <article key={result.chunk_id} className="rounded-[1.5rem] border border-black/5 bg-white p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-brand-ink">{result.material_title}</h3>
                  <p className="text-sm text-slate-500">Chunk #{result.chunk_index}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  score {result.score.toFixed(4)}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-700">{result.content}</p>
            </article>
          ))
        )}
      </div>
    </SectionCard>
  );
}
