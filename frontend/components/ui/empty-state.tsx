type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-brand-mist bg-white/80 px-5 py-8 text-center">
      <p className="text-base font-semibold text-brand-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
