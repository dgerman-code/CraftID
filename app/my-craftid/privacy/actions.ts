"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom, localeQuery } from "@/lib/i18n";
import { workspaceActionCopy } from "@/lib/workspace-action-copy";

export async function updatePrivacy(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const t = workspaceActionCopy[lang];
  const entityId = String(formData.get("entityId") ?? "").trim();
  const allowedPrecision = new Set(["country", "region", "city"]);
  const precision = String(formData.get("locationPrecision") ?? "city");

  const { supabase, userId, entity } = await getOwnedCraftId(entityId);
  if (!userId) redirect(`/login${localeQuery(lang)}`);
  if (!entity) redirect(`/my-craftid${localeQuery(lang)}`);
  const q = ownerWorkspaceQuery(lang, entity.id);

  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const locality = String(formData.get("locality") ?? "").trim();
  const countryCode = String(formData.get("addressCountryCode") ?? "").trim().toUpperCase();

  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
    redirect(`/my-craftid/privacy${q}&error=${encodeURIComponent(t.addressCountryCode)}`);
  }

  const canonicalPrecision = allowedPrecision.has(precision) ? precision : "city";

  const { error } = await supabase.from("privacy_settings").update({
    show_profile_photo: formData.get("showProfilePhoto") === "on",
    show_city: canonicalPrecision === "city",
    show_languages: formData.get("showLanguages") === "on",
    show_portfolio: formData.get("showPortfolio") === "on",
    show_qualifications: formData.get("showQualifications") === "on",
    location_precision: canonicalPrecision,
  }).eq("entity_id", entity.id);

  if (error) {
    redirect(`/my-craftid/privacy${q}&error=${encodeURIComponent(error.message)}`);
  }

  const hasAnyAddress = Boolean(addressLine1 || addressLine2 || postalCode || locality || countryCode);
  const wantsExactPublic =
    entity.entity_type === "workshop" &&
    formData.get("showExactAddressPublic") === "on";
  const confirmsExactPublic =
    formData.get("confirmExactAddressPublic") === "on";

  if (wantsExactPublic && !confirmsExactPublic) {
    redirect(`/my-craftid/privacy${q}&error=${encodeURIComponent(t.exactPublicConsent)}`);
  }

  if (wantsExactPublic && (!addressLine1 || !locality || !countryCode)) {
    redirect(`/my-craftid/privacy${q}&error=${encodeURIComponent(t.exactAddressRequired)}`);
  }

  if (hasAnyAddress) {
    const { data: existingAddress } = await supabase
      .from("entity_business_addresses")
      .select("show_in_public_profile, public_consent_at")
      .eq("entity_id", entity.id)
      .maybeSingle();

    const publicConsentAt = wantsExactPublic
      ? existingAddress?.show_in_public_profile && existingAddress.public_consent_at
        ? existingAddress.public_consent_at
        : new Date().toISOString()
      : null;

    const { error: addressError } = await supabase
      .from("entity_business_addresses")
      .upsert({
        entity_id: entity.id,
        address_line1: addressLine1 || null,
        address_line2: addressLine2 || null,
        postal_code: postalCode || null,
        locality: locality || null,
        country_code: countryCode || null,
        show_in_public_profile: wantsExactPublic,
        public_consent_at: publicConsentAt,
      }, { onConflict: "entity_id" });

    if (addressError) {
      redirect(`/my-craftid/privacy${q}&error=${encodeURIComponent(addressError.message)}`);
    }
  } else {
    const { error: addressDeleteError } = await supabase
      .from("entity_business_addresses")
      .delete()
      .eq("entity_id", entity.id);

    if (addressDeleteError) {
      redirect(`/my-craftid/privacy${q}&error=${encodeURIComponent(addressDeleteError.message)}`);
    }
  }

  revalidatePath("/my-craftid/privacy");
  revalidatePath("/my-craftid/preview");
  redirect(`/my-craftid/privacy${q}&message=saved`);
}
