"use server";

import { redirect } from "next/navigation";
import { localeFrom, localeQuery } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

function partnerLoginUrl(
  lang: ReturnType<typeof localeFrom>,
  key: "error" | "message",
  message: string,
) {
  const q = localeQuery(lang);
  return `/partner/login${q ? `${q}&` : "?"}${key}=${encodeURIComponent(message)}`;
}

export async function partnerLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const q = localeQuery(lang);

  if (!email || !password) {
    redirect(
      partnerLoginUrl(
        lang,
        "error",
        lang === "uk"
          ? "Вкажіть email і пароль."
          : "Email and password are required.",
      ),
    );
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
    redirect(partnerLoginUrl(lang, "error", message));
  }

  const { data: superseded, error: supersededError } = await supabase.rpc(
    "current_account_superseded",
  );

  if (!supersededError && superseded) {
    await supabase.auth.signOut();
    redirect(
      partnerLoginUrl(
        lang,
        "error",
        lang === "uk"
          ? "Цей обліковий запис було консолідовано. Увійдіть через збережений обліковий запис або зверніться до адміністратора CraftID."
          : "This login account was consolidated. Sign in with the retained account or contact the CraftID administrator.",
      ),
    );
  }

  const { data: partnerOrganisations, error: partnerError } = await supabase.rpc(
    "current_partner_organisations",
  );

  if (
    partnerError ||
    !Array.isArray(partnerOrganisations) ||
    partnerOrganisations.length === 0
  ) {
    await supabase.auth.signOut();
    redirect(
      partnerLoginUrl(
        lang,
        "error",
        lang === "uk"
          ? "Цей email не має призначеного партнерського доступу CraftID. Зверніться до адміністратора CraftID."
          : "This email does not have assigned CraftID partner access. Contact the CraftID administrator.",
      ),
    );
  }

  const { data: mustChangePassword } = await supabase.rpc(
    "current_partner_password_change_required",
  );

  if (mustChangePassword) {
    redirect(`/partner/password${q}`);
  }

  redirect(`/partner${q}`);
}

export async function partnerRegister(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const q = localeQuery(lang);

  const errorUrl = (message: string) =>
    `/partner/register${q ? `${q}&` : "?"}error=${encodeURIComponent(message)}`;

  if (!email || !password) {
    redirect(
      errorUrl(
        lang === "uk"
          ? "Вкажіть email і пароль."
          : "Email and password are required.",
      ),
    );
  }

  if (password.length < 8) {
    redirect(
      errorUrl(
        lang === "uk"
          ? "Пароль має містити щонайменше 8 символів."
          : "Password must be at least 8 characters.",
      ),
    );
  }

  if (password !== confirmPassword) {
    redirect(
      errorUrl(
        lang === "uk" ? "Паролі не збігаються." : "Passwords do not match.",
      ),
    );
  }

  const destination = `/partner${q}`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}auth/callback?next=${encodeURIComponent(
        destination,
      )}`,
    },
  });

  if (error) {
    redirect(errorUrl(error.message));
  }

  if (data.session) {
    const { data: partnerOrganisations } = await supabase.rpc(
      "current_partner_organisations",
    );

    if (Array.isArray(partnerOrganisations) && partnerOrganisations.length) {
      redirect(destination);
    }

    await supabase.auth.signOut();
    redirect(
      partnerLoginUrl(
        lang,
        "error",
        lang === "uk"
          ? "Обліковий запис створено, але цей email ще не має партнерського доступу. Зверніться до адміністратора CraftID."
          : "The account was created, but this email does not yet have partner access. Contact the CraftID administrator.",
      ),
    );
  }

  redirect(
    partnerLoginUrl(
      lang,
      "message",
      lang === "uk"
        ? "Перевірте email і підтвердіть партнерський обліковий запис. Після підтвердження ви будете перенаправлені до Partner Workspace."
        : "Check your email and confirm your partner account. After confirmation you will be redirected to the Partner Workspace.",
    ),
  );
}

export async function partnerResendConfirmation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const q = localeQuery(lang);

  if (!email) {
    redirect(
      partnerLoginUrl(
        lang,
        "error",
        lang === "uk"
          ? "Вкажіть email для повторного надсилання."
          : "Enter your email to resend confirmation.",
      ),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${getSiteUrl()}auth/callback?next=${encodeURIComponent(
        `/partner${q}`,
      )}`,
    },
  });

  if (error) {
    redirect(partnerLoginUrl(lang, "error", error.message));
  }

  redirect(
    partnerLoginUrl(
      lang,
      "message",
      lang === "uk"
        ? "Якщо цей email належить непідтвердженому обліковому запису, нове посилання підтвердження було запитано. Перевірте також Spam."
        : "If this email belongs to an unconfirmed account, a new confirmation link was requested. Also check Spam.",
    ),
  );
}

export async function partnerLogout(formData?: FormData) {
  const lang = localeFrom(String(formData?.get("lang") ?? "en"));
  const q = localeQuery(lang);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/partner/login${q}`);
}


export async function changePartnerPassword(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const q = localeQuery(lang);
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const errorUrl = (message: string) =>
    `/partner/password${q ? `${q}&` : "?"}error=${encodeURIComponent(message)}`;

  if (password.length < 12) {
    redirect(
      errorUrl(
        lang === "uk"
          ? "Новий пароль має містити щонайменше 12 символів."
          : "Your new password must be at least 12 characters.",
      ),
    );
  }

  if (password !== confirmPassword) {
    redirect(
      errorUrl(
        lang === "uk" ? "Паролі не збігаються." : "Passwords do not match.",
      ),
    );
  }

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();

  if (!userResult.user) {
    redirect(`/partner/login${q}`);
  }

  const { data: partnerOrganisations } = await supabase.rpc(
    "current_partner_organisations",
  );

  if (!Array.isArray(partnerOrganisations) || !partnerOrganisations.length) {
    redirect(
      errorUrl(
        lang === "uk"
          ? "Партнерський доступ для цього облікового запису не знайдено."
          : "Partner access was not found for this account.",
      ),
    );
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password });

  if (passwordError) {
    redirect(errorUrl(passwordError.message));
  }

  const { error: markError } = await supabase.rpc(
    "mark_current_partner_password_changed",
  );

  if (markError) {
    redirect(errorUrl(markError.message));
  }

  redirect(
    `/partner${q ? `${q}&` : "?"}message=password-changed`,
  );
}
