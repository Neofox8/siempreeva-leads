import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSesion } from "@/lib/auth";
import type { EstadoLead } from "@/types/lead";

export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = new Set(["celular", "usuario"]);

// Estados terminales: si el lead existente está en uno de estos, no avisamos
// del duplicado porque ya está cerrado y se puede volver a registrar.
const ESTADOS_TERMINALES: EstadoLead[] = ["descartado", "no_compro", "paciente"];

export async function GET(req: NextRequest) {
  const sesion = await getSesion();
  if (!sesion) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const field = searchParams.get("field") ?? "";
  const value = (searchParams.get("value") ?? "").trim();

  if (!ALLOWED_FIELDS.has(field)) {
    return NextResponse.json({ ok: false, error: "Campo inválido" }, { status: 400 });
  }
  if (!value) {
    return NextResponse.json({ ok: true, duplicate: null });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("leads")
    .select("id, nombre, atendido, fecha")
    .eq(field, value)
    .not("atendido", "in", `(${ESTADOS_TERMINALES.join(",")})`)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, duplicate: data ?? null });
}
