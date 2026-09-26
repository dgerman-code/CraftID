"use server";

import { redirect } from "next/navigation";
import { localeFrom, localeQuery } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const q = localeQuery(lang);

  const errorUrl = (message: string) =>
    `/signup${q ? `${q}&` : "?"}error=${encodeURIComponent(message)}`;

  if (!email || !password) {
    redirect(errorUrl("Email and password are required"));
  }

  if (password.length < 8) {
    redirect(errorUrl("Password must be at least 8 characters"));
  }

  if (password !== confirmPassword) {
    redirect(errorUrl("Passwords do not match"));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}auth/callback?next=${encodeURIComponent(`/onboarding${q}`)}`,
    },
  });

  if (error) {
    redirect(errorUrl(error.message));
  }

  if (data.session) {
    redirect(`/onboarding${q}`);
  }

  const message =
    lang === "uk"
      ? "Перевірте email, щоб підтвердити обліковий запис CraftID"
      : "Check your email to confirm your CraftID account";

  redirect(`/login${q ? `${q}&` : "?"}message=${encodeURIComponent(message)}`);
}
