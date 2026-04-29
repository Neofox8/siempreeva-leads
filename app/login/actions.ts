"use server";

import { redirect } from "next/navigation";
import { supabaseRSC } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export async function signInAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/leads") || "/leads";

  if (!email || !password) {
    return { error: "Email y contraseña son obligatorios." };
  }

  const supabase = supabaseRSC();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo.startsWith("/") ? redirectTo : "/leads");
}

export async function signOutAction() {
  const supabase = supabaseRSC();
  await supabase.auth.signOut();
  redirect("/login");
}
