"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const roles = new Set(["national_operator", "partner"]);

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
  const logo = formData.get("logo");
  const removeLogo = formData.get("removeLogo") === "on";

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

  const { data: savedPartnerId, error } = await supabase.rpc("admin_save_partner_organisation", {
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

  const partnerId = String(savedPartnerId ?? id ?? "").trim();
  if (!partnerId) {
    redirect("/admin/partners?error=" + encodeURIComponent("Partner saved, but its ID could not be resolved."));
  }

  if (logo instanceof File && logo.size > 0) {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(logo.type) || logo.size > 2 * 1024 * 1024) {
      redirect(
        `/admin/partners?edit=${partnerId}&error=${encodeURIComponent(
          "Use PNG, JPG or WebP up to 2 MB for the organisation logo.",
        )}`,
      );
    }

    const ext = logo.type === "image/png" ? "png" : logo.type === "image/webp" ? "webp" : "jpg";
    const logoPath = `${partnerId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("partner-logos")
      .upload(logoPath, await logo.arrayBuffer(), {
        contentType: logo.type,
        upsert: false,
      });

    if (uploadError) {
      redirect(
        `/admin/partners?edit=${partnerId}&error=${encodeURIComponent(uploadError.message)}`,
      );
    }

    const { data: oldLogoPath, error: logoLinkError } = await supabase.rpc(
      "admin_set_partner_logo",
      {
        p_partner_id: partnerId,
        p_logo_path: logoPath,
      },
    );

    if (logoLinkError) {
      await supabase.storage.from("partner-logos").remove([logoPath]);
      redirect(
        `/admin/partners?edit=${partnerId}&error=${encodeURIComponent(logoLinkError.message)}`,
      );
    }

    if (oldLogoPath && oldLogoPath !== logoPath) {
      await supabase.storage.from("partner-logos").remove([String(oldLogoPath)]);
    }
  } else if (removeLogo) {
    const { data: oldLogoPath, error: removeLinkError } = await supabase.rpc(
      "admin_set_partner_logo",
      {
        p_partner_id: partnerId,
        p_logo_path: null,
      },
    );

    if (removeLinkError) {
      redirect(
        `/admin/partners?edit=${partnerId}&error=${encodeURIComponent(removeLinkError.message)}`,
      );
    }

    if (oldLogoPath) {
      await supabase.storage.from("partner-logos").remove([String(oldLogoPath)]);
    }
  }

  revalidatePath("/admin/partners");
  revalidatePath("/network");
  redirect(`/admin/partners?edit=${partnerId}&message=saved`);
}
