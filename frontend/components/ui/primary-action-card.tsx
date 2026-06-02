import Link from "next/link";

type PrimaryActionCardProps = {
  href: string;
  title: string;
  description: string;
};

export function PrimaryActionCard({ href, title, description }: PrimaryActionCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-[1.75rem] border border-brand-mist bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10 text-brand-teal">
        <span className="text-xl font-semibold">{title.charAt(0)}</span>
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight text-brand-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-5 text-sm font-semibold text-brand-teal">Abrir</p>
    </Link>
  );
}
