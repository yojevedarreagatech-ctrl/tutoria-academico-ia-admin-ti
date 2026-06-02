type StatusBadgeProps = {
  children: string;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
};

const toneStyles = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  danger: "bg-rose-50 text-rose-700 border-rose-100",
  info: "bg-sky-50 text-sky-700 border-sky-100",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneStyles[tone]}`}>
      {children}
    </span>
  );
}
