export type MaterialStatus = "pending" | "processing" | "processed" | "error";

export type Material = {
  id: number;
  title: string;
  file: string;
  file_type: string;
  status: MaterialStatus;
  original_text: string;
  created_at: string;
  updated_at: string;
  chunks_count: number;
};
