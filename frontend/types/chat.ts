export type ChatSource = {
  chunk_id: number;
  material_id: number;
  material_title: string;
  chunk_index: number;
  content_preview: string;
};

export type ChatAskResponse = {
  conversation_id: number;
  answer: string;
  sources: ChatSource[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
};
