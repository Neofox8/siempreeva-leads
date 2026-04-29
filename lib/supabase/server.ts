import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");

/** Cliente con service role: bypassa RLS. Solo en route handlers / server actions. */
export function supabaseAdmin() {
  if (!serviceRoleKey) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cliente anon-key sin sesión. Útil para llamadas server-side sin cookies. */
export function supabaseServer() {
  if (!anonKey) throw new Error("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url!, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cliente ligado a las cookies de la request — para server components, route handlers y server actions. */
export function supabaseRSC() {
  if (!anonKey) throw new Error("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const store = cookies();
  return createServerClient(url!, anonKey, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          store.set({ name, value, ...options });
        } catch {
          // Llamado desde un server component (read-only) — ignorar.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          store.set({ name, value: "", ...options });
        } catch {
          // ditto
        }
      },
    },
  });
}
