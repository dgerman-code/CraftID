"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";

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
  const claimId = String(formData.get("claimId") ?? "").trim();
  const entityId = String(formData.get("entityId") ?? "").trim();
  const { supabase, userId, entity } = await getOwnedCraftId(entityId);
  if (!userId) redirect(lang === "uk" ? "/login?lang=uk" : "/login");
  if (!entity) redirect(lang === "uk" ? "/my-craftid?lang=uk" : "/my-craftid");
  const q = ownerWorkspaceQuery(lang, entity.id);

  const { data: claim } = await supabase
    .from("claims")
    .select("id, entity_id, taxonomy_term_id, claim_type")
    .eq("id", claimId)
    .eq("claim_type", "skill")
    .single();

  if (!claim) redirect(`/my-craftid/claims${q}`);

  if (claim.entity_id !== entity.id) redirect(`/my-craftid/claims${q}`);

  const entries = [...formData.entries()]
    .filter(([key, value]) => allowedIndicators.has(key) && String(value).trim())
    .map(([key, value]) => [key, String(value)] as const);

  if (!entries.length) {
    redirect(`/my-craftid/claims/${claimId}${q}&error=${encodeURIComponent(
      lang === "uk" ? "Оберіть хоча б одну відповідь" : "Choose at least one answer",
    )}`);
  }

  for (const [indicatorKey, value] of entries) {
    const { error } = await supabase.rpc("replace_self_declared_skill_observation", {
      p_claim_id: claim.id,
      p_indicator_key: indicatorKey,
      p_value: value,
    });

    if (error) {
      redirect(`/my-craftid/claims/${claimId}${q}&error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath(`/my-craftid/claims/${claimId}`);
  revalidatePath("/my-craftid/claims");
  redirect(`/my-craftid/claims/${claimId}${q}&message=saved`);
}
