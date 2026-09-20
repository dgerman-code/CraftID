"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updatePrivacy(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const q = lang === "uk" ? "?lang=uk" : "";
  const allowedPrecision = new Set(["country", "region", "city", "exact_business_location"]);
  const precision = String(formData.get("locationPrecision") ?? "city");

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect(`/login${q}`);

  const { data: entity } = await supabase.from("craftid_entities")
    .select("id").eq("owner_user_id", userId).limit(1).single();
  if (!entity) redirect(`/onboarding${q}`);

  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const locality = String(formData.get("locality") ?? "").trim();
  const countryCode = String(formData.get("addressCountryCode") ?? "").trim().toUpperCase();

  const { error } = await supabase.from("privacy_settings").update({
    show_profile_photo: formData.get("showProfilePhoto") === "on",
    show_city: formData.get("showCity") === "on",
    show_languages: formData.get("showLanguages") === "on",
    show_portfolio: formData.get("showPortfolio") === "on",
    show_qualifications: formData.get("showQualifications") === "on",
    location_precision: allowedPrecision.has(precision) ? precision : "city",
  }).eq("entity_id", entity.id);

  if (error) {
    redirect(`/my-craftid/privacy${q ? `${q}&` : "?"}error=${encodeURIComponent(error.message)}`);
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
      redirect(`/my-craftid/privacy${q ? `${q}&` : "?"}error=${encodeURIComponent(addressError.message)}`);
    }
  }

  revalidatePath("/my-craftid/privacy");
  revalidatePath("/my-craftid/preview");
  redirect(`/my-craftid/privacy${q ? `${q}&` : "?"}message=saved`);
}
