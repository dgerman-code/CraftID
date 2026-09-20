"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function respondToInstitutionalReferral(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const q = lang === "uk" ? "?lang=uk" : "";
  const referralId = String(formData.get("referralId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!referralId || !["accepted","declined"].includes(status)) {
    redirect(`/my-craftid/referrals${q}`);
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect(`/login${q}`);

  const { data: entity } = await supabase
    .from("craftid_entities")
    .select("id")
    .eq("owner_user_id", userId)
    .limit(1)
    .single();

  if (!entity) redirect(`/onboarding${q}`);

  const { error } = await supabase
    .from("institutional_referrals")
    .update({
      status,
      owner_response_note: note || null,
      responded_at: new Date().toISOString(),
      responded_by: userId,
    })
    .eq("id", referralId)
    .eq("target_entity_id", entity.id)
    .eq("status", "invited");

  if (error) {
    redirect(`/my-craftid/referrals${q ? `${q}&` : "?"}error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/my-craftid/referrals");
  revalidatePath("/admin/referrals");
  redirect(`/my-craftid/referrals${q ? `${q}&` : "?"}message=updated`);
}
