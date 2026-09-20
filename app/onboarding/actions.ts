"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type EntityType = "professional" | "workshop";

export async function createCraftId(formData: FormData) {
  const entityType = String(formData.get("entityType") ?? "") as EntityType;
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const q = lang === "uk" ? "?lang=uk" : "";

  if (!["professional", "workshop"].includes(entityType)) {
    redirect(`/onboarding${q ? `${q}&` : "?"}error=Choose%20a%20valid%20profile%20type`);
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect(`/login${q}`);
  }

  const { data: existing } = await supabase
    .from("craftid_entities")
    .select("id")
    .eq("owner_user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    redirect(`/my-craftid${q}`);
  }

  const { data: entity, error: entityError } = await supabase
    .from("craftid_entities")
    .insert({ entity_type: entityType, owner_user_id: userId })
    .select("id")
    .single();

  if (entityError || !entity) {
    redirect(`/onboarding${q ? `${q}&` : "?"}error=${encodeURIComponent(entityError?.message ?? "Unable to create CraftID")}`);
  }

  const profileResult =
    entityType === "professional"
      ? await supabase.from("professional_profiles").insert({
          entity_id: entity.id,
          display_name: lang === "uk" ? "Новий професіонал" : "New professional",
        })
      : await supabase.from("workshop_profiles").insert({
          entity_id: entity.id,
          display_name: lang === "uk" ? "Нова майстерня" : "New workshop",
        });

  if (profileResult.error) {
    redirect(`/onboarding${q ? `${q}&` : "?"}error=${encodeURIComponent(profileResult.error.message)}`);
  }

  const { error: privacyError } = await supabase
    .from("privacy_settings")
    .insert({ entity_id: entity.id });

  if (privacyError) {
    redirect(`/onboarding${q ? `${q}&` : "?"}error=${encodeURIComponent(privacyError.message)}`);
  }

  redirect(`/my-craftid${q}`);
}
