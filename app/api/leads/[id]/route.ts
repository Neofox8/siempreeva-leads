import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSesion } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STAFF_FIELDS = new Set(["atendido", "observacion", "observacion2"]);
const ADMIN_FIELDS = new Set([
  ...STAFF_FIELDS,
  "nombre",
  "usuario",
  "celular",
  "sede",
  "turno",
  "dia",
  "fuente",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
  }

  // El middleware ya bloquea no autenticados; aquí necesitamos el rol.
  const sesion = await getSesion();
  if (!sesion) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const allowed = sesion.rol === "admin" ? ADMIN_FIELDS : STAFF_FIELDS;

  const update: Record<string, unknown> = {};
  const ignored: string[] = [];
  for (const [k, v] of Object.entries(body)) {
    if (allowed.has(k)) {
      update[k] = v === "" ? null : v;
    } else {
      ignored.push(k);
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { ok: false, error: "Ningún campo editable para tu rol", ignored },
      { status: 403 }
    );
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("leads").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ignored });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
  }

  const sesion = await getSesion();
  if (!sesion) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }
  if (sesion.rol !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Solo admins pueden eliminar leads" },
      { status: 403 }
    );
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("leads").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
