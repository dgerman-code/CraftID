"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";

export async function updatePrivacy(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const entityId = String(formData.get("entityId") ?? "").trim();
  const allowedPrecision = new Set(["country", "region", "city"]);
  const precision = String(formData.get("locationPrecision") ?? "city");

  const { supabase, userId, entity } = await getOwnedCraftId(entityId);
  if (!userId) redirect(lang === "uk" ? "/login?lang=uk" : "/login");
  if (!entity) redirect(lang === "uk" ? "/my-craftid?lang=uk" : "/my-craftid");
  const q = ownerWorkspaceQuery(lang, entity.id);

  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const locality = String(formData.get("locality") ?? "").trim();
  const countryCode = String(formData.get("addressCountryCode") ?? "").trim().toUpperCase();

  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
    redirect(`/my-craftid/privacy${q}&error=${encodeURIComponent(
      lang === "uk" ? "Код країни адреси має містити 2 літери." : "Address country code must contain 2 letters.",
    )}`);
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
  if (hasAnyAddress) {
    const { error: addressError } = await supabase
      .from("entity_business_addresses")
      .upsert({
        entity_id: entity.id,
        address_line1: addressLine1 || null,
        address_line2: addressLine2 || null,
        postal_code: postalCode || null,
        locality: locality || null,
        country_code: countryCode || null,
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
