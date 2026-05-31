import { SectionCard } from "@/components/ui/section-card";

const placeholderQuizzes = [
  { title: "Quiz de fundamentos de redes", status: "Pendiente de generacion" },
  { title: "Quiz de conceptos base de IA", status: "Pendiente de generacion" },
];

export default function QuizzesPage() {
  return (
    <div className="space-y-8">
      <SectionCard
        title="Quizzes"
        description="Modulo inicial para ejercicios de practica. La generacion real se agregara cuando exista la capa de IA correspondiente."
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">Generacion futura</p>
            <h3 className="mt-3 text-2xl font-semibold text-brand-ink">Preparar quiz de practica</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Esta tarjeta quedara conectada mas adelante a materiales procesados y generacion estructurada de
              preguntas.
            </p>
            <button className="mt-5 rounded-full bg-brand-gold px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700">
              Generar quiz
            </button>
          </div>

          <div className="rounded-[1.5rem] bg-slate-900 p-6 text-slate-50">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-300">Nota del sprint</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Todavia no se implementa generacion real de quizzes ni evaluacion automatica. Aqui solo se deja la
              base visual y navegable.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Lista placeholder de quizzes">
        <div className="grid gap-4 md:grid-cols-2">
          {placeholderQuizzes.map((quiz) => (
            <div key={quiz.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-semibold text-brand-ink">{quiz.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{quiz.status}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
