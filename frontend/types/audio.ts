import type { Material } from "@/types/materials";

export type AudioTranscription = {
  id: number;
  material: number | null;
  audio_file: string;
  transcription_text: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AudioUploadResponse = {
  material: Material;
  audio_transcription: AudioTranscription;
};
