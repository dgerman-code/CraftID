"use server";

import { redirect } from "next/navigation";
import { localeFrom, localeQuery } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { safeInternalPath } from "@/lib/safe-next";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const q = localeQuery(lang);
  const next = safeInternalPath(String(formData.get("next") ?? ""));

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

  const { data: superseded, error: supersededError } = await supabase.rpc(
    "current_account_superseded",
  );

  if (!supersededError && superseded) {
    await supabase.auth.signOut();
    const message =
      lang === "uk"
        ? "Цей обліковий запис було консолідовано після перевірки дублювання. Увійдіть через збережений обліковий запис CraftID або зверніться до адміністратора."
        : "This login account was consolidated after duplicate-account review. Sign in with the retained CraftID account or contact an administrator.";
    redirect(`/login${q ? `${q}&` : "?"}error=${encodeURIComponent(message)}`);
  }

  if (next) redirect(next);

  const [{ data: entity }, { data: partnerOrgs }] = await Promise.all([
    supabase.from("craftid_entities").select("id").limit(1).maybeSingle(),
    supabase.rpc("current_partner_organisations"),
  ]);

  if (entity) redirect(`/my-craftid${q}`);
  if (Array.isArray(partnerOrgs) && partnerOrgs.length) redirect(`/partner${q}`);
  redirect(`/onboarding${q}`);
}

export async function logout(formData?: FormData) {
  const lang = localeFrom(String(formData?.get("lang") ?? "en"));
  const q = localeQuery(lang);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${q}`);
}


export async function resendConfirmation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const q = localeQuery(lang);

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
