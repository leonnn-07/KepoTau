"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export type LoginState = { error?: string; email?: string };

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login")
    ? next
    : "/videos";
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured yet. Add the environment variables first.", email };
  }
  if (!email || !password) {
    return { error: "Enter your email and password.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message =
      error.code === "invalid_credentials"
        ? "Incorrect email or password."
        : error.code === "email_not_confirmed"
          ? "This email is not confirmed yet. Confirm the user in Supabase → Authentication → Users."
          : error.message;
    return { error: message, email };
  }

  redirect(safeNext(formData.get("next")));
}
