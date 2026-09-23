"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";

export async function issueCertificate(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const entityId = String(formData.get("entityId") ?? "").trim();

  const { supabase, userId, entity } = await getOwnedCraftId(entityId);
  if (!userId) redirect(lang === "uk" ? "/login?lang=uk" : "/login");
  if (!entity) redirect(lang === "uk" ? "/my-craftid?lang=uk" : "/my-craftid");

  const q = ownerWorkspaceQuery(lang, entity.id);

  const { data, error } = await supabase.rpc("issue_own_craftid_certificate", {
    p_entity_id: entity.id,
  });

  if (error) {
    redirect(
      "/my-craftid/certificate" +
        q +
        "&error=" +
        encodeURIComponent(error.message),
    );
  }

  const issued = Array.isArray(data) ? data[0] : data;
  const code = issued?.certificate_code ? String(issued.certificate_code) : "";

  revalidatePath("/my-craftid/certificate");

  redirect(
    "/my-craftid/certificate" +
      q +
      "&message=issued" +
      (code ? "&certificate=" + encodeURIComponent(code) : ""),
  );
}
