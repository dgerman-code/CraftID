import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateRegistryStatus } from "./actions";
import { formatCraftIdWithHash } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ entityId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

const formatId = formatCraftIdWithHash;

export default async function RegistryDetailPage({ params, searchParams }: Props) {
  const { entityId } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  const { data: entity } = await supabase
    .from("craftid_entities")
    .select("id, craftid_number, craftid_check_digits, entity_type, public_status, owner_user_id, created_at, updated_at")
    .eq("id", entityId)
    .maybeSingle();

  if (!entity) notFound();

  const profileResult = entity.entity_type === "professional"
    ? await supabase
        .from("professional_profiles")
        .select("display_name, professional_title, country_code, region, city, about, languages, cooperation_interests, profile_photo_path, created_at, updated_at")
        .eq("entity_id", entity.id)
        .single()
    : await supabase
        .from("workshop_profiles")
        .select("display_name, craft_sector, country_code, region, city, about, website_url, capabilities, production_capacity, profile_photo_path, created_at, updated_at")
        .eq("entity_id", entity.id)
        .single();

  const profile = profileResult.data as Record<string, unknown> | null;

  const [
    claimsResult,
    evidenceResult,
    observationsResult,
    privacyResult,
    contactsResult,
    requestsResult,
    referralsResult,
    auditResult,
  ] = await Promise.all([
    supabase
      .from("claims")
      .select("id, claim_type, title, status, visibility, created_at")
      .eq("entity_id", entity.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("evidence_items")
      .select("id, evidence_type, title, issuer, visibility, review_status, retention_status, uploaded_at")
      .eq("owner_entity_id", entity.id)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("current_observations")
      .select("id, indicator_key, value, provenance_status, observed_at, reviewed_at, review_valid_until")
      .eq("entity_id", entity.id)
      .order("observed_at", { ascending: false }),
    supabase
      .from("privacy_settings")
      .select("show_profile_photo, show_city, show_languages, show_portfolio, show_qualifications, location_precision, updated_at")
      .eq("entity_id", entity.id)
      .maybeSingle(),
    supabase
      .from("entity_contact_points")
      .select("id, contact_type, value, show_in_public_profile, share_with_institutional_partners, verification_level, verified_at, verification_expires_at, is_primary")
      .eq("entity_id", entity.id)
      .order("contact_type", { ascending: true }),
    supabase
      .from("contact_requests")
      .select("id, requester_name, requester_organisation, purpose, status, submitted_at")
      .eq("target_entity_id", entity.id)
      .order("submitted_at", { ascending: false })
      .limit(20),
    supabase
      .from("institutional_referrals")
      .select("id, requester_organisation, opportunity_type, title, status, response_deadline, created_at")
      .eq("target_entity_id", entity.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("audit_events")
      .select("id, action, old_status, new_status, metadata, created_at")
      .eq("entity_id", entity.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const claims = claimsResult.data ?? [];
  const evidence = evidenceResult.data ?? [];
  const observations = observationsResult.data ?? [];
  const contacts = contactsResult.data ?? [];
  const requests = requestsResult.data ?? [];
  const referrals = referralsResult.data ?? [];
  const audit = auditResult.data ?? [];

  const displayName = String(profile?.display_name ?? "Profile not completed");
  const subtitle = String(profile?.professional_title ?? profile?.craft_sector ?? "");
  const location = [profile?.city, profile?.region, profile?.country_code].filter(Boolean).join(", ") || "—";
  const publicId = formatId(entity.craftid_number, entity.craftid_check_digits);
  const publicRouteId = publicId.replace("#", "");

  const publicationGate = [
    { label: "Display name", ok: displayName !== "Profile not completed" },
    { label: "Professional title / craft sector", ok: Boolean(subtitle) },
    { label: "Public location", ok: Boolean(profile?.country_code || profile?.region || profile?.city) },
    { label: "At least one skill claim", ok: claims.some((claim) => claim.claim_type === "skill") },
    { label: "Privacy settings", ok: Boolean(privacyResult.data) },
  ];
  const publicationGatePass = publicationGate.every((item) => item.ok);

  return (
    <main className="adminPage">
      <div className="adminBreadcrumbs">
        <Link href="/admin/registry">CraftID Registry</Link>
        <span>/</span>
        <span>{publicId}</span>
      </div>

      <div className="adminEntityHeader">
        <div>
          <div className="recordId">{entity.entity_type} · {publicId}</div>
          <h1>{displayName}</h1>
          <p>{subtitle || "No professional title or craft sector recorded."}</p>
          <div className="adminEntityMeta">
            <span>{location}</span>
            <span>Owner UUID: {entity.owner_user_id}</span>
            <span>Created {new Date(entity.created_at).toLocaleDateString("en-GB")}</span>
          </div>
        </div>

        <div className="adminEntityState">
          <span>Status</span>
          <strong className={`adminStatus adminStatus-${entity.public_status}`}>{entity.public_status}</strong>
          {entity.public_status === "published" ? (
            <Link href={`/id/${publicRouteId}`} target="_blank">Open public profile ↗</Link>
          ) : null}
        </div>
      </div>

      {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
      {sp.message ? <p className="formMessage">Status updated and recorded in the audit trail.</p> : null}

      <div className={`adminGateBanner ${publicationGatePass ? "pass" : "blocked"}`}>
        <div>
          <div className="eyebrow">Publication gate</div>
          <strong>{publicationGatePass ? "PASS" : "BLOCKED"}</strong>
        </div>
        <p>
          {publicationGatePass
            ? "This record meets the minimum integrity requirements for public registry publication. This is not a certification decision."
            : "Publication is blocked until the missing minimum registry fields below are completed. Evidence review is not required for publication."}
        </p>
      </div>

      <section className="adminReadinessGrid">
        {publicationGate.map((item) => (
          <article key={item.label} className={item.ok ? "ready" : "missing"}>
            <span>{item.label}</span>
            <strong>{item.ok ? "Ready" : "Missing"}</strong>
          </article>
        ))}
      </section>

      <div className="adminDetailGrid">
        <div className="adminDetailMain">
          <section className="adminPanel">
            <div className="adminPanelHeader">
              <div>
                <div className="eyebrow">Profile</div>
                <h2>Identity record</h2>
              </div>
            </div>
            <dl className="adminDefinitionGrid">
              <div><dt>Display name</dt><dd>{displayName}</dd></div>
              <div><dt>Role / sector</dt><dd>{subtitle || "—"}</dd></div>
              <div><dt>Entity type</dt><dd>{entity.entity_type}</dd></div>
              <div><dt>Location</dt><dd>{location}</dd></div>
              <div className="wide"><dt>About</dt><dd>{String(profile?.about ?? "—")}</dd></div>
            </dl>
          </section>

          <section className="adminPanel">
            <div className="adminPanelHeader">
              <div>
                <div className="eyebrow">Claims</div>
                <h2>Skills and professional claims</h2>
              </div>
              <span>{claims.length}</span>
            </div>
            <div className="adminRecordList">
              {claims.length ? claims.map((claim) => (
                <article key={claim.id}>
                  <div>
                    <span className="recordId">{claim.claim_type}</span>
                    <strong>{claim.title}</strong>
                  </div>
                  <div className="adminRecordMeta">
                    <span>{claim.status.replaceAll("_", " ")}</span>
                    <span>{claim.visibility}</span>
                  </div>
                </article>
              )) : <p className="emptyState">No claims recorded.</p>}
            </div>
          </section>

          <section className="adminPanel">
            <div className="adminPanelHeader">
              <div>
                <div className="eyebrow">Evidence</div>
                <h2>Supporting material</h2>
              </div>
              <span>{evidence.length}</span>
            </div>
            <div className="adminRecordList">
              {evidence.length ? evidence.map((item) => (
                <article key={item.id}>
                  <div>
                    <span className="recordId">{item.evidence_type}</span>
                    <strong>{item.title}</strong>
                    {item.issuer ? <small>{item.issuer}</small> : null}
                  </div>
                  <div className="adminRecordMeta">
                    <span>{item.review_status.replaceAll("_", " ")}</span>
                    <span>{item.visibility}</span>
                  </div>
                </article>
              )) : <p className="emptyState">No evidence submitted.</p>}
            </div>
          </section>

          <section className="adminPanel">
            <div className="adminPanelHeader">
              <div>
                <div className="eyebrow">Intelligence</div>
                <h2>Current observations</h2>
              </div>
              <span>{observations.length}</span>
            </div>
            <div className="adminRecordList">
              {observations.length ? observations.map((obs) => (
                <article key={obs.id}>
                  <div>
                    <span className="recordId">{obs.indicator_key}</span>
                    <strong>{typeof obs.value === "string" ? obs.value : JSON.stringify(obs.value)}</strong>
                  </div>
                  <div className="adminRecordMeta">
                    <span>{obs.provenance_status.replaceAll("_", " ")}</span>
                    <span>{new Date(obs.observed_at).toLocaleDateString("en-GB")}</span>
                  </div>
                </article>
              )) : <p className="emptyState">No current observations recorded.</p>}
            </div>
          </section>

          <section className="adminPanel">
            <div className="adminPanelHeader">
              <div>
                <div className="eyebrow">Audit</div>
                <h2>Record history</h2>
              </div>
              <span>{audit.length}</span>
            </div>
            <div className="adminActivityList">
              {audit.length ? audit.map((event) => (
                <article key={event.id}>
                  <span className="recordId">{new Date(event.created_at).toLocaleString("en-GB")}</span>
                  <strong>{event.action.replaceAll("_", " ")}</strong>
                  <small>
                    {event.old_status && event.new_status ? `${event.old_status} → ${event.new_status}` : ""}
                  </small>
                </article>
              )) : <p className="emptyState">No audit events recorded.</p>}
            </div>
          </section>
        </div>

        <aside className="adminDetailAside">
          <section className="adminPanel">
            <div className="eyebrow">Publication control</div>
            <h2>Registry status</h2>
            <p className="fieldHelp">
              Status changes are administrative actions and are written to the audit trail. Publication does not imply certification.
            </p>
            <form className="adminStatusForm" action={updateRegistryStatus}>
              <input type="hidden" name="entityId" value={entity.id} />
              <label>
                New status
                <select name="status" defaultValue={entity.public_status}>
                  <option value="draft">Draft</option>
                  <option value="published" disabled={!publicationGatePass && entity.public_status !== "published"}>
                    Published{!publicationGatePass && entity.public_status !== "published" ? " — blocked by gate" : ""}
                  </option>
                  <option value="suspended">Suspended</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label>
                Administrative reason
                <textarea name="reason" rows={4} required minLength={4} placeholder="Required for the audit trail." />
              </label>
              <button className="button buttonPrimary" type="submit">Record status change</button>
            </form>
          </section>

          <section className="adminPanel">
            <div className="eyebrow">Privacy</div>
            <h2>Disclosure settings</h2>
            <dl className="adminDefinitionList">
              <div><dt>Location precision</dt><dd>{privacyResult.data?.location_precision ?? "—"}</dd></div>
              <div><dt>Profile photo</dt><dd>{privacyResult.data?.show_profile_photo ? "Public" : "Private"}</dd></div>
              <div><dt>Languages</dt><dd>{privacyResult.data?.show_languages ? "Public" : "Private"}</dd></div>
              <div><dt>Qualifications</dt><dd>{privacyResult.data?.show_qualifications ? "Public" : "Private"}</dd></div>
            </dl>
          </section>

          <section className="adminPanel">
            <div className="eyebrow">Contact points</div>
            <h2>Disclosure & verification</h2>
            <div className="adminMiniList">
              {contacts.length ? contacts.map((contact) => (
                <article key={contact.id}>
                  <strong>{contact.contact_type}</strong>
                  <span>{contact.value}</span>
                  <small>
                    {contact.verification_level} · public {contact.show_in_public_profile ? "yes" : "no"} · institutional {contact.share_with_institutional_partners ? "yes" : "no"}
                  </small>
                </article>
              )) : <p className="emptyState">No professional contacts.</p>}
            </div>
          </section>

          <section className="adminPanel">
            <div className="eyebrow">Interactions</div>
            <h2>Requests & referrals</h2>
            <dl className="adminDefinitionList">
              <div><dt>Contact requests</dt><dd>{requests.length}</dd></div>
              <div><dt>Institutional referrals</dt><dd>{referrals.length}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </main>
  );
}
