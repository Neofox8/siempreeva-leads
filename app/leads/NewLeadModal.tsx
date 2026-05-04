"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ESTADO_LABELS, ORIGEN_LABELS, ORIGEN_OPTIONS } from "@/lib/enums";
import type { EstadoLead } from "@/types/lead";

const SEDES = ["San Miguel", "Miraflores"];
const TURNOS = ["Mañana", "Tarde", "Noche"];

type DuplicateField = "celular" | "usuario";

type DuplicateLead = {
  id: string;
  nombre: string | null;
  atendido: EstadoLead;
  fecha: string;
};

export default function NewLeadModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<
    | { lead: DuplicateLead; field: DuplicateField }
    | null
  >(null);
  // Valores que el usuario ya decidió ignorar ("Registrar de todas formas"),
  // para no mostrarle el mismo aviso cada vez que vuelva a hacer blur.
  const dismissedRef = useRef<{ celular: Set<string>; usuario: Set<string> }>({
    celular: new Set(),
    usuario: new Set(),
  });

  async function checkDuplicate(field: DuplicateField, raw: string) {
    const value = raw.trim();
    console.log("[dup-check] blur", { field, value });
    if (!value) return;
    if (dismissedRef.current[field].has(value)) {
      console.log("[dup-check] dismissed previously, skipping", { field, value });
      return;
    }
    try {
      const res = await fetch(
        `/api/leads/check-duplicate?field=${field}&value=${encodeURIComponent(value)}`,
        { method: "GET" }
      );
      const j = await res.json().catch(() => ({}));
      console.log("[dup-check] response", { status: res.status, body: j });
      if (!res.ok || !j.ok) return;
      if (j.duplicate) {
        setDuplicate({ lead: j.duplicate as DuplicateLead, field });
      }
    } catch (err) {
      console.error("[dup-check] network error", err);
    }
  }

  function dismissDuplicate() {
    if (duplicate) {
      // Recordamos el valor exacto del campo para no volver a avisar.
      const inputName = duplicate.field;
      const formEl = document.querySelector<HTMLFormElement>(
        "form[data-new-lead-form]"
      );
      const inputEl = formEl?.elements.namedItem(inputName) as
        | HTMLInputElement
        | null;
      const v = inputEl?.value.trim();
      if (v) dismissedRef.current[duplicate.field].add(v);
    }
    setDuplicate(null);
  }

  function goToExistingLead() {
    if (!duplicate) return;
    const params = new URLSearchParams();
    if (duplicate.lead.nombre) params.set("q", duplicate.lead.nombre);
    router.push(params.toString() ? `/leads?${params}` : "/leads");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const numSeg = String(fd.get("num_seguidores") ?? "").trim();
    const payload = {
      nombre: String(fd.get("nombre") ?? "").trim(),
      celular: String(fd.get("celular") ?? "").trim() || null,
      usuario: String(fd.get("usuario") ?? "").trim() || null,
      num_seguidores: numSeg === "" ? null : parseInt(numSeg, 10),
      sede: String(fd.get("sede") ?? "") || null,
      fuente: String(fd.get("fuente") ?? "") || "instagram_manychat",
      seguidora: fd.get("seguidora") === "on",
      turno: String(fd.get("turno") ?? "") || null,
      dia: String(fd.get("dia") ?? "").trim() || null,
      observacion: String(fd.get("observacion") ?? "").trim() || null,
    };

    if (!payload.nombre) {
      setError("El nombre es obligatorio.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        setError(j.error ?? `Error ${res.status}`);
        return;
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-eva">Nuevo lead</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-800"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          data-new-lead-form
          className="grid grid-cols-2 gap-3"
        >
          <Field label="Nombre *" full>
            <input
              name="nombre"
              required
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-eva focus:outline-none"
            />
          </Field>

          <Field label="Celular">
            <input
              name="celular"
              onBlur={(e) => checkDuplicate("celular", e.currentTarget.value)}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-eva focus:outline-none"
            />
          </Field>

          <Field label="Usuario (Instagram)">
            <input
              name="usuario"
              placeholder="@handle"
              onBlur={(e) => checkDuplicate("usuario", e.currentTarget.value)}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-eva focus:outline-none"
            />
          </Field>

          <Field label="Seguidores">
            <input
              name="num_seguidores"
              type="number"
              min={0}
              placeholder="Ej: 1500"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-eva focus:outline-none"
            />
          </Field>

          <Field label="Sede">
            <select
              name="sede"
              defaultValue=""
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-eva focus:outline-none"
            >
              <option value="">—</option>
              {SEDES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Fuente">
            <select
              name="fuente"
              defaultValue="instagram_manychat"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-eva focus:outline-none"
            >
              {ORIGEN_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {ORIGEN_LABELS[v]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Turno">
            <select
              name="turno"
              defaultValue=""
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-eva focus:outline-none"
            >
              <option value="">—</option>
              {TURNOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Día">
            <input
              name="dia"
              placeholder="Ej: Lunes 12/05"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-eva focus:outline-none"
            />
          </Field>

          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="seguidora" className="accent-eva" />
            <span>Es seguidora</span>
          </label>

          <Field label="Observación" full>
            <textarea
              name="observacion"
              rows={3}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-eva focus:outline-none"
            />
          </Field>

          {error && (
            <p className="col-span-2 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-eva px-4 py-2 text-sm font-semibold text-white hover:bg-eva-dark disabled:opacity-60"
            >
              {submitting ? "Guardando…" : "Guardar lead"}
            </button>
          </div>
        </form>
      </div>

      {duplicate && (
        <DuplicateWarning
          lead={duplicate.lead}
          field={duplicate.field}
          onDismiss={dismissDuplicate}
          onGoToExisting={goToExistingLead}
        />
      )}
    </div>
  );
}

function DuplicateWarning({
  lead,
  field,
  onDismiss,
  onGoToExisting,
}: {
  lead: DuplicateLead;
  field: DuplicateField;
  onDismiss: () => void;
  onGoToExisting: () => void;
}) {
  const fieldLabel = field === "celular" ? "celular" : "usuario de Instagram";
  const estadoLabel = ESTADO_LABELS[lead.atendido] ?? lead.atendido;
  const dias = daysSince(lead.fecha);
  const diasLabel =
    dias === 0
      ? "hoy"
      : dias === 1
        ? "hace 1 día"
        : `hace ${dias} días`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        e.stopPropagation();
        onDismiss();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg text-amber-700">
            !
          </div>
          <div>
            <h3 className="text-lg font-bold text-eva">
              Posible duplicado detectado
            </h3>
            <p className="text-xs text-neutral-500">
              Ya existe un lead con el mismo {fieldLabel}.
            </p>
          </div>
        </div>

        <dl className="mb-5 space-y-1.5 rounded-lg bg-neutral-50 px-4 py-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Nombre</dt>
            <dd className="font-medium text-neutral-800">
              {lead.nombre ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Estado</dt>
            <dd className="font-medium text-neutral-800">{estadoLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Ingresó</dt>
            <dd className="font-medium text-neutral-800">{diasLabel}</dd>
          </div>
        </dl>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
          >
            Registrar de todas formas
          </button>
          <button
            type="button"
            onClick={onGoToExisting}
            className="rounded bg-eva px-4 py-2 text-sm font-semibold text-white hover:bg-eva-dark"
          >
            Ver lead existente
          </button>
        </div>
      </div>
    </div>
  );
}

function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 0;
  const diffMs = Date.now() - then;
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "col-span-2" : ""}`}>
      <span className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  );
}
