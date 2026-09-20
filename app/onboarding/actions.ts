"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type EntityType = "professional" | "workshop";

export async function createCraftId(formData: FormData) {
  const entityType = String(formData.get("entityType") ?? "") as EntityType;

  if (!["professional", "workshop"].includes(entityType)) {
    redirect("/onboarding?error=Choose%20a%20valid%20profile%20type");
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: existing } = await supabase
    .from("craftid_entities")
    .select("id")
    .eq("owner_user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    redirect("/my-craftid");
  }

  const { data: entity, error: entityError } = await supabase
    .from("craftid_entities")
    .insert({
      entity_type: entityType,
      owner_user_id: userId,
    })
    .select("id")
    .single();

  if (entityError || !entity) {
    redirect(
      `/onboarding?error=${encodeURIComponent(entityError?.message ?? "Unable to create CraftID")}`,
    );
  }

  const profileResult =
    entityType === "professional"
      ? await supabase.from("professional_profiles").insert({
          entity_id: entity.id,
          display_name: "New professional",
        })
      : await supabase.from("workshop_profiles").insert({
          entity_id: entity.id,
          display_name: "New workshop",
        });

  if (profileResult.error) {
    redirect(
      `/onboarding?error=${encodeURIComponent(profileResult.error.message)}`,
    );
  }

  const { error: privacyError } = await supabase.from("privacy_settings").insert({
    entity_id: entity.id,
  });

  if (privacyError) {
    redirect(
      `/onboarding?error=${encodeURIComponent(privacyError.message)}`,
    );
  }

  redirect("/my-craftid");
}
