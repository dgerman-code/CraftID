"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const q = lang === "uk" ? "?lang=uk" : "";

  if (!email || !password) {
    redirect(`/login${q ? `${q}&` : "?"}error=Email%20and%20password%20are%20required`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? lang === "uk"
          ? "Email ще не підтверджено. Скористайтеся повторним надсиланням нижче."
          : "Email is not confirmed yet. Use the resend option below."
        : error.message;
    redirect(`/login${q ? `${q}&` : "?"}error=${encodeURIComponent(message)}`);
  }

  const { data: entity } = await supabase
    .from("craftid_entities")
    .select("id")
    .limit(1)
    .maybeSingle();

  redirect(entity ? `/my-craftid${q}` : `/onboarding${q}`);
}

export async function logout(formData?: FormData) {
  const lang = String(formData?.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const q = lang === "uk" ? "?lang=uk" : "";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${q}`);
}


export async function resendConfirmation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const q = lang === "uk" ? "?lang=uk" : "";

  if (!email) {
    redirect(`/login${q ? `${q}&` : "?"}error=${encodeURIComponent(
      lang === "uk" ? "Вкажіть email для повторного надсилання" : "Enter your email to resend confirmation",
    )}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${getSiteUrl()}auth/callback?next=${encodeURIComponent(`/onboarding${q}`)}`,
    },
  });

  if (error) {
    redirect(`/login${q ? `${q}&` : "?"}error=${encodeURIComponent(error.message)}`);
  }

  const message =
    lang === "uk"
      ? "Якщо цей email належить непідтвердженому обліковому запису, нове посилання підтвердження було запитано. Перевірте також Spam."
      : "If this email belongs to an unconfirmed account, a new confirmation link was requested. Also check Spam.";

  redirect(`/login${q ? `${q}&` : "?"}message=${encodeURIComponent(message)}`);
}
