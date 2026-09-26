import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";

export type OwnedCraftIdEntity = {
  id: string;
  craftid_number: number;
  craftid_check_digits: string;
  entity_type: "professional" | "workshop";
  public_status: "draft" | "published" | "suspended" | "archived";
};

export async function getOwnedCraftId(requestedEntityId?: string | null) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub ?? null;

  if (!userId) {
    return { supabase, userId: null, entity: null, entities: [] as OwnedCraftIdEntity[] };
  }

  const { data } = await supabase
    .from("craftid_entities")
    .select("id, craftid_number, craftid_check_digits, entity_type, public_status")
    .eq("owner_user_id", userId)
    .neq("public_status", "archived")
    .order("entity_type", { ascending: true })
    .order("created_at", { ascending: true });

  const entities = (data ?? []) as OwnedCraftIdEntity[];

  if (requestedEntityId) {
    const selected = entities.find((item) => item.id === requestedEntityId) ?? null;
    return { supabase, userId, entity: selected, entities };
  }

  const entity =
    entities.find((item) => item.entity_type === "professional") ??
    entities[0] ??
    null;

  return { supabase, userId, entity, entities };
}

export function ownerWorkspaceQuery(
  locale: Locale,
  entityId: string,
  extra?: Record<string, string>,
) {
  const params = new URLSearchParams();
  if (locale !== "en") params.set("lang", locale);
  params.set("entity", entityId);
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value) params.set(key, value);
  }
  return `?${params.toString()}`;
}
