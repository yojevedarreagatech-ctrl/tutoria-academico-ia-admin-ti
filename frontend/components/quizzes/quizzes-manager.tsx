"use client";

import { useEffect, useMemo, useState } from "react";
import { checkQuizAnswer, generateQuiz, getMaterials, getQuizzes } from "@/lib/api";
import type { Material } from "@/types/materials";
import type { Quiz, QuizCheckAnswerResponse } from "@/types/quizzes";
import { SectionCard } from "@/components/ui/section-card";

type ReviewState = Record<
  number,
  {
    selectedAnswer?: string;
    result?: QuizCheckAnswerResponse;
  }
>;

export function QuizzesManager() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | "">("");
  const [numQuestions, setNumQuestions] = useState(3);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [reviewState, setReviewState] = useState<ReviewState>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processedMaterials = useMemo(
    () => materials.filter((material) => material.status === "processed" && material.chunks_count > 0),
    [materials]
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [materialsResponse, quizzesResponse] = await Promise.all([getMaterials(), getQuizzes()]);
        setMaterials(materialsResponse);
        setQuizzes(quizzesResponse);
        if (materialsResponse.length > 0) {
          const firstProcessed = materialsResponse.find(
            (material) => material.status === "processed" && material.chunks_count > 0
          );
          if (firstProcessed) {
            setSelectedMaterialId(firstProcessed.id);
          }
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar quizzes.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  async function handleGenerateQuiz() {
    if (!selectedMaterialId) {
      setError("Selecciona un material procesado para generar el quiz.");
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const quiz = await generateQuiz(selectedMaterialId, numQuestions);
      setQuizzes((current) => [quiz, ...current]);
      setActiveQuiz(quiz);
      setReviewState({});
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "No fue posible generar el quiz.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCheckAnswer(quizId: number, questionId: number) {
    const selectedAnswer = reviewState[questionId]?.selectedAnswer;
    if (!selectedAnswer) {
      setError("Selecciona una opcion antes de revisar la respuesta.");
      return;
    }

    try {
      setError(null);
      const result = await checkQuizAnswer(quizId, questionId, selectedAnswer);
      setReviewState((current) => ({
        ...current,
        [questionId]: {
          ...current[questionId],
          result,
        },
      }));
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : "No fue posible revisar la respuesta.");
    }
  }

  const correctCount = activeQuiz
    ? activeQuiz.questions.filter((question) => reviewState[question.id]?.result?.is_correct).length
    : 0;

  return (
    <div className="space-y-8">
      <SectionCard
        title="Quizzes"
        description="Practica sobre contenido real con generacion automatica."
      >
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.75rem] border border-black/5 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Generate</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-brand-ink">Crear quiz</h3>

            <div className="mt-5 space-y-4">
              <label className="block text-sm text-slate-700">
                Material
                <select
                  value={selectedMaterialId}
                  onChange={(event) => setSelectedMaterialId(event.target.value ? Number(event.target.value) : "")}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                >
                  <option value="">Selecciona un material</option>
                  {processedMaterials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-slate-700">
                Cantidad de preguntas
                <select
                  value={numQuestions}
                  onChange={(event) => setNumQuestions(Number(event.target.value))}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                >
                  <option value={3}>3 preguntas</option>
                  <option value={5}>5 preguntas</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={() => void handleGenerateQuiz()}
              disabled={generating || !selectedMaterialId}
              className="mt-5 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? "Generando..." : "Generar quiz"}
            </button>
          </div>

          <div className="rounded-[1.75rem] bg-black p-6 text-white">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Ready to practice</p>
            <div className="mt-5 rounded-2xl bg-white/10 px-4 py-4 text-sm text-slate-200">
              {processedMaterials.length > 0
                ? `${processedMaterials.length} materiales procesados disponibles para generar quizzes.`
                : "Todavia no hay materiales procesados listos para quizzes."}
            </div>
          </div>
        </div>
      </SectionCard>

      {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <SectionCard title="Quiz activo" description="Selecciona respuestas y revisa explicaciones.">
        {activeQuiz ? (
          <div className="space-y-6">
            <div className="rounded-[1.5rem] border border-black/5 bg-white p-6">
              <h3 className="text-2xl font-semibold text-brand-ink">{activeQuiz.title}</h3>
              {activeQuiz.description ? (
                <p className="mt-2 text-sm leading-7 text-slate-600">{activeQuiz.description}</p>
              ) : null}
              <p className="mt-3 text-sm text-slate-500">
                Material: {activeQuiz.material_title || "Sin material"} | Correctas: {correctCount}/{activeQuiz.questions.length}
              </p>
            </div>

            {activeQuiz.questions.map((question, index) => (
              <div key={question.id} className="rounded-[1.5rem] border border-black/5 bg-white p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Pregunta {index + 1}
                </p>
                <h4 className="mt-3 text-lg font-semibold text-brand-ink">{question.question}</h4>

                <div className="mt-4 grid gap-3">
                  {question.options.map((option) => {
                    const selected = reviewState[question.id]?.selectedAnswer === option;
                    return (
                      <label
                        key={option}
                        className={`cursor-pointer rounded-2xl border px-4 py-3 text-sm transition ${
                          selected
                            ? "border-black bg-slate-100 text-brand-ink"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-black"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option}
                          checked={selected}
                          onChange={() =>
                            setReviewState((current) => ({
                              ...current,
                              [question.id]: {
                                ...current[question.id],
                                selectedAnswer: option,
                              },
                            }))
                          }
                          className="mr-3"
                        />
                        {option}
                      </label>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => void handleCheckAnswer(activeQuiz.id, question.id)}
                  className="mt-5 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Revisar respuesta
                </button>

                {reviewState[question.id]?.result ? (
                  <div
                    className={`mt-4 rounded-2xl px-4 py-4 text-sm ${
                      reviewState[question.id]?.result?.is_correct
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-rose-50 text-rose-800"
                    }`}
                  >
                    <p className="font-semibold">
                      {reviewState[question.id]?.result?.is_correct ? "Respuesta correcta" : "Respuesta incorrecta"}
                    </p>
                    <p className="mt-2">Correcta: {reviewState[question.id]?.result?.correct_answer}</p>
                    <p className="mt-2 leading-7">{reviewState[question.id]?.result?.explanation}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-5 py-6 text-sm text-slate-600">
            Genera o abre un quiz para empezar.
          </div>
        )}
      </SectionCard>

      <SectionCard title="Quizzes existentes">
        {loading ? (
          <div className="rounded-[1.5rem] bg-white px-5 py-6 text-sm text-slate-600">Cargando quizzes...</div>
        ) : quizzes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {quizzes.map((quiz) => (
              <button
                key={quiz.id}
                type="button"
                onClick={() => {
                  setActiveQuiz(quiz);
                  setReviewState({});
                }}
                className="rounded-[1.5rem] border border-black/5 bg-white p-5 text-left transition hover:border-black"
              >
                <h3 className="text-lg font-semibold text-brand-ink">{quiz.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{quiz.material_title || "Sin material asociado"}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {new Date(quiz.created_at).toLocaleString()} | {quiz.questions.length} preguntas
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-5 py-6 text-sm text-slate-600">
            No hay quizzes generados todavia.
          </div>
        )}
      </SectionCard>
    </div>
  );
}
