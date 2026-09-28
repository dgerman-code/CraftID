"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom, localeQuery } from "@/lib/i18n";

export async function submitInterest(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const q = localeQuery(lang);
  const opportunityId = String(formData.get("opportunityId") ?? "").trim();
  const entityId = String(formData.get("entityId") ?? "").trim();
  const shareProfile = formData.get("shareProfile") === "on";
  const shareEmail = formData.get("shareEmail") === "on";
  const sharePhone = formData.get("sharePhone") === "on";
  const phone = sharePhone
    ? String(formData.get("phone") ?? "").trim()
    : "";

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    redirect(
      `/login${q ? `${q}&` : "?"}next=${encodeURIComponent(
        `/opportunities/${opportunityId}/interest${q}`,
      )}`,
    );
  }

  const { error } = await supabase.rpc("submit_opportunity_interest", {
    p_opportunity_id: opportunityId,
    p_entity_id: entityId,
    p_message: String(formData.get("message") ?? "").trim() || null,
    p_share_profile: shareProfile,
    p_share_email: shareEmail,
    p_phone: phone || null,
  });

  if (error) {
    redirect(
      `/opportunities/${opportunityId}/interest${q ? `${q}&` : "?"}error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  const params = new URLSearchParams();
  if (lang !== "en") params.set("lang", lang);
  params.set("entity", entityId);
  params.set("message", "sent");
  redirect(`/my-craftid/opportunities?${params.toString()}`);
}
