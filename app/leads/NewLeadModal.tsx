"use client";

import { useState } from "react";
import { ORIGEN_LABELS, ORIGEN_OPTIONS } from "@/lib/enums";

const SEDES = ["San Miguel", "Miraflores"];
const TURNOS = ["Mañana", "Tarde", "Noche"];

export default function NewLeadModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      nombre: String(fd.get("nombre") ?? "").trim(),
      celular: String(fd.get("celular") ?? "").trim() || null,
      usuario: String(fd.get("usuario") ?? "").trim() || null,
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
          <h2 className="text-xl font-bold text-berry">Nuevo lead</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-800"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <Field label="Nombre *" full>
            <input
              name="nombre"
              required
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-berry focus:outline-none"
            />
          </Field>

          <Field label="Celular">
            <input
              name="celular"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-berry focus:outline-none"
            />
          </Field>

          <Field label="Usuario (Instagram)">
            <input
              name="usuario"
              placeholder="@handle"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-berry focus:outline-none"
            />
          </Field>

          <Field label="Sede">
            <select
              name="sede"
              defaultValue=""
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-berry focus:outline-none"
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
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-berry focus:outline-none"
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
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-berry focus:outline-none"
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
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-berry focus:outline-none"
            />
          </Field>

          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="seguidora" className="accent-berry" />
            <span>Es seguidora</span>
          </label>

          <Field label="Observación" full>
            <textarea
              name="observacion"
              rows={3}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-berry focus:outline-none"
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
              className="rounded bg-berry px-4 py-2 text-sm font-semibold text-white hover:bg-berry/90 disabled:opacity-60"
            >
              {submitting ? "Guardando…" : "Guardar lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
