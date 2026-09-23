"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatCraftId } from "@/lib/craftid-format";

export async function assignCraftIdNumber(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const q = lang === "uk" ? "?lang=uk" : "";
  const ownerUserId = String(formData.get("ownerUserId") ?? "").trim();
  const entityType = String(formData.get("entityType") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const requestedNumber = Number(formData.get("requestedNumber"));

  if (!ownerUserId || !displayName || !reason || !Number.isSafeInteger(requestedNumber) || requestedNumber < 1) {
    redirect(`/admin/identifiers${q ? `${q}&` : "?"}error=${encodeURIComponent("Complete all required fields with a valid positive number")}`);
  }

  if (!["professional", "workshop"].includes(entityType)) {
    redirect(`/admin/identifiers${q ? `${q}&` : "?"}error=${encodeURIComponent("Choose a valid profile type")}`);
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) redirect(`/login${q}`);

  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect(`/my-craftid${q}`);

  const { data, error } = await supabase.rpc("admin_assign_craftid_number", {
    p_owner_user_id: ownerUserId,
    p_entity_type: entityType,
    p_requested_number: requestedNumber,
    p_display_name: displayName,
    p_reason: reason,
  });

  if (error) {
    redirect(`/admin/identifiers${q ? `${q}&` : "?"}error=${encodeURIComponent(error.message)}`);
  }

  const assigned = Array.isArray(data) ? data[0] : data;
  const result = assigned
    ? formatCraftId(assigned.craftid_number, assigned.craftid_check_digits)
    : String(requestedNumber).padStart(8, "0").replace(/(\d{4})(\d{4})/, "$1-$2");

  revalidatePath("/admin/identifiers");
  redirect(`/admin/identifiers${q ? `${q}&` : "?"}message=${encodeURIComponent(result)}`);
}
