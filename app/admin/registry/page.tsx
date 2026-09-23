import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCraftIdWithHash } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
  }>;
};

const formatId = formatCraftIdWithHash;

export default async function RegistryPage({ searchParams }: Props) {
  const filters = await searchParams;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  let query = supabase
    .from("craftid_entities")
    .select("id, craftid_number, craftid_check_digits, entity_type, public_status, owner_user_id, created_at, updated_at")
    .order("craftid_number", { ascending: true })
    .limit(500);

  if (filters.status && ["draft", "published", "suspended", "archived"].includes(filters.status)) {
    query = query.eq("public_status", filters.status);
  }
  if (filters.type && ["professional", "workshop"].includes(filters.type)) {
    query = query.eq("entity_type", filters.type);
  }

  const { data: entities } = await query;
  const ids = (entities ?? []).map((e) => e.id);

  const [{ data: professionals }, { data: workshops }, { data: claimRows }, { data: evidenceRows }] = await Promise.all([
    ids.length
      ? supabase
          .from("professional_profiles")
          .select("entity_id, display_name, professional_title, country_code, region, city")
          .in("entity_id", ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase
          .from("workshop_profiles")
          .select("entity_id, display_name, craft_sector, country_code, region, city")
          .in("entity_id", ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase.from("claims").select("entity_id").in("entity_id", ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase.from("evidence_items").select("owner_entity_id").in("owner_entity_id", ids)
      : Promise.resolve({ data: [] }),
  ]);

  const profileById = new Map<string, {
    display_name: string;
    subtitle?: string | null;
    country_code?: string | null;
    region?: string | null;
    city?: string | null;
  }>();

  for (const p of professionals ?? []) {
    profileById.set(p.entity_id, {
      display_name: p.display_name,
      subtitle: p.professional_title,
      country_code: p.country_code,
      region: p.region,
      city: p.city,
    });
  }

  for (const p of workshops ?? []) {
    profileById.set(p.entity_id, {
      display_name: p.display_name,
      subtitle: p.craft_sector,
      country_code: p.country_code,
      region: p.region,
      city: p.city,
    });
  }

  const claimCounts = new Map<string, number>();
  for (const row of claimRows ?? []) {
    claimCounts.set(row.entity_id, (claimCounts.get(row.entity_id) ?? 0) + 1);
  }

  const evidenceCounts = new Map<string, number>();
  for (const row of evidenceRows ?? []) {
    evidenceCounts.set(row.owner_entity_id, (evidenceCounts.get(row.owner_entity_id) ?? 0) + 1);
  }

  const needle = (filters.q ?? "").trim().toLowerCase();
  const visible = (entities ?? []).filter((entity) => {
    if (!needle) return true;
    const profile = profileById.get(entity.id);
    const haystack = [
      formatId(entity.craftid_number, entity.craftid_check_digits),
      String(entity.craftid_number),
      profile?.display_name,
      profile?.subtitle,
      profile?.city,
      profile?.region,
      profile?.country_code,
      entity.owner_user_id,
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(needle);
  });

  return (
    <main className="adminPage">
      <div className="adminPageHeader adminPageHeaderRow">
        <div>
          <div className="eyebrow">Core registry</div>
          <h1>CraftID Registry</h1>
          <p>Search, inspect and administer professional and workshop identity records.</p>
        </div>
        <Link className="button" href="/admin/identifiers">Manual identifier assignment</Link>
      </div>

      <form className="adminFilters" method="get">
        <label>
          Search
          <input name="q" defaultValue={filters.q ?? ""} placeholder="CraftID, name, city, owner UUID…" />
        </label>
        <label>
          Status
          <select name="status" defaultValue={filters.status ?? ""}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="suspended">Suspended</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label>
          Type
          <select name="type" defaultValue={filters.type ?? ""}>
            <option value="">All types</option>
            <option value="professional">Professional</option>
            <option value="workshop">Workshop</option>
          </select>
        </label>
        <button className="button buttonPrimary" type="submit">Apply filters</button>
      </form>

      <div className="adminRegistrySummary">
        <span>{visible.length} records shown</span>
        <span>Maximum 500 records per operational view</span>
      </div>

      <section className="adminTable">
        <div className="adminTableHead adminRegistryColumns">
          <span>CraftID / Name</span>
          <span>Type</span>
          <span>Location</span>
          <span>Claims</span>
          <span>Evidence</span>
          <span>Status</span>
          <span>Updated</span>
        </div>

        {visible.length ? visible.map((entity) => {
          const profile = profileById.get(entity.id);
          const location = [profile?.city, profile?.region, profile?.country_code].filter(Boolean).join(", ") || "—";
          return (
            <Link
              className="adminTableRow adminRegistryColumns"
              href={`/admin/registry/${entity.id}`}
              key={entity.id}
            >
              <div className="adminRegistryIdentity">
                <strong>{formatId(entity.craftid_number, entity.craftid_check_digits)}</strong>
                <span>{profile?.display_name ?? "Profile not completed"}</span>
                {profile?.subtitle ? <small>{profile.subtitle}</small> : null}
              </div>
              <span>{entity.entity_type}</span>
              <span>{location}</span>
              <span>{claimCounts.get(entity.id) ?? 0}</span>
              <span>{evidenceCounts.get(entity.id) ?? 0}</span>
              <span className={`adminStatus adminStatus-${entity.public_status}`}>{entity.public_status}</span>
              <span>{new Date(entity.updated_at).toLocaleDateString("en-GB")}</span>
            </Link>
          );
        }) : (
          <p className="emptyState adminEmptyTable">No CraftID records match the current filters.</p>
        )}
      </section>
    </main>
  );
}
