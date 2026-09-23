"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";

export async function saveSupportProfile(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const entityId = String(formData.get("entityId") ?? "").trim();

  const { supabase, userId, entity } = await getOwnedCraftId(entityId);
  if (!userId) redirect(lang === "uk" ? "/login?lang=uk" : "/login");
  if (!entity) redirect(lang === "uk" ? "/my-craftid?lang=uk" : "/my-craftid");

  const q = ownerWorkspaceQuery(lang, entity.id);
  const { data: categories, error: taxonomyError } = await supabase
    .from("support_interest_taxonomy")
    .select("code")
    .eq("is_active", true)
    .order("sort_order");

  if (taxonomyError) {
    redirect(`/my-craftid/support${q}&error=${encodeURIComponent(taxonomyError.message)}`);
  }

  const allowedLevels = new Set(["interested", "actively_looking"]);
  const interests = (categories ?? []).flatMap((category) => {
    const level = String(formData.get(`level_${category.code}`) ?? "");
    if (!allowedLevels.has(level)) return [];

    const note = String(formData.get(`note_${category.code}`) ?? "").trim();
    if (note.length > 1000) {
      redirect(
        `/my-craftid/support${q}&error=${encodeURIComponent(
          lang === "uk"
            ? "Пояснення для кожної категорії має містити не більше 1000 символів."
            : "Each category note must be 1000 characters or fewer.",
        )}`,
      );
    }

    return [{ code: category.code, level, note: note || null }];
  });

  const { error } = await supabase.rpc("save_my_support_profile", {
    p_entity_id: entity.id,
    p_interests: interests,
    p_allow_relevant_contact: formData.get("allowRelevantContact") === "on",
  });

  if (error) {
    redirect(`/my-craftid/support${q}&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/my-craftid");
  revalidatePath("/my-craftid/support");
  revalidatePath("/admin/support");
  redirect(`/my-craftid/support${q}&message=saved`);
}
