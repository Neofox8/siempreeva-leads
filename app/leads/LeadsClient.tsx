"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useCallback } from "react";
import type { Lead } from "@/types/lead";

type Stats = {
  total: number;
  noAtendidos: number;
  sanMiguel: number;
  miraflores: number;
};

type Filters = {
  sede: string;
  atendido: string;
  q: string;
};

export default function LeadsClient({
  leads,
  error,
  stats,
  filters,
}: {
  leads: Lead[];
  error: string | null;
  stats: Stats;
  filters: Filters;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      startTransition(() => {
        router.replace(`/leads?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-berry">Siempre Eva — Leads</h1>
            <p className="text-sm text-neutral-600">
              Gestión y seguimiento de leads desde ManyChat
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total leads" value={stats.total} />
          <StatCard label="No atendidos" value={stats.noAtendidos} accent />
          <StatCard label="San Miguel" value={stats.sanMiguel} />
          <StatCard label="Miraflores" value={stats.miraflores} />
        </div>
      </header>

      <section className="mb-4 flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
        <Field label="Buscar por nombre">
          <input
            defaultValue={filters.q}
            onChange={(e) => updateParam("q", e.target.value)}
            placeholder="Ej: María"
            className="w-56 rounded border border-neutral-300 px-3 py-2 text-sm focus:border-berry focus:outline-none"
          />
        </Field>

        <Field label="Sede">
          <select
            value={filters.sede}
            onChange={(e) => updateParam("sede", e.target.value)}
            className="rounded border border-neutral-300 px-3 py-2 text-sm focus:border-berry focus:outline-none"
          >
            <option value="">Todas</option>
            <option value="San Miguel">San Miguel</option>
            <option value="Miraflores">Miraflores</option>
          </select>
        </Field>

        <Field label="Atendido">
          <select
            value={filters.atendido}
            onChange={(e) => updateParam("atendido", e.target.value)}
            className="rounded border border-neutral-300 px-3 py-2 text-sm focus:border-berry focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="Atendido">Atendido</option>
            <option value="No Atendido">No Atendido</option>
          </select>
        </Field>

        {(filters.sede || filters.atendido || filters.q) && (
          <button
            onClick={() => {
              startTransition(() => router.replace("/leads"));
            }}
            className="ml-auto rounded border border-berry px-3 py-2 text-sm text-berry hover:bg-berry hover:text-white"
          >
            Limpiar filtros
          </button>
        )}

        {isPending && (
          <span className="text-xs text-neutral-500">Actualizando…</span>
        )}
      </section>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
          Error: {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-crema text-left text-xs uppercase tracking-wide text-neutral-600">
            <tr>
              <Th>Fecha</Th>
              <Th>Nombre</Th>
              <Th>Usuario</Th>
              <Th>Celular</Th>
              <Th>Sede</Th>
              <Th>Turno</Th>
              <Th>Día</Th>
              <Th>Seguidora</Th>
              <Th>Atendido</Th>
              <Th>Observación</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-10 text-center text-neutral-500"
                >
                  No hay leads para los filtros aplicados.
                </td>
              </tr>
            ) : (
              leads.map((lead) => <Row key={lead.id} lead={lead} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ lead }: { lead: Lead }) {
  const [atendido, setAtendido] = useState(lead.atendido);
  const [observacion, setObservacion] = useState(lead.observacion ?? "");
  const [saving, setSaving] = useState<null | "atendido" | "observacion">(null);

  async function patch(field: "atendido" | "observacion", value: string) {
    setSaving(field);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`Error guardando ${field}: ${j.error ?? res.status}`);
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <tr className="hover:bg-crema/40">
      <Td>{formatDate(lead.fecha)}</Td>
      <Td>{lead.nombre ?? "—"}</Td>
      <Td>{lead.usuario ?? "—"}</Td>
      <Td>{lead.celular ?? "—"}</Td>
      <Td>{lead.sede ?? "—"}</Td>
      <Td>{lead.turno ?? "—"}</Td>
      <Td>{lead.dia ?? "—"}</Td>
      <Td>{lead.seguidora == null ? "—" : lead.seguidora ? "Sí" : "No"}</Td>
      <Td>
        <select
          value={atendido}
          onChange={(e) => {
            setAtendido(e.target.value);
            patch("atendido", e.target.value);
          }}
          className={`rounded border px-2 py-1 text-xs ${
            atendido === "Atendido"
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-amber-300 bg-amber-50 text-amber-800"
          }`}
        >
          <option value="Atendido">Atendido</option>
          <option value="No Atendido">No Atendido</option>
        </select>
        {saving === "atendido" && (
          <span className="ml-2 text-[10px] text-neutral-500">guardando…</span>
        )}
      </Td>
      <Td>
        <input
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          onBlur={() => {
            if ((lead.observacion ?? "") !== observacion) {
              patch("observacion", observacion);
            }
          }}
          placeholder="—"
          className="w-56 rounded border border-neutral-200 px-2 py-1 text-xs focus:border-berry focus:outline-none"
        />
        {saving === "observacion" && (
          <span className="ml-2 text-[10px] text-neutral-500">guardando…</span>
        )}
      </Td>
    </tr>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-4 shadow-sm ${
        accent ? "bg-berry text-white" : "bg-white"
      }`}
    >
      <div
        className={`text-xs uppercase tracking-wide ${
          accent ? "text-white/80" : "text-neutral-500"
        }`}
      >
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-2">{children}</td>;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
