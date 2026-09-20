"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Set(["skill", "experience", "qualification", "workshop_affiliation", "external_recognition", "origin", "craft_tradition"]);

export async function addClaim(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const q = lang === "uk" ? "?lang=uk" : "";
  const type = String(formData.get("claimType") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "public") === "private" ? "private" : "public";

  if (!allowedTypes.has(type) || !title) {
    redirect(`/my-craftid/claims${q ? `${q}&` : "?"}error=${encodeURIComponent("Claim type and title are required")}`);
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect(`/login${q}`);

  const { data: entity } = await supabase.from("craftid_entities")
    .select("id").eq("owner_user_id", userId).limit(1).single();
  if (!entity) redirect(`/onboarding${q}`);

  const { error } = await supabase.from("claims").insert({
    entity_id: entity.id,
    claim_type: type,
    title,
    description: description || null,
    visibility,
    status: "self_declared",
  });

  if (error) {
    redirect(`/my-craftid/claims${q ? `${q}&` : "?"}error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/my-craftid/claims");
  redirect(`/my-craftid/claims${q ? `${q}&` : "?"}message=added`);
}


export async function addSkillClaims(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const q = lang === "uk" ? "?lang=uk" : "";
  const selected = [...new Set(formData.getAll("skillId").map((value) => String(value)).filter(Boolean))];

  if (!selected.length) {
    redirect(`/my-craftid/claims${q ? `${q}&` : "?"}error=${encodeURIComponent(
      lang === "uk" ? "Оберіть щонайменше одну навичку" : "Choose at least one skill",
    )}`);
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect(`/login${q}`);

  const { data: entity } = await supabase
    .from("craftid_entities")
    .select("id")
    .eq("owner_user_id", userId)
    .limit(1)
    .single();

  if (!entity) redirect(`/onboarding${q}`);

  const { data: terms, error: termsError } = await supabase
    .from("taxonomy_terms")
    .select("id, label_en, label_uk")
    .eq("term_type", "skill")
    .eq("is_active", true)
    .in("id", selected);

  if (termsError || !terms?.length) {
    redirect(`/my-craftid/claims${q ? `${q}&` : "?"}error=${encodeURIComponent(
      termsError?.message ?? "Selected skills were not found",
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
      redirect(`/my-craftid/claims${q ? `${q}&` : "?"}error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/my-craftid/claims");
  revalidatePath("/my-craftid/preview");
  redirect(`/my-craftid/claims${q ? `${q}&` : "?"}message=skills`);
}
