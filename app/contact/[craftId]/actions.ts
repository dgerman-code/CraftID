"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseCraftId } from "@/lib/craftid-format";

export async function submitPublicContactRequest(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const rawCraftId = String(formData.get("craftId") ?? "");
  const parsed = parseCraftId(rawCraftId);
  const number = parsed?.number ?? null;
  const q = lang === "uk" ? "?lang=uk" : "";

  if (!number) {
    redirect(`/contact/${encodeURIComponent(rawCraftId)}${q ? `${q}&` : "?"}error=${encodeURIComponent("Invalid CraftID")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_contact_request", {
    p_craftid_number: number,
    p_requester_name: String(formData.get("name") ?? ""),
    p_requester_email: String(formData.get("email") ?? ""),
    p_requester_organisation: String(formData.get("organisation") ?? "") || null,
    p_requester_role: String(formData.get("role") ?? "") || null,
    p_purpose: String(formData.get("purpose") ?? "professional_enquiry"),
    p_message: String(formData.get("message") ?? ""),
  });

  if (error) {
    redirect(`/contact/${encodeURIComponent(rawCraftId)}${q ? `${q}&` : "?"}error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/contact/${encodeURIComponent(rawCraftId)}${q ? `${q}&` : "?"}message=sent`);
}
