import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");

export function supabaseAdmin() {
  if (!serviceRoleKey) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function supabaseServer() {
  if (!anonKey) throw new Error("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url!, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
