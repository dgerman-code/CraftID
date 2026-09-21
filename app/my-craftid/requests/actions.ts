"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateContactRequestStatus(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const q = lang === "uk" ? "?lang=uk" : "";
  const requestId = String(formData.get("requestId") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = new Set(["accepted", "declined", "closed", "spam"]);

  if (!requestId || !allowed.has(status)) {
    redirect(`/my-craftid/requests${q}`);
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
    .from("contact_requests")
    .update({ status })
    .eq("id", requestId)
    .eq("target_entity_id", entity.id);

  if (error) {
    redirect(`/my-craftid/requests${q ? `${q}&` : "?"}error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/my-craftid/requests");
  redirect(`/my-craftid/requests${q ? `${q}&` : "?"}message=updated`);
}
