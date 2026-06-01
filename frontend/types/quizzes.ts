export type QuizQuestion = {
  id: number;
  quiz: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  created_at: string;
};

export type Quiz = {
  id: number;
  material: number | null;
  material_title?: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  created_at: string;
  updated_at: string;
};

export type QuizCheckAnswerResponse = {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
};
