"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { localeFrom, localeQuery } from "@/lib/i18n";

function accountUrl(lang: ReturnType<typeof localeFrom>, params: Record<string, string>) {
  const query = new URLSearchParams();
  const locale = localeQuery(lang);
  if (locale) query.set("lang", lang);
  for (const [key, value] of Object.entries(params)) query.set(key, value);
  return `/my-craftid/account?${query.toString()}`;
}

export async function requestAccountEmailChange(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const newEmail = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    redirect(accountUrl(lang, {
      error: lang === "uk" ? "Вкажіть коректну email-адресу" : "Enter a valid email address",
    }));
  }

  const supabase = await createClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  const user = userResult.user;

  if (userError || !user) {
    redirect(`/login${localeQuery(lang)}`);
  }

  const currentEmail = user.email?.trim().toLowerCase() ?? "";
  if (currentEmail === newEmail) {
    redirect(accountUrl(lang, {
      error: lang === "uk" ? "Це вже ваш поточний email" : "This is already your current email",
    }));
  }

  const nextPath = `/my-craftid/account${localeQuery(lang)}`;
  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    {
      emailRedirectTo: `${getSiteUrl()}auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  );

  if (error) {
    const lower = error.message.toLowerCase();
    const conflict =
      lower.includes("already") ||
      lower.includes("duplicate") ||
      lower.includes("linked to another craftid identity");

    redirect(accountUrl(lang, {
      error: conflict
        ? lang === "uk"
          ? "Цей email уже використовується або пов’язаний з іншим обліковим записом CraftID. Не створюйте новий CraftID — зверніться до адміністратора для перевірки."
          : "This email is already in use or linked to another CraftID account. Do not create a new CraftID; contact an administrator for an account-integrity review."
        : error.message,
    }));
  }

  redirect(accountUrl(lang, { message: "email-change-requested" }));
}
