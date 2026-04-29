import { supabaseAdmin } from "@/lib/supabase/server";
import type { Lead } from "@/types/lead";
import LeadsClient from "./LeadsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = {
  sede?: string;
  atendido?: string;
  q?: string;
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = supabaseAdmin();

  let query = supabase
    .from("leads")
    .select("*")
    .order("fecha", { ascending: false });

  if (searchParams.sede) query = query.eq("sede", searchParams.sede);
  if (searchParams.atendido) query = query.eq("atendido", searchParams.atendido);
  if (searchParams.q) query = query.ilike("nombre", `%${searchParams.q}%`);

  const { data: leads, error } = await query;

  // Stats globales (no filtradas) para el header.
  const [{ count: total }, { count: noAtendidos }, { count: sanMiguel }, { count: miraflores }] =
    await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("atendido", "No Atendido"),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("sede", "San Miguel"),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("sede", "Miraflores"),
    ]);

  return (
    <LeadsClient
      leads={(leads ?? []) as Lead[]}
      error={error?.message ?? null}
      stats={{
        total: total ?? 0,
        noAtendidos: noAtendidos ?? 0,
        sanMiguel: sanMiguel ?? 0,
        miraflores: miraflores ?? 0,
      }}
      filters={{
        sede: searchParams.sede ?? "",
        atendido: searchParams.atendido ?? "",
        q: searchParams.q ?? "",
      }}
    />
  );
}
