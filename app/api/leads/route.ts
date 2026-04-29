import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendTelegram } from "@/lib/telegram";
import { ORIGEN_LABELS } from "@/lib/enums";
import type { OrigenLead } from "@/types/lead";

export const dynamic = "force-dynamic";

function toBool(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value == null) return null;
  const s = String(value).trim().toLowerCase();
  if (["true", "1", "si", "sí", "yes", "y"].includes(s)) return true;
  if (["false", "0", "no", "n"].includes(s)) return false;
  return null;
}

function clean(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const fuente = (clean(payload.fuente) ?? "instagram_manychat") as OrigenLead;

  const row = {
    nombre: clean(payload.nombre),
    usuario: clean(payload.usuario),
    celular: clean(payload.celular),
    sede: clean(payload.sede),
    seguidora: toBool(payload.seguidora),
    turno: clean(payload.turno),
    dia: clean(payload.dia),
    fuente,
    observacion: clean(payload.observacion),
    // `atendido` se omite a propósito: el default de la columna en Postgres es 'no_atendido'.
  };

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("leads")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const fuenteLabel = ORIGEN_LABELS[fuente] ?? fuente;
  const msg =
    `🆕 <b>Nuevo lead</b>: ${escapeHtml(row.nombre ?? "—")}` +
    ` | ${escapeHtml(row.sede ?? "—")}` +
    ` | ${escapeHtml(row.celular ?? "—")}` +
    ` | Fuente: ${escapeHtml(fuenteLabel)}`;
  await sendTelegram(msg);

  return NextResponse.json({ ok: true, id: data.id });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "siempreeva-leads" });
}
