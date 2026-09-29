"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createAuthClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

const roles = new Set(["national_operator", "partner"]);

function partnerSaveError(message: string, countryCode: string) {
  const lower = message.toLowerCase();

  if (
    lower.includes("partner_organisations_one_confirmed_national_operator_per_country") ||
    lower.includes("duplicate key value violates unique constraint")
  ) {
    return `A National Operator is already assigned for ${countryCode}. Edit the existing organisation or assign this organisation as Country Partner.`;
  }

  return message;
}

export async function savePartnerOrganisation(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim() || null;
  const legalNameEn = String(formData.get("legalNameEn") ?? "").trim();
  const legalNameUk = String(formData.get("legalNameUk") ?? "").trim();
  const shortNameEn = String(formData.get("shortNameEn") ?? "").trim();
  const shortNameUk = String(formData.get("shortNameUk") ?? "").trim();
  const countryCode = String(formData.get("countryCode") ?? "").trim().toUpperCase();
  const partnerRole = String(formData.get("partnerRole") ?? "").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const descriptionEn = String(formData.get("descriptionEn") ?? "").trim();
  const descriptionUk = String(formData.get("descriptionUk") ?? "").trim();
  const isPublic = String(formData.get("isPublic") ?? "") === "on";
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const agreementStatus = String(formData.get("agreementStatus") ?? "none").trim() || "none";

  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactTitle = String(formData.get("contactTitle") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const internalNote = String(formData.get("internalNote") ?? "").trim();
  const portalEmail = String(formData.get("portalEmail") ?? "").trim().toLowerCase();
  const temporaryPassword = String(formData.get("temporaryPassword") ?? "");

  const logo = formData.get("logo");
  const removeLogo = formData.get("removeLogo") === "on";

  if (!legalNameEn || !/^[A-Z]{2}$/.test(countryCode) || !roles.has(partnerRole)) {
    redirect("/admin/partners?error=" + encodeURIComponent("Complete the required partner fields."));
  }

  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  if (partnerRole === "national_operator") {
    const { data: existingPartners, error: existingError } = await supabase.rpc(
      "admin_partner_organisations",
    );

    if (!existingError && Array.isArray(existingPartners)) {
      const conflict = existingPartners.find(
        (partner) =>
          partner.country_code === countryCode &&
          partner.partner_role === "national_operator" &&
          partner.id !== id,
      );

      if (conflict) {
        const message =
          `A National Operator is already assigned for ${countryCode}: ` +
          `${conflict.short_name_en || conflict.legal_name_en}. Edit that organisation or choose Country Partner.`;
        redirect(
          `/admin/partners?error=${encodeURIComponent(message)}&edit=${encodeURIComponent(
            id ?? conflict.id,
          )}`,
        );
      }
    }
  }

  const { data: savedPartnerId, error } = await supabase.rpc(
    "admin_save_partner_organisation",
    {
      p_id: id,
      p_legal_name_en: legalNameEn,
      p_legal_name_uk: legalNameUk || null,
      p_short_name_en: shortNameEn || null,
      p_short_name_uk: shortNameUk || null,
      p_country_code: countryCode,
      p_partner_role: partnerRole,
      p_status: "confirmed",
      p_agreement_status: agreementStatus,
      p_website_url: websiteUrl || null,
      p_description_en: descriptionEn || null,
      p_description_uk: descriptionUk || null,
      p_scope_note: null,
      p_is_public: isPublic,
      p_sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  );

  if (error) {
    const message = partnerSaveError(error.message, countryCode);
    redirect(
      `/admin/partners?error=${encodeURIComponent(message)}${id ? `&edit=${encodeURIComponent(id)}` : ""}`,
    );
  }

  const partnerId = String(savedPartnerId ?? id ?? "").trim();
  if (!partnerId) {
    redirect(
      "/admin/partners?error=" +
        encodeURIComponent("Partner saved, but its ID could not be resolved."),
    );
  }

  const { error: contactError } = await supabase.rpc(
    "admin_save_partner_contact_card",
    {
      p_partner_organisation_id: partnerId,
      p_contact_name: contactName || null,
      p_contact_title: contactTitle || null,
      p_contact_email: contactEmail || null,
      p_contact_phone: contactPhone || null,
      p_internal_note: internalNote || null,
    },
  );

  if (contactError) {
    redirect(
      `/admin/partners?edit=${partnerId}&error=${encodeURIComponent(
        contactError.message,
      )}`,
    );
  }

  let partnerAccessMessage = "saved";

  if (portalEmail) {
    const { data: existingUserId, error: lookupError } = await supabase.rpc(
      "admin_auth_user_for_email",
      { p_login_email: portalEmail },
    );

    if (lookupError) {
      redirect(
        `/admin/partners?edit=${partnerId}&error=${encodeURIComponent(
          lookupError.message,
        )}`,
      );
    }

    let authUserId = existingUserId ? String(existingUserId) : "";
    let mustChangePassword = false;

    if (!authUserId) {
      if (temporaryPassword.length < 12) {
        redirect(
          `/admin/partners?edit=${partnerId}&error=${encodeURIComponent(
            "For a new partner login, set a temporary password of at least 12 characters.",
          )}`,
        );
      }

      const isolatedAuth = createAuthClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        },
      );

      const nextPath = "/partner/password?welcome=1";
      const { data: signUpData, error: signUpError } = await isolatedAuth.auth.signUp({
        email: portalEmail,
        password: temporaryPassword,
        options: {
          emailRedirectTo: `${getSiteUrl()}auth/callback?next=${encodeURIComponent(
            nextPath,
          )}`,
          data: {
            account_purpose: "craftid_partner",
          },
        },
      });

      if (signUpError || !signUpData.user) {
        redirect(
          `/admin/partners?edit=${partnerId}&error=${encodeURIComponent(
            signUpError?.message ?? "Unable to create the partner login.",
          )}`,
        );
      }

      authUserId = signUpData.user.id;
      mustChangePassword = true;
      partnerAccessMessage = "partner-access-created";
    } else {
      partnerAccessMessage = "partner-access-existing";
    }

    const { error: membershipError } = await supabase.rpc(
      "admin_finalize_partner_provisioning",
      {
        p_partner_organisation_id: partnerId,
        p_login_email: portalEmail,
        p_user_id: authUserId,
        p_must_change_password: mustChangePassword,
      },
    );

    if (membershipError) {
      redirect(
        `/admin/partners?edit=${partnerId}&error=${encodeURIComponent(
          membershipError.message,
        )}`,
      );
    }
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

    const ext =
      logo.type === "image/png"
        ? "png"
        : logo.type === "image/webp"
          ? "webp"
          : "jpg";
    const logoPath = `${partnerId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("partner-logos")
      .upload(logoPath, await logo.arrayBuffer(), {
        contentType: logo.type,
        upsert: false,
      });

    if (uploadError) {
      redirect(
        `/admin/partners?edit=${partnerId}&error=${encodeURIComponent(
          uploadError.message,
        )}`,
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
        `/admin/partners?edit=${partnerId}&error=${encodeURIComponent(
          logoLinkError.message,
        )}`,
      );
    }

    if (oldLogoPath && oldLogoPath !== logoPath) {
      await supabase.storage
        .from("partner-logos")
        .remove([String(oldLogoPath)]);
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
        `/admin/partners?edit=${partnerId}&error=${encodeURIComponent(
          removeLinkError.message,
        )}`,
      );
    }

    if (oldLogoPath) {
      await supabase.storage
        .from("partner-logos")
        .remove([String(oldLogoPath)]);
    }
  }

  revalidatePath("/admin/partners");
  revalidatePath("/network");
  revalidatePath("/opportunities");
  redirect(`/admin/partners?edit=${partnerId}&message=${partnerAccessMessage}`);
}

export async function revokePartnerPortalAccess(formData: FormData) {
  const partnerId = String(formData.get("partnerId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  const { error } = await supabase.rpc("admin_save_partner_membership", {
    p_partner_organisation_id: partnerId,
    p_login_email: email,
    p_is_active: false,
  });

  if (error) {
    redirect(
      `/admin/partners?edit=${partnerId}&error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath("/admin/partners");
  redirect(`/admin/partners?edit=${partnerId}&message=access-updated`);
}


export async function deletePartnerOrganisation(formData: FormData) {
  const partnerId = String(formData.get("partnerId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!partnerId) {
    redirect(
      "/admin/partners?error=" +
        encodeURIComponent("Select a partner organisation to delete."),
    );
  }

  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  const { data: logoPath, error } = await supabase.rpc(
    "admin_delete_partner_organisation",
    {
      p_partner_organisation_id: partnerId,
      p_reason: reason || "Removed by Platform Admin",
    },
  );

  if (error) {
    redirect(
      `/admin/partners?edit=${encodeURIComponent(partnerId)}&error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  if (logoPath) {
    await supabase.storage
      .from("partner-logos")
      .remove([String(logoPath)]);
  }

  revalidatePath("/admin/partners");
  revalidatePath("/network");
  revalidatePath("/opportunities");
  redirect("/admin/partners?message=deleted");
}
