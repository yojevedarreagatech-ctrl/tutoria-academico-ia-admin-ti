import type { HealthResponse } from "@/types/health";

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
