import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatId(number: number | string, check: string) {
  return `#${String(number).padStart(8, "0")}-${check}`;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin" && role !== "reviewer") redirect("/my-craftid");

  const [
    totalEntities,
    draftEntities,
    publishedEntities,
    evidencePending,
    openRequests,
    activeReferrals,
    issuedCertificates,
    recentEntities,
    recentAudit,
  ] = await Promise.all([
    supabase.from("craftid_entities").select("id", { count: "exact", head: true }),
    supabase.from("craftid_entities").select("id", { count: "exact", head: true }).eq("public_status", "draft"),
    supabase.from("craftid_entities").select("id", { count: "exact", head: true }).eq("public_status", "published"),
    supabase.from("evidence_items").select("id", { count: "exact", head: true }).in("review_status", ["evidence_submitted", "document_reviewed"]),
    supabase.from("contact_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("institutional_referrals").select("id", { count: "exact", head: true }).eq("status", "invited"),
    supabase.from("craftid_certificates").select("id", { count: "exact", head: true }).eq("status", "issued"),
    supabase
      .from("craftid_entities")
      .select("id, craftid_number, craftid_check_digits, entity_type, public_status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("audit_events")
      .select("id, entity_id, action, old_status, new_status, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const entityIds = [...new Set([
    ...(recentEntities.data ?? []).map((e) => e.id),
    ...(recentAudit.data ?? []).map((e) => e.entity_id).filter(Boolean),
  ])] as string[];

  const { data: entities } = entityIds.length
    ? await supabase
        .from("craftid_entities")
        .select("id, craftid_number, craftid_check_digits, entity_type")
        .in("id", entityIds)
    : { data: [] as Array<{ id: string; craftid_number: number; craftid_check_digits: string; entity_type: string }> };

  const entityById = new Map((entities ?? []).map((e) => [e.id, e]));

  const metrics = [
    ["Total CraftIDs", totalEntities.count ?? 0, "/admin/registry"],
    ["Draft records", draftEntities.count ?? 0, "/admin/registry?status=draft"],
    ["Published", publishedEntities.count ?? 0, "/admin/registry?status=published"],
    ["Evidence requiring attention", evidencePending.count ?? 0, "/admin/review"],
    ["Pending contact requests", openRequests.count ?? 0, "/admin"],
    ["Open institutional invitations", activeReferrals.count ?? 0, "/admin/referrals"],
    ["Issued certificates", issuedCertificates.count ?? 0, "/admin/certificates"],
  ] as const;

  return (
    <main className="adminPage">
      <div className="adminPageHeader">
        <div>
          <div className="eyebrow">Operations overview</div>
          <h1>Administration dashboard</h1>
          <p>Operational status of the CraftID registry, review workflow and institutional interactions.</p>
        </div>
      </div>

      <section className="adminMetricGrid">
        {metrics.map(([label, value, href]) => (
          <Link className="adminMetric" href={href} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>Open →</small>
          </Link>
        ))}
      </section>

      <div className="adminDashboardGrid">
        <section className="adminPanel">
          <div className="adminPanelHeader">
            <div>
              <div className="eyebrow">Registry</div>
              <h2>Recent CraftIDs</h2>
            </div>
            {role === "admin" ? <Link href="/admin/registry">View registry →</Link> : null}
          </div>

          <div className="adminTable adminTableCompact">
            <div className="adminTableHead">
              <span>CraftID</span><span>Type</span><span>Status</span><span>Created</span>
            </div>
            {(recentEntities.data ?? []).map((entity) => (
              <Link
                className="adminTableRow"
                href={role === "admin" ? `/admin/registry/${entity.id}` : "/admin/review"}
                key={entity.id}
              >
                <strong>{formatId(entity.craftid_number, entity.craftid_check_digits)}</strong>
                <span>{entity.entity_type}</span>
                <span className={`adminStatus adminStatus-${entity.public_status}`}>{entity.public_status}</span>
                <span>{new Date(entity.created_at).toLocaleDateString("en-GB")}</span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="adminPanel">
          <div className="adminPanelHeader">
            <div>
              <div className="eyebrow">Audit trail</div>
              <h2>Recent activity</h2>
            </div>
          </div>

          <div className="adminActivityList">
            {(recentAudit.data ?? []).length ? (recentAudit.data ?? []).map((event) => {
              const entity = event.entity_id ? entityById.get(event.entity_id) : undefined;
              return (
                <article key={event.id}>
                  <span className="recordId">
                    {entity ? formatId(entity.craftid_number, entity.craftid_check_digits) : "System"}
                  </span>
                  <strong>{event.action.replaceAll("_", " ")}</strong>
                  <small>
                    {event.old_status && event.new_status ? `${event.old_status} → ${event.new_status} · ` : ""}
                    {new Date(event.created_at).toLocaleString("en-GB")}
                  </small>
                </article>
              );
            }) : <p className="emptyState">No recent audit events.</p>}
          </div>
        </aside>
      </div>
    </main>
  );
}
