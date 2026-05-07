import { supabaseAdmin, supabaseRSC } from "@/lib/supabase/server";
import type { RolUsuario, SesionUsuario } from "@/types/lead";

export async function getSesion(): Promise<SesionUsuario | null> {
  const ssr = supabaseRSC();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user) return null;

  const admin = supabaseAdmin();
  const { data: perfil } = await admin
    .from("usuarios")
    .select("nombre, email, rol, activo, can_create_leads")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!perfil || perfil.activo === false) return null;

  const rol = perfil.rol as RolUsuario;

  return {
    id: user.id,
    email: perfil.email ?? user.email ?? null,
    nombre: perfil.nombre ?? null,
    rol,
    can_create_leads: perfil.can_create_leads === true,
  };
}
