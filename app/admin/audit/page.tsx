import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ action?: string }> };

export default async function AuditCompliancePage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  let query = supabase
    .from("audit_events")
    .select("id, actor_user_id, entity_id, claim_id, evidence_id, action, old_status, new_status, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(250);

  if (sp.action) query = query.eq("action", sp.action);
  const { data: events } = await query;

  const { data: allActions } = await supabase
    .from("audit_events")
    .select("action")
    .limit(1000);

  const actions = [...new Set((allActions ?? []).map((e) => e.action))].sort();

  return (
    <main className="adminPage">
      <div className="adminPageHeader">
        <div className="eyebrow">Governance & accountability</div>
        <h1>Audit & Compliance</h1>
        <p>Administrative history for publication, review, identifier assignment, taxonomy and access-control actions. This log supports accountability; it is not a substitute for legal compliance review.</p>
      </div>

      <form className="adminFilters adminAuditFilters" method="get">
        <label>Action<select name="action" defaultValue={sp.action ?? ""}><option value="">All actions</option>{actions.map((action) => <option key={action} value={action}>{action.replaceAll("_", " ")}</option>)}</select></label>
        <button className="button buttonPrimary" type="submit">Apply</button>
      </form>

      <section className="adminPanel">
        <div className="adminPanelHeader"><div><div className="eyebrow">Audit trail</div><h2>Recent events</h2></div><span>{events?.length ?? 0}</span></div>
        <div className="adminTable">
          <div className="adminTableHead adminAuditColumns"><span>Time</span><span>Action</span><span>Entity / Actor</span><span>Status change</span><span>Metadata</span></div>
          {(events ?? []).map((event) => (
            <div className="adminTableRow adminAuditColumns" key={event.id}>
              <span>{new Date(event.created_at).toLocaleString("en-GB")}</span>
              <strong>{event.action.replaceAll("_", " ")}</strong>
              <div className="adminRegistryIdentity"><small>{event.entity_id ?? "System"}</small><small>{event.actor_user_id ?? "No actor"}</small></div>
              <span>{event.old_status || event.new_status ? `${event.old_status ?? "—"} → ${event.new_status ?? "—"}` : "—"}</span>
              <code className="adminMetadata">{JSON.stringify(event.metadata ?? {})}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="adminPanel">
        <div className="eyebrow">Control notes</div>
        <h2>Current governance controls</h2>
        <div className="adminControlGrid">
          <article><strong>RLS</strong><span>Enabled on core registry, profile, evidence, contact and referral tables.</span></article>
          <article><strong>Publication</strong><span>Admin-only status change with mandatory reason and audit event.</span></article>
          <article><strong>Staff access</strong><span>Admin/reviewer roles managed through protected RPCs; last admin cannot be removed.</span></article>
          <article><strong>Identifiers</strong><span>Immutable public number with MOD-97 check digits; manual assignment audited.</span></article>
        </div>
      </section>
    </main>
  );
}
