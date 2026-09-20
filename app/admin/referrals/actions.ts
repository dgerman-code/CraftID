"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function parseCraftId(value: string) {
  const match = value.match(/^(?:#)?0*(\d+)(?:-\d{2})?$/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export async function createInstitutionalReferral(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const q = lang === "uk" ? "?lang=uk" : "";
  const craftId = parseCraftId(String(formData.get("craftId") ?? ""));
  const organisation = String(formData.get("organisation") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const type = String(formData.get("opportunityType") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const deadline = String(formData.get("deadline") ?? "").trim() || null;

  const allowed = new Set(["project","partnership","training","commission","research","restoration","other"]);
  if (!craftId || !organisation || !title || !message || !allowed.has(type)) {
    redirect(`/admin/referrals${q ? `${q}&` : "?"}error=${encodeURIComponent("Complete all required fields")}`);
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect(`/login${q}`);

  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect(`/my-craftid${q}`);

  const { data: entity } = await supabase
    .from("craftid_entities")
    .select("id, public_status")
    .eq("craftid_number", craftId)
    .neq("public_status", "archived")
    .maybeSingle();

  if (!entity) {
    redirect(`/admin/referrals${q ? `${q}&` : "?"}error=${encodeURIComponent("CraftID not found")}`);
  }

  const { error } = await supabase.from("institutional_referrals").insert({
    target_entity_id: entity.id,
    created_by: userId,
    requester_organisation: organisation,
    requester_contact_name: contactName || null,
    requester_contact_email: contactEmail || null,
    opportunity_type: type,
    title,
    message,
    response_deadline: deadline,
  });

  if (error) {
    redirect(`/admin/referrals${q ? `${q}&` : "?"}error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/referrals");
  revalidatePath("/my-craftid/referrals");
  redirect(`/admin/referrals${q ? `${q}&` : "?"}message=created`);
}
