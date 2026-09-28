"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function resolveDuplicateCraftId(formData: FormData) {
  const keepEntityId = String(formData.get("keepEntityId") ?? "").trim();
  const archiveEntityId = String(formData.get("archiveEntityId") ?? "").trim();
  const targetUserId = String(formData.get("targetUserId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (
    !isUuid(keepEntityId) ||
    !isUuid(archiveEntityId) ||
    !isUuid(targetUserId) ||
    keepEntityId === archiveEntityId
  ) {
    redirect("/admin/account-integrity?error=Select+two+different+CraftID+records+and+a+retained+login+account");
  }

  if (reason.length < 12) {
    redirect("/admin/account-integrity?error=Add+a+clear+administrative+reason+of+at+least+12+characters");
  }

  if (confirmation !== "RESOLVE") {
    redirect("/admin/account-integrity?error=Type+RESOLVE+to+confirm+duplicate+resolution");
  }

  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  const { data, error } = await supabase.rpc("admin_resolve_duplicate_craftid", {
    p_keep_entity_id: keepEntityId,
    p_archive_entity_id: archiveEntityId,
    p_target_user_id: targetUserId,
    p_reason: reason,
  });

  if (error) {
    redirect("/admin/account-integrity?error=" + encodeURIComponent(error.message));
  }

  const kept =
    typeof data === "object" &&
    data &&
    "kept_entity_id" in data
      ? String((data as { kept_entity_id?: string }).kept_entity_id ?? "")
      : "";

  revalidatePath("/admin/account-integrity");
  revalidatePath("/admin/registry");
  revalidatePath("/admin/publication");

  const message = kept
    ? "Duplicate resolved. Canonical CraftID entity: " + kept
    : "Duplicate resolved.";

  redirect("/admin/account-integrity?message=" + encodeURIComponent(message));
}
