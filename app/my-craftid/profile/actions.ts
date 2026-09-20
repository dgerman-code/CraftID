"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const q = lang === "uk" ? "?lang=uk" : "";
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;

  if (!userId) redirect(`/login${q}`);

  const { data: entity } = await supabase
    .from("craftid_entities")
    .select("id, entity_type")
    .eq("owner_user_id", userId)
    .limit(1)
    .single();

  if (!entity) redirect(`/onboarding${q}`);

  const displayName = String(formData.get("displayName") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const countryCode = String(formData.get("countryCode") ?? "").trim().toUpperCase();
  const region = String(formData.get("region") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const about = String(formData.get("about") ?? "").trim();

  if (!displayName) {
    redirect(`/my-craftid/profile${q ? `${q}&` : "?"}error=${encodeURIComponent("Display name is required")}`);
  }

  const result =
    entity.entity_type === "professional"
      ? await supabase.from("professional_profiles").update({
          display_name: displayName,
          professional_title: title || null,
          country_code: countryCode || null,
          region: region || null,
          city: city || null,
          about: about || null,
        }).eq("entity_id", entity.id)
      : await supabase.from("workshop_profiles").update({
          display_name: displayName,
          craft_sector: title || null,
          country_code: countryCode || null,
          region: region || null,
          city: city || null,
          about: about || null,
        }).eq("entity_id", entity.id);

  if (result.error) {
    redirect(`/my-craftid/profile${q ? `${q}&` : "?"}error=${encodeURIComponent(result.error.message)}`);
  }

  revalidatePath("/my-craftid");
  revalidatePath("/my-craftid/profile");
  redirect(`/my-craftid/profile${q ? `${q}&` : "?"}message=saved`);
}
