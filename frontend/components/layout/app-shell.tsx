import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/materiales", label: "Materiales" },
  { href: "/chat", label: "Chat Tutor" },
  { href: "/quizzes", label: "Quizzes" },
  { href: "/admin-tecnico", label: "Admin Tecnico" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-teal">
              TutorIA Academico
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-brand-ink">
              Plataforma base para tutoria academica e infraestructura TI
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Frontend inicial de Sprint 2 conectado al backend Django REST.
            </p>
          </div>

          <nav className="flex flex-wrap gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-teal hover:text-brand-teal"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
