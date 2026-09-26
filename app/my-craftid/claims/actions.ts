"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom, localeQuery } from "@/lib/i18n";
import { workspaceActionCopy } from "@/lib/workspace-action-copy";

const allowedTypes = new Set(["skill", "experience", "qualification", "workshop_affiliation", "external_recognition", "origin", "craft_tradition"]);

export async function addClaim(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const t = workspaceActionCopy[lang];
  const entityId = String(formData.get("entityId") ?? "").trim();
  const type = String(formData.get("claimType") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "public") === "private" ? "private" : "public";

  const { supabase, userId, entity } = await getOwnedCraftId(entityId);
  if (!userId) redirect(`/login${localeQuery(lang)}`);
  if (!entity) redirect(`/my-craftid${localeQuery(lang)}`);
  const q = ownerWorkspaceQuery(lang, entity.id);

  if (!allowedTypes.has(type) || !title) {
    redirect(`/my-craftid/claims${q}&error=${encodeURIComponent(t.claimRequired)}`);
  }

  const { error } = await supabase.from("claims").insert({
    entity_id: entity.id,
    claim_type: type,
    title,
    description: description || null,
    visibility,
    status: "self_declared",
  });

  if (error) {
    redirect(`/my-craftid/claims${q}&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/my-craftid/claims");
  redirect(`/my-craftid/claims${q}&message=added`);
}

export async function addSkillClaims(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const t = workspaceActionCopy[lang];
  const entityId = String(formData.get("entityId") ?? "").trim();
  const selected = [...new Set(formData.getAll("skillId").map((value) => String(value)).filter(Boolean))];

  const { supabase, userId, entity } = await getOwnedCraftId(entityId);
  if (!userId) redirect(`/login${localeQuery(lang)}`);
  if (!entity) redirect(`/my-craftid${localeQuery(lang)}`);
  const q = ownerWorkspaceQuery(lang, entity.id);

  if (!selected.length) {
    redirect(`/my-craftid/claims${q}&error=${encodeURIComponent(t.selectSkill)}`);
  }

  const { data: terms, error: termsError } = await supabase
    .from("taxonomy_terms")
    .select("id, label_en, label_uk")
    .eq("term_type", "skill")
    .eq("is_active", true)
    .in("id", selected);

  if (termsError || !terms?.length) {
    redirect(`/my-craftid/claims${q}&error=${encodeURIComponent(
      termsError?.message ?? t.skillsNotFound,
    )}`);
  }

  const { data: existing } = await supabase
    .from("claims")
    .select("taxonomy_term_id")
    .eq("entity_id", entity.id)
    .eq("claim_type", "skill")
    .in("taxonomy_term_id", terms.map((term) => term.id));

  const existingIds = new Set((existing ?? []).map((claim) => claim.taxonomy_term_id));
  const rows = terms
    .filter((term) => !existingIds.has(term.id))
    .map((term) => ({
      entity_id: entity.id,
      claim_type: "skill",
      title: lang === "uk" ? term.label_uk : term.label_en,
      taxonomy_term_id: term.id,
      visibility: "public",
      status: "self_declared",
    }));

  if (rows.length) {
    const { error } = await supabase.from("claims").insert(rows);
    if (error) {
      redirect(`/my-craftid/claims${q}&error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/my-craftid/claims");
  revalidatePath("/my-craftid/preview");
  redirect(`/my-craftid/claims${q}&message=skills`);
}
