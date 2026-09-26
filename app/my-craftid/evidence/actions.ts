"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom, localeQuery } from "@/lib/i18n";
import { workspaceActionCopy } from "@/lib/workspace-action-copy";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120);
}

export async function uploadEvidence(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const t = workspaceActionCopy[lang];
  const entityId = String(formData.get("entityId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("evidenceType") ?? "").trim();
  const issuer = String(formData.get("issuer") ?? "").trim();
  const claimId = String(formData.get("claimId") ?? "").trim();
  const file = formData.get("file");

  const { supabase, userId, entity } = await getOwnedCraftId(entityId);
  if (!userId) redirect(`/login${localeQuery(lang)}`);
  if (!entity) redirect(`/my-craftid${localeQuery(lang)}`);
  const q = ownerWorkspaceQuery(lang, entity.id);

  if (!title || !type || !(file instanceof File) || file.size === 0) {
    redirect(`/my-craftid/evidence${q}&error=${encodeURIComponent(t.evidenceRequired)}`);
  }

  const path = `${userId}/${entity.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("evidence")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    redirect(`/my-craftid/evidence${q}&error=${encodeURIComponent(uploadError.message)}`);
  }

  const { data: evidenceItem, error: insertError } = await supabase.from("evidence_items").insert({
    owner_entity_id: entity.id,
    evidence_type: type,
    title,
    issuer: issuer || null,
    storage_path: path,
    visibility: "private",
    review_status: "submitted",
  }).select("id").single();

  if (insertError || !evidenceItem) {
    await supabase.storage.from("evidence").remove([path]);
    redirect(`/my-craftid/evidence${q}&error=${encodeURIComponent(insertError?.message ?? t.evidenceRequired)}`);
  }

  if (claimId) {
    const { data: claim } = await supabase
      .from("claims")
      .select("id, entity_id, status")
      .eq("id", claimId)
      .eq("entity_id", entity.id)
      .maybeSingle();

    if (claim) {
      const { error: linkError } = await supabase.from("claim_evidence_links").insert({
        claim_id: claim.id,
        evidence_id: evidenceItem.id,
      });

      if (!linkError && claim.status === "self_declared") {
        await supabase.from("claims")
          .update({ status: "evidence_submitted" })
          .eq("id", claim.id);
      }
    }
  }

  revalidatePath("/my-craftid/evidence");
  revalidatePath("/my-craftid/claims");
  redirect(`/my-craftid/evidence${q}&message=uploaded`);
}
