"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const allowedIndicators = new Set([
  "skill.usage_intensity",
  "skill.practice_status",
  "skill.years_band",
  "skill.production_archetype",
  "skill.digital_design_intensity",
  "skill.digital_fabrication_intensity",
  "skill.repair_restoration_role",
  "skill.commercial_relevance",
  "skill.apprenticeship_capacity",
  "skill.successor_status",
  "skill.teaching_capacity",
]);

export async function saveSkillProfile(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const q = lang === "uk" ? "?lang=uk" : "";
  const claimId = String(formData.get("claimId") ?? "").trim();

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect(`/login${q}`);

  const { data: claim } = await supabase
    .from("claims")
    .select("id, entity_id, taxonomy_term_id, claim_type")
    .eq("id", claimId)
    .eq("claim_type", "skill")
    .single();

  if (!claim) redirect(`/my-craftid/claims${q}`);

  const { data: entity } = await supabase
    .from("craftid_entities")
    .select("id")
    .eq("id", claim.entity_id)
    .eq("owner_user_id", userId)
    .single();

  if (!entity) redirect(`/my-craftid/claims${q}`);

  const entries = [...formData.entries()]
    .filter(([key, value]) => allowedIndicators.has(key) && String(value).trim())
    .map(([key, value]) => [key, String(value)] as const);

  if (!entries.length) {
    redirect(`/my-craftid/claims/${claimId}${q ? `${q}&` : "?"}error=${encodeURIComponent(
      lang === "uk" ? "Оберіть хоча б одну відповідь" : "Choose at least one answer",
    )}`);
  }

  const today = new Date().toISOString().slice(0, 10);

  for (const [indicatorKey, value] of entries) {
    await supabase
      .from("observations")
      .update({ valid_to: today })
      .eq("claim_id", claim.id)
      .eq("indicator_key", indicatorKey)
      .eq("provenance_status", "self_declared")
      .is("valid_to", null);

    const { error } = await supabase.from("observations").insert({
      entity_id: claim.entity_id,
      claim_id: claim.id,
      taxonomy_term_id: claim.taxonomy_term_id,
      indicator_key: indicatorKey,
      value,
      provenance_status: "self_declared",
      visibility: "aggregate_only",
      valid_from: today,
    });

    if (error) {
      redirect(`/my-craftid/claims/${claimId}${q ? `${q}&` : "?"}error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath(`/my-craftid/claims/${claimId}`);
  revalidatePath("/my-craftid/claims");
  redirect(`/my-craftid/claims/${claimId}${q ? `${q}&` : "?"}message=saved`);
}
