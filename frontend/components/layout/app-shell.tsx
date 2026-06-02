"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/materiales", label: "Materiales" },
  { href: "/chat", label: "Tutor IA" },
  { href: "/quizzes", label: "Quizzes" },
  { href: "/admin-tecnico", label: "Infraestructura" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 xl:flex-row xl:items-start">
        <aside className="xl:sticky xl:top-4 xl:w-[320px] xl:flex-none">
          <div className="rounded-[2rem] border border-brand-mist bg-white/80 p-5 shadow-panel backdrop-blur-xl md:p-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-brand-mist bg-brand-teal px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-white">
              <span className="h-2 w-2 rounded-full bg-rose-200" />
              Demo IA + Admin TI
            </div>

            <div className="mt-5">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-brand-ink md:text-[2.5rem]">
                TutorIA Academico
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Tutor inteligente para estudiar tus propios materiales.
              </p>
            </div>

            <nav className="mt-6 grid gap-2">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-[1.15rem] px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-brand-teal text-white shadow-sm"
                        : "bg-white/70 text-slate-600 hover:bg-brand-sand hover:text-brand-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="rounded-[2rem] border border-brand-mist bg-white/32 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] md:p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
