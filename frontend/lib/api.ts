import type { HealthResponse } from "@/types/health";
import type { ChatAskResponse } from "@/types/chat";
import type { AudioUploadResponse } from "@/types/audio";
import type { Material } from "@/types/materials";
import type { RetrievalResponse } from "@/types/retrieval";
import type { Quiz, QuizCheckAnswerResponse } from "@/types/quizzes";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const rawWsUrl =
  process.env.NEXT_PUBLIC_WS_URL ||
  rawApiUrl.replace(/^http/, "ws").replace(/\/api\/?$/, "/ws");

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

export function getConfiguredWsUrl(): string {
  return rawWsUrl.replace(/\/+$/, "");
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

export async function uploadAudioMaterial(
  title: string,
  audioFile: File,
  transcriptionText?: string
): Promise<AudioUploadResponse> {
  const formData = new FormData();
  if (title.trim()) {
    formData.append("title", title.trim());
  }
  if (transcriptionText?.trim()) {
    formData.append("transcription_text", transcriptionText.trim());
  }
  formData.append("audio_file", audioFile);

  const response = await fetch(buildApiUrl("audio/upload/"), {
    method: "POST",
    body: formData,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String(payload.detail)
        : `Audio upload failed with status ${response.status}`;
    throw new Error(detail);
  }

  return payload as AudioUploadResponse;
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

export async function deleteMaterial(materialId: number): Promise<void> {
  const response = await fetch(buildApiUrl(`materials/${materialId}/`), {
    method: "DELETE",
  });

  if (!response.ok) {
    let detail = `Delete failed with status ${response.status}`;
    try {
      const payload = await response.json();
      if (payload && typeof payload === "object" && "detail" in payload) {
        detail = String(payload.detail);
      }
    } catch {
      // Ignore JSON parsing if the response body is empty.
    }
    throw new Error(detail);
  }
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

export async function askTutor(question: string, conversationId?: number | null): Promise<ChatAskResponse> {
  const response = await fetch(buildApiUrl("chat/ask/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      question,
      conversation_id: conversationId || undefined,
      top_k: 5,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String(payload.detail)
        : `Chat request failed with status ${response.status}`;
    throw new Error(detail);
  }

  return payload as ChatAskResponse;
}

export async function getQuizzes(): Promise<Quiz[]> {
  const response = await fetch(buildApiUrl("quizzes/"), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Quizzes request failed with status ${response.status}`);
  }

  return response.json();
}

export async function generateQuiz(materialId: number, numQuestions: number): Promise<Quiz> {
  const response = await fetch(buildApiUrl("quizzes/generate/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      material_id: materialId,
      num_questions: numQuestions,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String(payload.detail)
        : `Quiz generation failed with status ${response.status}`;
    throw new Error(detail);
  }

  return payload as Quiz;
}

export async function checkQuizAnswer(
  quizId: number,
  questionId: number,
  selectedAnswer: string
): Promise<QuizCheckAnswerResponse> {
  const response = await fetch(buildApiUrl(`quizzes/${quizId}/check-answer/`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      question_id: questionId,
      selected_answer: selectedAnswer,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String(payload.detail)
        : `Quiz answer check failed with status ${response.status}`;
    throw new Error(detail);
  }

  return payload as QuizCheckAnswerResponse;
}
