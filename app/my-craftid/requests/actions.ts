"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom, localeQuery } from "@/lib/i18n";

export async function updateContactRequestStatus(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const entityId = String(formData.get("entityId") ?? "").trim();
  const fallbackQ = localeQuery(lang);
  const requestId = String(formData.get("requestId") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = new Set(["accepted", "declined", "closed", "spam"]);

  if (!requestId || !allowed.has(status)) {
    redirect(`/my-craftid/requests${fallbackQ}`);
  }

  const { supabase, userId, entity } = await getOwnedCraftId(entityId);
  if (!userId) redirect(`/login${localeQuery(lang)}`);
  if (!entity) redirect(`/my-craftid${localeQuery(lang)}`);
  const q = ownerWorkspaceQuery(lang, entity.id);

  const { error } = await supabase
    .from("contact_requests")
    .update({ status })
    .eq("id", requestId)
    .eq("target_entity_id", entity.id);

  if (error) {
    redirect(`/my-craftid/requests${q}&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/my-craftid/requests");
  redirect(`/my-craftid/requests${q}&message=updated`);
}
