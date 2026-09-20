"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setStaffRole(formData: FormData) {
  const userId = String(formData.get("userId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  if (!userId || !["admin","reviewer"].includes(role)) redirect("/admin/users?error=Invalid+role+request");

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_staff_role", { p_user_id: userId, p_role: role });
  if (error) redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/users");
  redirect("/admin/users?message=role-updated");
}

export async function removeStaffRole(formData: FormData) {
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) redirect("/admin/users?error=User+ID+required");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_remove_staff_role", { p_user_id: userId });
  if (error) redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/users");
  redirect("/admin/users?message=role-removed");
}
