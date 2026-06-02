import type { ReactNode } from "react";

type TechnicalDetailsProps = {
  summary?: string;
  children: ReactNode;
};

export function TechnicalDetails({
  summary = "Mostrar detalles técnicos",
  children,
}: TechnicalDetailsProps) {
  return (
    <details className="rounded-[1.25rem] border border-brand-mist bg-slate-50/80 p-4 text-sm text-slate-600">
      <summary className="cursor-pointer list-none font-semibold text-brand-ink marker:hidden">
        {summary}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
