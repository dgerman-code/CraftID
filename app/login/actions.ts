"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    redirect(`/login${q ? `${q}&` : "?"}error=${encodeURIComponent(error.message)}`);
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
