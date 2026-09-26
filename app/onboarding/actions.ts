"use server";

import { redirect } from "next/navigation";
import { localeFrom, localeQuery } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

type EntityType = "professional" | "workshop";

export async function createCraftId(formData: FormData) {
  const entityType = String(formData.get("entityType") ?? "") as EntityType;
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const q = localeQuery(lang);

  if (!["professional", "workshop"].includes(entityType)) {
    redirect(`/onboarding${q ? `${q}&` : "?"}error=Choose%20a%20valid%20profile%20type`);
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect(`/login${q}`);
  }

  const { data: existing } = await supabase
    .from("craftid_entities")
    .select("id")
    .eq("owner_user_id", userId)
    .neq("public_status", "archived")
    .limit(1)
    .maybeSingle();

  if (existing) {
    redirect(`/my-craftid${q}`);
  }

  const displayName =
    entityType === "professional"
      ? lang === "uk" ? "Новий професіонал" : "New professional"
      : lang === "uk" ? "Нова майстерня" : "New workshop";

  const { error } = await supabase.rpc("create_own_craftid", {
    p_entity_type: entityType,
    p_display_name: displayName,
  });

  if (error) {
    redirect(
      `/onboarding${q ? `${q}&` : "?"}error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect(`/my-craftid${q}`);
}
