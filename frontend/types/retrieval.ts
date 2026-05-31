export type RetrievalResult = {
  chunk_id: number;
  material_id: number;
  material_title: string;
  content: string;
  chunk_index: number;
  score: number;
};

export type RetrievalResponse = {
  query: string;
  results: RetrievalResult[];
};
