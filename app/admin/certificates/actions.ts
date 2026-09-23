"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function revokeCertificate(formData: FormData) {
  const code = String(formData.get("certificateCode") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!code || !reason) {
    redirect("/admin/certificates?error=" + encodeURIComponent("Certificate ID and revocation reason are required."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_revoke_craftid_certificate", {
    p_certificate_code: code,
    p_reason: reason,
  });

  if (error) {
    redirect("/admin/certificates?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/admin/certificates");
  redirect("/admin/certificates?message=revoked");
}
