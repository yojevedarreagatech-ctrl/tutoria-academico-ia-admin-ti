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
    <div className="min-h-screen px-4 pb-8 pt-4 md:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-brand-mist bg-white/80 px-5 py-5 shadow-panel backdrop-blur-xl md:px-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-brand-mist bg-brand-teal px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-white">
                <span className="h-2 w-2 rounded-full bg-violet-200" />
                Demo IA + Admin TI
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-brand-ink md:text-4xl">
                TutorIA Académico
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Tutor inteligente para estudiar tus propios materiales.
              </p>
            </div>

            <div className="flex items-center lg:justify-end">
              <nav className="flex flex-wrap gap-2 rounded-[1.5rem] border border-brand-mist bg-brand-sand/70 p-1.5">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-[1rem] px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-brand-teal text-white shadow-sm"
                          : "text-slate-600 hover:bg-white hover:text-brand-ink"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </header>
      </div>

      <main className="mx-auto max-w-7xl px-1 py-8 md:px-0">{children}</main>
    </div>
  );
}
