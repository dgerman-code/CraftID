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
