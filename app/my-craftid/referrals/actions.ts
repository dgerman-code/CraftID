"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";

export async function respondToInstitutionalReferral(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const entityId = String(formData.get("entityId") ?? "").trim();
  const referralId = String(formData.get("referralId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!referralId || !["accepted","declined"].includes(status)) {
    redirect(`/my-craftid/referrals${q}`);
  }

  const { supabase, userId, entity } = await getOwnedCraftId(entityId);
  if (!userId) redirect(lang === "uk" ? "/login?lang=uk" : "/login");
  if (!entity) redirect(lang === "uk" ? "/my-craftid?lang=uk" : "/my-craftid");
  const q = ownerWorkspaceQuery(lang, entity.id);

  const { error } = await supabase
    .from("institutional_referrals")
    .update({
      status,
      owner_response_note: note || null,
    })
    .eq("id", referralId)
    .eq("target_entity_id", entity.id)
    .eq("status", "invited");

  if (error) {
    redirect(`/my-craftid/referrals${q}&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/my-craftid/referrals");
  revalidatePath("/admin/referrals");
  redirect(`/my-craftid/referrals${q}&message=updated`);
}
