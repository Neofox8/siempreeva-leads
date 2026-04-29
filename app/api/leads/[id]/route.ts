import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EDITABLE_FIELDS = new Set(["atendido", "observacion", "observacion2"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (EDITABLE_FIELDS.has(k)) update[k] = v === "" ? null : v;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { ok: false, error: "Ningún campo editable" },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("leads").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
