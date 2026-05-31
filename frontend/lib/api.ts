import type { HealthResponse } from "@/types/health";
import type { Material } from "@/types/materials";
import type { RetrievalResponse } from "@/types/retrieval";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function buildApiUrl(path: string): string {
  const normalizedBase = rawApiUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  const baseWithApi = normalizedBase.endsWith("/api") ? normalizedBase : `${normalizedBase}/api`;

  return `${baseWithApi}/${normalizedPath}`;
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(buildApiUrl("health/"), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json();
}

export function getConfiguredApiUrl(): string {
  return rawApiUrl;
}

export async function getMaterials(): Promise<Material[]> {
  const response = await fetch(buildApiUrl("materials/"), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Materials request failed with status ${response.status}`);
  }

  return response.json();
}

export async function uploadMaterial(title: string, file: File): Promise<Material> {
  const formData = new FormData();
  if (title.trim()) {
    formData.append("title", title.trim());
  }
  formData.append("file", file);

  const response = await fetch(buildApiUrl("materials/upload/"), {
    method: "POST",
    body: formData,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String(payload.detail)
        : `Upload failed with status ${response.status}`;
    throw new Error(detail);
  }

  return payload as Material;
}

export async function generateMaterialEmbeddings(materialId: number): Promise<Material> {
  const response = await fetch(buildApiUrl(`materials/${materialId}/generate-embeddings/`), {
    method: "POST",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String(payload.detail)
        : `Embedding generation failed with status ${response.status}`;
    throw new Error(detail);
  }

  return payload.material as Material;
}

export async function semanticSearch(query: string, topK = 5, materialId?: number): Promise<RetrievalResponse> {
  const response = await fetch(buildApiUrl("retrieval/search/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      top_k: topK,
      material_id: materialId || undefined,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String(payload.detail)
        : `Semantic search failed with status ${response.status}`;
    throw new Error(detail);
  }

  return payload as RetrievalResponse;
}
