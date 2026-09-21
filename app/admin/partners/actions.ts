"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const roles = new Set([
  "european_coordinator",
  "national_coordinating_partner",
  "sectoral_partner",
  "regional_partner",
  "vet_skills_partner",
  "knowledge_partner",
  "ecosystem_partner",
]);

const statuses = new Set(["invited", "in_discussion", "confirmed", "inactive"]);
const agreementStatuses = new Set(["none", "draft", "mandate_on_file", "agreement_signed"]);

export async function savePartnerOrganisation(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim() || null;
  const legalNameEn = String(formData.get("legalNameEn") ?? "").trim();
  const legalNameUk = String(formData.get("legalNameUk") ?? "").trim();
  const shortNameEn = String(formData.get("shortNameEn") ?? "").trim();
  const shortNameUk = String(formData.get("shortNameUk") ?? "").trim();
  const countryCode = String(formData.get("countryCode") ?? "").trim().toUpperCase();
  const partnerRole = String(formData.get("partnerRole") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const agreementStatus = String(formData.get("agreementStatus") ?? "").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const descriptionEn = String(formData.get("descriptionEn") ?? "").trim();
  const descriptionUk = String(formData.get("descriptionUk") ?? "").trim();
  const scopeNote = String(formData.get("scopeNote") ?? "").trim();
  const isPublic = String(formData.get("isPublic") ?? "") === "on";
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (
    !legalNameEn ||
    countryCode.length !== 2 ||
    !roles.has(partnerRole) ||
    !statuses.has(status) ||
    !agreementStatuses.has(agreementStatus)
  ) {
    redirect("/admin/partners?error=" + encodeURIComponent("Complete the required partner fields."));
  }

  if (isPublic && status !== "confirmed") {
    redirect("/admin/partners?error=" + encodeURIComponent("Only confirmed partners can be public."));
  }

  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  const { error } = await supabase.rpc("admin_save_partner_organisation", {
    p_id: id,
    p_legal_name_en: legalNameEn,
    p_legal_name_uk: legalNameUk || null,
    p_short_name_en: shortNameEn || null,
    p_short_name_uk: shortNameUk || null,
    p_country_code: countryCode,
    p_partner_role: partnerRole,
    p_status: status,
    p_agreement_status: agreementStatus,
    p_website_url: websiteUrl || null,
    p_description_en: descriptionEn || null,
    p_description_uk: descriptionUk || null,
    p_scope_note: scopeNote || null,
    p_is_public: isPublic,
    p_sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
  });

  if (error) {
    redirect("/admin/partners?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/admin/partners");
  redirect("/admin/partners?message=saved");
}
