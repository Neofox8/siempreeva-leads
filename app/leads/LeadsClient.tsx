"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import type { EstadoLead, Lead, SesionUsuario } from "@/types/lead";
import {
  ESTADO_COLORS,
  ESTADO_LABELS,
  ESTADO_OPTIONS,
  ORIGEN_LABELS,
  ORIGEN_OPTIONS,
} from "@/lib/enums";
import { supabaseBrowser } from "@/lib/supabase/client";
import { signOutAction } from "@/app/login/actions";
import NewLeadModal from "./NewLeadModal";

const POLL_INTERVAL_MS = 30_000;

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

type Opt = { value: string; label: string };

const SEDE_OPTIONS: string[] = ["San Miguel", "Miraflores"];
const TURNO_OPTIONS: string[] = ["Mañana", "Tarde", "Noche"];

const FUENTE_OPTS: Opt[] = ORIGEN_OPTIONS.map((v) => ({
  value: v,
  label: ORIGEN_LABELS[v],
}));

export default function LeadsClient({
  sesion,
  leads,
  error,
  stats,
  filters,
}: {
  sesion: SesionUsuario;
  leads: Lead[];
  error: string | null;
  stats: Stats;
  filters: Filters;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(() => Date.now());
  const pollIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAdmin = sesion.rol === "admin";

  const doRefresh = useCallback(() => {
    try {
      router.refresh();
      setLastRefresh(Date.now());
    } catch (err) {
      console.error("[leads] refresh failed silently:", err);
    }
  }, [router]);

  // Auto-refresh: realtime sobre `leads` (push instantáneo en INSERT) +
  // polling cada 30s como red de seguridad si realtime no está habilitado
  // o el socket cae. Pausa cuando la pestaña pasa a background y reanuda
  // con un refresh inmediato cuando vuelve a estar visible.
  useEffect(() => {
    const supabase = supabaseBrowser();

    const channel = supabase
      .channel("leads-dashboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        () => doRefresh()
      )
      .subscribe();

    const startPolling = () => {
      if (pollIdRef.current !== null) return;
      pollIdRef.current = setInterval(doRefresh, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (pollIdRef.current !== null) {
        clearInterval(pollIdRef.current);
        pollIdRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        doRefresh();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === "visible") {
      startPolling();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      supabase.removeChannel(channel);
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [doRefresh]);

  const handleManualRefresh = useCallback(() => {
    doRefresh();
    // Resetear el ciclo de 30s para que el próximo poll automático
    // se mida desde este click, no desde el último tick del interval.
    if (pollIdRef.current !== null) {
      clearInterval(pollIdRef.current);
      pollIdRef.current = setInterval(doRefresh, POLL_INTERVAL_MS);
    }
  }, [doRefresh]);

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
    <div className="px-6 py-8">
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-berry">Siempre Eva — Leads</h1>
            <p className="text-sm text-neutral-600">
              Gestión y seguimiento de leads desde ManyChat
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <div className="text-xs text-neutral-600">
              <div className="font-medium text-neutral-800">
                {sesion.nombre ?? sesion.email ?? "Usuario"}
              </div>
              <div>
                <span className="rounded bg-berry/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-berry">
                  {sesion.rol}
                </span>
              </div>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded border border-berry px-3 py-1 text-xs text-berry hover:bg-berry hover:text-white"
              >
                Cerrar sesión
              </button>
            </form>
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
            {SEDE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Atendido">
          <select
            value={filters.atendido}
            onChange={(e) => updateParam("atendido", e.target.value)}
            className="rounded border border-neutral-300 px-3 py-2 text-sm focus:border-berry focus:outline-none"
          >
            <option value="">Todos</option>
            {ESTADO_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {ESTADO_LABELS[v]}
              </option>
            ))}
          </select>
        </Field>

        {(filters.sede || filters.atendido || filters.q) && (
          <button
            onClick={() => {
              startTransition(() => router.replace("/leads"));
            }}
            className="rounded border border-berry px-3 py-2 text-sm text-berry hover:bg-berry hover:text-white"
          >
            Limpiar filtros
          </button>
        )}

        {isPending && (
          <span className="text-xs text-neutral-500">Actualizando…</span>
        )}

        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="ml-auto rounded bg-berry px-4 py-2 text-sm font-semibold text-white hover:bg-berry/90"
          >
            + Nuevo lead
          </button>
        )}
      </section>

      <LastRefreshIndicator
        lastRefresh={lastRefresh}
        onManualRefresh={handleManualRefresh}
      />

      {error && (
        <div className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
          Error: {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full table-fixed divide-y divide-neutral-200 text-xs">
          <thead className="bg-crema text-left text-xs text-neutral-600">
            <tr>
              <Th width="w-[90px]">Fecha</Th>
              <Th width="w-[130px]">Nombre</Th>
              <Th width="w-[100px]">Usuario</Th>
              <Th width="w-[90px]">Seguidores</Th>
              <Th width="w-[110px]">Celular</Th>
              <Th width="w-[100px]">Sede</Th>
              <Th width="w-[90px]">Turno</Th>
              <Th width="w-[70px]">Día</Th>
              <Th width="w-[120px]">Fuente</Th>
              <Th width="w-[60px]">Seg.</Th>
              <Th width="w-[130px]">Atendido</Th>
              <Th width="min-w-[140px]">Observación</Th>
              {isAdmin && <Th width="w-[70px]">{""}</Th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 13 : 12}
                  className="px-2 py-10 text-center text-neutral-500"
                >
                  No hay leads para los filtros aplicados.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <Row key={lead.id} lead={lead} isAdmin={isAdmin} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <NewLeadModal
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Row({ lead, isAdmin }: { lead: Lead; isAdmin: boolean }) {
  const router = useRouter();
  const [atendido, setAtendido] = useState<EstadoLead>(lead.atendido);
  const [observacion, setObservacion] = useState(lead.observacion ?? "");
  const [saving, setSaving] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function patch(field: string, value: unknown) {
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

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`Error eliminando: ${j.error ?? res.status}`);
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const atendidoColor =
    ESTADO_COLORS[atendido] ?? ESTADO_COLORS.no_atendido;

  const fechaShort = formatDate(lead.fecha);
  const fechaFull = formatDateFull(lead.creado_en);

  const seguidoresStr =
    lead.num_seguidores == null
      ? "—"
      : lead.num_seguidores.toLocaleString("es-PE");

  return (
    <tr className="hover:bg-crema/40">
      <Td>
        <span
          title={fechaFull}
          style={{ borderBottom: "1px dotted #aaa", cursor: "default" }}
        >
          {fechaShort}
        </span>
      </Td>
      <Td title={lead.nombre ?? undefined}>
        <AdminText
          isAdmin={isAdmin}
          initial={lead.nombre}
          onSave={(v) => patch("nombre", v)}
          saving={saving === "nombre"}
        />
      </Td>
      <Td title={lead.usuario ?? undefined}>
        <AdminText
          isAdmin={isAdmin}
          initial={lead.usuario}
          onSave={(v) => patch("usuario", v)}
          saving={saving === "usuario"}
        />
      </Td>
      <Td title={seguidoresStr}>
        <AdminNumber
          isAdmin={isAdmin}
          initial={lead.num_seguidores}
          onSave={(v) => patch("num_seguidores", v)}
          saving={saving === "num_seguidores"}
        />
      </Td>
      <Td title={lead.celular ?? undefined}>
        <AdminText
          isAdmin={isAdmin}
          initial={lead.celular}
          onSave={(v) => patch("celular", v)}
          saving={saving === "celular"}
        />
      </Td>
      <Td title={lead.sede ?? undefined}>
        <AdminSelect
          isAdmin={isAdmin}
          initial={lead.sede}
          options={SEDE_OPTIONS.map((s) => ({ value: s, label: s }))}
          onSave={(v) => patch("sede", v)}
          saving={saving === "sede"}
        />
      </Td>
      <Td title={lead.turno ?? undefined}>
        <AdminSelect
          isAdmin={isAdmin}
          initial={lead.turno}
          options={TURNO_OPTIONS.map((t) => ({ value: t, label: t }))}
          onSave={(v) => patch("turno", v)}
          saving={saving === "turno"}
        />
      </Td>
      <Td title={lead.dia ?? undefined}>
        <AdminText
          isAdmin={isAdmin}
          initial={lead.dia}
          onSave={(v) => patch("dia", v)}
          saving={saving === "dia"}
        />
      </Td>
      <Td title={lead.fuente ? ORIGEN_LABELS[lead.fuente] : undefined}>
        <AdminSelect
          isAdmin={isAdmin}
          initial={lead.fuente}
          options={FUENTE_OPTS}
          onSave={(v) => patch("fuente", v)}
          saving={saving === "fuente"}
        />
      </Td>
      <Td>{lead.seguidora == null ? "—" : lead.seguidora ? "Sí" : "No"}</Td>
      <Td title={ESTADO_LABELS[atendido]}>
        <div className="flex items-center gap-1">
          <select
            value={atendido}
            onChange={(e) => {
              const v = e.target.value as EstadoLead;
              setAtendido(v);
              patch("atendido", v);
            }}
            className={`min-w-0 flex-1 rounded border px-2 py-1 text-xs ${atendidoColor}`}
          >
            {ESTADO_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {ESTADO_LABELS[v]}
              </option>
            ))}
          </select>
          {saving === "atendido" && (
            <span className="shrink-0 text-[10px] text-neutral-500">…</span>
          )}
        </div>
      </Td>
      <Td title={observacion || undefined}>
        <div className="flex items-center gap-1">
          <input
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            onBlur={() => {
              if ((lead.observacion ?? "") !== observacion) {
                patch("observacion", observacion);
              }
            }}
            placeholder="—"
            className="min-w-0 flex-1 rounded border border-neutral-200 px-2 py-1 text-xs focus:border-berry focus:outline-none"
          />
          {saving === "observacion" && (
            <span className="shrink-0 text-[10px] text-neutral-500">…</span>
          )}
        </div>
      </Td>
      {isAdmin && (
        <td className="px-2 py-1 align-middle">
          <div className="relative inline-block">
            {confirmDelete ? (
              <div className="absolute right-0 top-1/2 z-20 flex -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-md bg-white px-2 py-1 shadow-md ring-1 ring-neutral-200">
                <span className="text-[11px] text-neutral-700">¿Confirmar?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? "…" : "Sí"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="text-neutral-500 hover:text-neutral-800"
                  aria-label="Cancelar"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-base leading-none text-neutral-400 hover:text-red-600"
                aria-label="Eliminar lead"
                title="Eliminar"
              >
                ×
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

function AdminText({
  isAdmin,
  initial,
  onSave,
  saving,
}: {
  isAdmin: boolean;
  initial: string | null;
  onSave: (value: string | null) => void;
  saving: boolean;
}) {
  const [val, setVal] = useState(initial ?? "");
  if (!isAdmin) return <>{initial ?? "—"}</>;
  return (
    <div className="flex items-center gap-1">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          const next = val.trim() === "" ? null : val;
          if ((initial ?? null) !== next) onSave(next);
        }}
        className="min-w-0 flex-1 rounded border border-neutral-200 px-2 py-1 text-xs focus:border-berry focus:outline-none"
      />
      {saving && <span className="shrink-0 text-[10px] text-neutral-500">…</span>}
    </div>
  );
}

function AdminNumber({
  isAdmin,
  initial,
  onSave,
  saving,
}: {
  isAdmin: boolean;
  initial: number | null;
  onSave: (value: number | null) => void;
  saving: boolean;
}) {
  const [val, setVal] = useState(initial == null ? "" : String(initial));
  if (!isAdmin) {
    return (
      <>{initial == null ? "—" : initial.toLocaleString("es-PE")}</>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          const trimmed = val.trim();
          let next: number | null;
          if (trimmed === "") {
            next = null;
          } else {
            const n = parseInt(trimmed, 10);
            next = Number.isFinite(n) ? n : null;
          }
          if ((initial ?? null) !== next) onSave(next);
        }}
        className="min-w-0 flex-1 rounded border border-neutral-200 px-1 py-0.5 text-xs focus:border-berry focus:outline-none"
      />
      {saving && <span className="shrink-0 text-[10px] text-neutral-500">…</span>}
    </div>
  );
}

function AdminSelect({
  isAdmin,
  initial,
  options,
  onSave,
  saving,
}: {
  isAdmin: boolean;
  initial: string | null;
  options: Opt[];
  onSave: (value: string | null) => void;
  saving: boolean;
}) {
  const currentLabel =
    options.find((o) => o.value === (initial ?? ""))?.label ?? initial ?? "—";

  if (!isAdmin) return <>{currentLabel}</>;

  const optsWithEmpty: Opt[] =
    options.some((o) => o.value === "")
      ? options
      : [{ value: "", label: "—" }, ...options];

  return (
    <div className="flex items-center gap-1">
      <select
        value={initial ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onSave(v === "" ? null : v);
        }}
        className="min-w-0 flex-1 rounded border border-neutral-200 px-2 py-1 text-xs focus:border-berry focus:outline-none"
      >
        {optsWithEmpty.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {saving && <span className="shrink-0 text-[10px] text-neutral-500">…</span>}
    </div>
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

function Th({
  children,
  width,
}: {
  children: React.ReactNode;
  width: string;
}) {
  return (
    <th className={`truncate px-3 py-1 font-medium ${width}`}>{children}</th>
  );
}

function Td({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <td title={title} className="truncate px-2 py-1 align-middle">
      {children}
    </td>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDateFull(iso: string) {
  try {
    const fmt = new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(new Date(iso));
    const get = (t: Intl.DateTimeFormatPartTypes): string =>
      parts.find((p) => p.type === t)?.value ?? "";
    const day = get("day");
    const month = get("month");
    const year = get("year");
    let hour = get("hour");
    if (hour === "24") hour = "00";
    const minute = get("minute");
    return `${day}/${month}/${year} · ${hour}:${minute}`;
  } catch {
    return iso;
  }
}

function formatAgo(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 5) return "Actualizado hace un momento";
  if (sec < 60) return `Actualizado hace ${sec} segundos`;
  const min = Math.floor(sec / 60);
  if (min === 1) return "Actualizado hace 1 minuto";
  if (min < 60) return `Actualizado hace ${min} minutos`;
  const hr = Math.floor(min / 60);
  if (hr === 1) return "Actualizado hace 1 hora";
  return `Actualizado hace ${hr} horas`;
}

function RefreshIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

// Aislado en su propio componente: el tick de "now" cada 1s sólo re-renderiza
// este nodo, no toda la tabla con sus N filas editables.
function LastRefreshIndicator({
  lastRefresh,
  onManualRefresh,
}: {
  lastRefresh: number;
  onManualRefresh: () => void;
}) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mb-2 flex items-center justify-end gap-2 text-xs text-neutral-500">
      <span>{formatAgo(now - lastRefresh)}</span>
      <button
        type="button"
        onClick={onManualRefresh}
        aria-label="Refrescar ahora"
        title="Refrescar ahora"
        className="rounded p-1 text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-800"
      >
        <RefreshIcon />
      </button>
    </div>
  );
}
