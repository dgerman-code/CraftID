import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCraftIdWithHash } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";

const formatId = formatCraftIdWithHash;

export default async function PublicationQueuePage() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  const { data: entities } = await supabase
    .from("craftid_entities")
    .select("id, craftid_number, craftid_check_digits, entity_type, public_status, updated_at")
    .in("public_status", ["draft", "suspended"])
    .order("updated_at", { ascending: false })
    .limit(250);

  const ids = (entities ?? []).map((e) => e.id);

  const [{ data: professionals }, { data: workshops }, { data: claims }, { data: evidence }, { data: privacy }] = await Promise.all([
    ids.length ? supabase.from("professional_profiles").select("entity_id, display_name, professional_title, country_code, region, city").in("entity_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("workshop_profiles").select("entity_id, display_name, craft_sector, country_code, region, city").in("entity_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("claims").select("entity_id, claim_type").in("entity_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("evidence_items").select("owner_entity_id").in("owner_entity_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("privacy_settings").select("entity_id").in("entity_id", ids) : Promise.resolve({ data: [] }),
  ]);

  const profiles = new Map<string, { name: string; subtitle?: string | null; location: string }>();
  for (const p of professionals ?? []) {
    profiles.set(p.entity_id, {
      name: p.display_name,
      subtitle: p.professional_title,
      location: [p.city, p.region, p.country_code].filter(Boolean).join(", "),
    });
  }
  for (const p of workshops ?? []) {
    profiles.set(p.entity_id, {
      name: p.display_name,
      subtitle: p.craft_sector,
      location: [p.city, p.region, p.country_code].filter(Boolean).join(", "),
    });
  }

  const skillSet = new Set(
    (claims ?? []).filter((row) => row.claim_type === "skill").map((row) => row.entity_id),
  );
  const evidenceCount = new Map<string, number>();
  for (const row of evidence ?? []) evidenceCount.set(row.owner_entity_id, (evidenceCount.get(row.owner_entity_id) ?? 0) + 1);
  const privacySet = new Set((privacy ?? []).map((row) => row.entity_id));

  const rows = (entities ?? []).map((entity) => {
    const profile = profiles.get(entity.id);
    const checks = [
      Boolean(profile?.name),
      Boolean(profile?.subtitle),
      Boolean(profile?.location),
      skillSet.has(entity.id),
      privacySet.has(entity.id),
    ];
    const ready = checks.filter(Boolean).length;
    return { entity, profile, ready, total: checks.length };
  }).sort((a,b) => b.ready - a.ready);

  return (
    <main className="adminPage">
      <div className="adminPageHeader">
        <div className="eyebrow">Publication governance</div>
        <h1>Publication Queue</h1>
        <p>Minimum integrity gate for draft and suspended CraftID records. A record needs a name, professional title or craft sector, public location, at least one skill claim and privacy settings. Evidence review is not required for publication, and publication does not imply certification.</p>
      </div>

      <section className="adminTable">
        <div className="adminTableHead adminPublicationColumns">
          <span>CraftID / Name</span><span>Type</span><span>Location</span><span>Readiness</span><span>Status</span><span>Updated</span>
        </div>
        {rows.length ? rows.map(({ entity, profile, ready, total }) => (
          <Link className="adminTableRow adminPublicationColumns" href={`/admin/registry/${entity.id}`} key={entity.id}>
            <div className="adminRegistryIdentity">
              <strong>{formatId(entity.craftid_number, entity.craftid_check_digits)}</strong>
              <span>{profile?.name ?? "Profile not completed"}</span>
              {profile?.subtitle ? <small>{profile.subtitle}</small> : null}
            </div>
            <span>{entity.entity_type}</span>
            <span>{profile?.location || "—"}</span>
            <span>{ready}/{total}</span>
            <span className={`adminStatus adminStatus-${entity.public_status}`}>{entity.public_status}</span>
            <span>{new Date(entity.updated_at).toLocaleDateString("en-GB")}</span>
          </Link>
        )) : <p className="emptyState adminEmptyTable">No draft or suspended records.</p>}
      </section>
    </main>
  );
}
