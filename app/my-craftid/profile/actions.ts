"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom, localeQuery } from "@/lib/i18n";
import { workspaceActionCopy } from "@/lib/workspace-action-copy";

export async function updateProfile(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const t = workspaceActionCopy[lang];
  const entityId = String(formData.get("entityId") ?? "").trim();
  const { supabase, userId, entity } = await getOwnedCraftId(entityId);
  if (!userId) redirect(`/login${localeQuery(lang)}`);
  if (!entity) redirect(`/my-craftid${localeQuery(lang)}`);
  const q = ownerWorkspaceQuery(lang, entity.id);

  const displayName = String(formData.get("displayName") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const countryCode = String(formData.get("countryCode") ?? "").trim().toUpperCase();
  const region = String(formData.get("region") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const about = String(formData.get("about") ?? "").trim();

  if (!displayName) {
    redirect(`/my-craftid/profile${q}&error=${encodeURIComponent(t.displayNameRequired)}`);
  }

  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
    redirect(`/my-craftid/profile${q}&error=${encodeURIComponent(t.countryCode)}`);
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
    redirect(`/my-craftid/profile${q}&error=${encodeURIComponent(result.error.message)}`);
  }

  revalidatePath("/my-craftid");
  revalidatePath("/my-craftid/profile");
  redirect(`/my-craftid/profile${q}&message=saved`);
}

export async function uploadProfileImage(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const t = workspaceActionCopy[lang];
  const entityId = String(formData.get("entityId") ?? "").trim();
  const file = formData.get("file");

  const { supabase, userId, entity } = await getOwnedCraftId(entityId);
  if (!userId) redirect(`/login${localeQuery(lang)}`);
  if (!entity) redirect(`/my-craftid${localeQuery(lang)}`);
  const q = ownerWorkspaceQuery(lang, entity.id);

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/my-craftid/profile${q}&error=${encodeURIComponent(t.chooseImage)}`);
  }

  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowed.has(file.type) || file.size > 5 * 1024 * 1024) {
    redirect(`/my-craftid/profile${q}&error=${encodeURIComponent(t.imageFormat)}`);
  }

  const table = entity.entity_type === "professional" ? "professional_profiles" : "workshop_profiles";
  const { data: current } = await supabase
    .from(table)
    .select("profile_photo_path")
    .eq("entity_id", entity.id)
    .single();

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${entity.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-images")
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });

  if (uploadError) {
    redirect(`/my-craftid/profile${q}&error=${encodeURIComponent(uploadError.message)}`);
  }

  const { error: updateError } = await supabase
    .from(table)
    .update({ profile_photo_path: path })
    .eq("entity_id", entity.id);

  if (updateError) {
    await supabase.storage.from("profile-images").remove([path]);
    redirect(`/my-craftid/profile${q}&error=${encodeURIComponent(updateError.message)}`);
  }

  if (current?.profile_photo_path) {
    await supabase.storage.from("profile-images").remove([current.profile_photo_path]);
  }

  revalidatePath("/my-craftid");
  revalidatePath("/my-craftid/profile");
  revalidatePath("/my-craftid/preview");
  redirect(`/my-craftid/profile${q}&message=photo`);
}

export async function updateContactPoints(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const entityId = String(formData.get("entityId") ?? "").trim();
  const { supabase, userId, entity } = await getOwnedCraftId(entityId);
  if (!userId) redirect(`/login${localeQuery(lang)}`);
  if (!entity) redirect(`/my-craftid${localeQuery(lang)}`);
  const q = ownerWorkspaceQuery(lang, entity.id);

  const rows = [
    ["professional_email", String(formData.get("professionalEmail") ?? "").trim(), false, formData.get("professionalEmailPartner") === "on"],
    ["phone", String(formData.get("phone") ?? "").trim(), false, formData.get("phonePartner") === "on"],
    ["website", String(formData.get("website") ?? "").trim(), formData.get("websitePublic") === "on", formData.get("websitePartner") === "on"],
    ["linkedin", String(formData.get("linkedin") ?? "").trim(), formData.get("linkedinPublic") === "on", formData.get("linkedinPartner") === "on"],
    ["portfolio", String(formData.get("portfolio") ?? "").trim(), formData.get("portfolioPublic") === "on", formData.get("portfolioPartner") === "on"],
  ] as const;

  for (const [contactType, value, isPublic, shareWithPartners] of rows) {
    if (!value) {
      await supabase
        .from("entity_contact_points")
        .delete()
        .eq("entity_id", entity.id)
        .eq("contact_type", contactType);
      continue;
    }

    const { error } = await supabase
      .from("entity_contact_points")
      .upsert({
        entity_id: entity.id,
        contact_type: contactType,
        value,
        show_in_public_profile: isPublic,
        public_consent_at: isPublic ? new Date().toISOString() : null,
        share_with_institutional_partners: shareWithPartners,
        partner_sharing_consent_at: shareWithPartners ? new Date().toISOString() : null,
        is_primary: true,
      }, { onConflict: "entity_id,contact_type" });

    if (error) {
      redirect(`/my-craftid/profile${q}&error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/my-craftid/profile");
  revalidatePath("/my-craftid/preview");
  redirect(`/my-craftid/profile${q}&message=contacts`);
}
