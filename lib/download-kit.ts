import { createClient } from "@/lib/supabase/server";
import { formatCraftId } from "@/lib/craftid-format";
import { getSiteUrl } from "@/lib/site-url";

export type DownloadKitEntity = {
  id: string;
  entityType: "professional" | "workshop";
  publicStatus: "draft" | "published" | "suspended" | "archived";
  craftId: string;
  profileUrl: string;
  displayName: string;
  specialisation: string | null;
  countryCode: string | null;
};

export async function getOwnedDownloadKitEntity(entityId: string) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub ?? null;

  if (!userId) {
    return { status: 401 as const, entity: null, supabase, userId: null };
  }

  const requested = entityId.trim();
  if (!requested) {
    return { status: 400 as const, entity: null, supabase, userId };
  }

  const { data: row } = await supabase
    .from("craftid_entities")
    .select("id, entity_type, public_status, craftid_number, craftid_check_digits")
    .eq("id", requested)
    .eq("owner_user_id", userId)
    .neq("public_status", "archived")
    .maybeSingle();

  if (!row) {
    return { status: 404 as const, entity: null, supabase, userId };
  }

  const profile =
    row.entity_type === "professional"
      ? await supabase
          .from("professional_profiles")
          .select("display_name, professional_title, country_code")
          .eq("entity_id", row.id)
          .single()
      : await supabase
          .from("workshop_profiles")
          .select("display_name, craft_sector, country_code")
          .eq("entity_id", row.id)
          .single();

  const data = profile.data as
    | {
        display_name?: string | null;
        professional_title?: string | null;
        craft_sector?: string | null;
        country_code?: string | null;
      }
    | null;

  const craftId = formatCraftId(row.craftid_number, row.craftid_check_digits);

  const entity: DownloadKitEntity = {
    id: row.id,
    entityType: row.entity_type as "professional" | "workshop",
    publicStatus: row.public_status as DownloadKitEntity["publicStatus"],
    craftId,
    profileUrl: new URL("id/" + craftId, getSiteUrl()).toString(),
    displayName: data?.display_name?.trim() || "CraftID",
    specialisation:
      (row.entity_type === "professional"
        ? data?.professional_title
        : data?.craft_sector
      )?.trim() || null,
    countryCode: data?.country_code ?? null,
  };

  return { status: 200 as const, entity, supabase, userId };
}
