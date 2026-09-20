"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateRegistryStatus(formData: FormData) {
  const entityId = String(formData.get("entityId") ?? "");
  const status = String(formData.get("status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!entityId || !["draft","published","suspended","archived"].includes(status) || reason.length < 4) {
    redirect(`/admin/registry/${entityId}?error=${encodeURIComponent("Valid status and reason are required")}`);
  }

  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  const { error } = await supabase.rpc("admin_set_entity_public_status", {
    p_entity_id: entityId,
    p_new_status: status,
    p_reason: reason,
  });

  if (error) {
    redirect(`/admin/registry/${entityId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/registry");
  revalidatePath(`/admin/registry/${entityId}`);
  redirect(`/admin/registry/${entityId}?message=status-updated`);
}
