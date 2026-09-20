"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveTaxonomyTerm(formData: FormData) {
  const idRaw = String(formData.get("id") ?? "").trim();
  const parentRaw = String(formData.get("parentId") ?? "").trim();
  const termType = String(formData.get("termType") ?? "").trim();
  const stableKey = String(formData.get("stableKey") ?? "").trim();
  const labelEn = String(formData.get("labelEn") ?? "").trim();
  const labelUk = String(formData.get("labelUk") ?? "").trim();
  const descriptionEn = String(formData.get("descriptionEn") ?? "").trim();
  const descriptionUk = String(formData.get("descriptionUk") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const isActive = String(formData.get("isActive") ?? "") === "on";

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_taxonomy_term", {
    p_id: idRaw || null,
    p_parent_id: parentRaw || null,
    p_term_type: termType,
    p_stable_key: stableKey,
    p_label_en: labelEn,
    p_label_uk: labelUk,
    p_description_en: descriptionEn,
    p_description_uk: descriptionUk,
    p_sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    p_is_active: isActive,
  });
  if (error) redirect(`/admin/taxonomy?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/taxonomy");
  redirect("/admin/taxonomy?message=saved");
}
