"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120);
}

export async function uploadEvidence(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const q = lang === "uk" ? "?lang=uk" : "";
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("evidenceType") ?? "").trim();
  const issuer = String(formData.get("issuer") ?? "").trim();
  const file = formData.get("file");

  if (!title || !type || !(file instanceof File) || file.size === 0) {
    redirect(`/my-craftid/evidence${q ? `${q}&` : "?"}error=${encodeURIComponent("Title, evidence type and file are required")}`);
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect(`/login${q}`);

  const { data: entity } = await supabase.from("craftid_entities")
    .select("id").eq("owner_user_id", userId).limit(1).single();
  if (!entity) redirect(`/onboarding${q}`);

  const path = `${userId}/${entity.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("evidence")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    redirect(`/my-craftid/evidence${q ? `${q}&` : "?"}error=${encodeURIComponent(uploadError.message)}`);
  }

  const { error: insertError } = await supabase.from("evidence_items").insert({
    owner_entity_id: entity.id,
    evidence_type: type,
    title,
    issuer: issuer || null,
    storage_path: path,
    visibility: "private",
    review_status: "submitted",
  });

  if (insertError) {
    await supabase.storage.from("evidence").remove([path]);
    redirect(`/my-craftid/evidence${q ? `${q}&` : "?"}error=${encodeURIComponent(insertError.message)}`);
  }

  revalidatePath("/my-craftid/evidence");
  redirect(`/my-craftid/evidence${q ? `${q}&` : "?"}message=uploaded`);
}
