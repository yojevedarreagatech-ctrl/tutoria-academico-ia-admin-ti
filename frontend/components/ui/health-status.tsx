"use client";

import { useEffect, useState } from "react";
import { getConfiguredApiUrl, getHealth } from "@/lib/api";
import type { HealthResponse } from "@/types/health";

type HealthState =
  | { status: "loading" }
  | { status: "success"; data: HealthResponse }
  | { status: "error"; message: string };

type HealthStatusProps = {
  mode?: "dashboard" | "technical";
};

export function HealthStatus({ mode = "dashboard" }: HealthStatusProps) {
  const [state, setState] = useState<HealthState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    getHealth()
      .then((data) => {
        if (active) {
          setState({ status: "success", data });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "No fue posible consultar el backend.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Consultando estado del backend...
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          No se pudo obtener el estado del backend: {state.message}
        </div>
        {mode === "technical" ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">API configurada</p>
            <p className="mt-2 break-all text-sm font-medium text-brand-teal">{getConfiguredApiUrl()}</p>
          </div>
        ) : null}
      </div>
    );
  }

  if (mode === "technical") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Backend</p>
          <p className="mt-2 text-lg font-semibold text-brand-ink">
            {state.data.status} ({state.data.service})
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">API configurada</p>
          <p className="mt-2 break-all text-sm font-medium text-brand-teal">{getConfiguredApiUrl()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl bg-emerald-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Status</p>
        <p className="mt-2 text-lg font-semibold text-emerald-900">{state.data.status}</p>
      </div>
      <div className="rounded-2xl bg-slate-100 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Service</p>
        <p className="mt-2 text-lg font-semibold text-brand-ink">{state.data.service}</p>
      </div>
      <div className="rounded-2xl bg-amber-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Project</p>
        <p className="mt-2 text-lg font-semibold text-amber-900">{state.data.project}</p>
      </div>
    </div>
  );
}
