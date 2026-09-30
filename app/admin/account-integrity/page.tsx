import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCraftIdWithHash } from "@/lib/craftid-format";
import { resolveDuplicateCraftId } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

type AccountRow = {
  user_id: string;
  email: string | null;
  email_confirmed: boolean;
  account_created_at: string;
  last_sign_in_at: string | null;
  active_entity_count: number;
  archived_entity_count: number;
  professional_entity_id: string | null;
  professional_craftid_number: number | null;
  professional_check_digits: string | null;
  professional_status: string | null;
  workshop_entity_id: string | null;
  workshop_craftid_number: number | null;
  workshop_check_digits: string | null;
  workshop_status: string | null;
};

type SupersessionRow = {
  source_user_id: string;
  source_email: string | null;
  target_user_id: string;
  target_email: string | null;
  reason: string;
  created_at: string;
};

type ActiveEntity = {
  entityId: string;
  entityType: "professional" | "workshop";
  craftId: string;
  ownerUserId: string;
  ownerEmail: string | null;
  status: string | null;
};

function craftId(number: number | null, digits: string | null) {
  if (number == null || !digits) return null;
  return formatCraftIdWithHash(number, digits);
}

export default async function AccountIntegrityPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  const [
    { data, error },
    { data: supersessionData, error: supersessionError },
  ] = await Promise.all([
    supabase.rpc("admin_list_account_integrity"),
    supabase.rpc("admin_list_account_supersessions"),
  ]);

  if (error) throw new Error(error.message);
  if (supersessionError) throw new Error(supersessionError.message);

  const rows = (data ?? []) as AccountRow[];
  const supersessions = (supersessionData ?? []) as SupersessionRow[];

  const activeEntities: ActiveEntity[] = rows.flatMap((row) => {
    const entities: ActiveEntity[] = [];
    const professionalId = craftId(
      row.professional_craftid_number,
      row.professional_check_digits,
    );
    const workshopId = craftId(
      row.workshop_craftid_number,
      row.workshop_check_digits,
    );

    if (row.professional_entity_id && professionalId) {
      entities.push({
        entityId: row.professional_entity_id,
        entityType: "professional",
        craftId: professionalId,
        ownerUserId: row.user_id,
        ownerEmail: row.email,
        status: row.professional_status,
      });
    }

    if (row.workshop_entity_id && workshopId) {
      entities.push({
        entityId: row.workshop_entity_id,
        entityType: "workshop",
        craftId: workshopId,
        ownerUserId: row.user_id,
        ownerEmail: row.email,
        status: row.workshop_status,
      });
    }

    return entities;
  });

  const resolutionPanel = (entityType: "professional" | "workshop") => {
    const entities = activeEntities.filter((item) => item.entityType === entityType);
    const title = entityType === "professional"
      ? "Resolve duplicate Professional CraftIDs"
      : "Resolve duplicate Workshop CraftIDs";

    return (
      <section className="adminPanel" key={entityType}>
        <div className="eyebrow">Controlled resolution · destructive action</div>
        <h2>{title}</h2>
        <p className="fieldHelp">
          Use only after confirming that two login accounts refer to the same underlying
          entity. The CraftID selected to keep remains canonical. The other CraftID is
          archived as a historical record. Claims and evidence are never merged.
        </p>

        {entities.length < 2 ? (
          <p className="emptyState">At least two active {entityType} records are required.</p>
        ) : (
          <>
            <div className="adminDangerNotice">
              This action can move a CraftID to another login and archive another CraftID. Use it only after identity ownership has been confirmed.
            </div>
            <form className="adminResolutionForm" action={resolveDuplicateCraftId}>
            <label>
              Canonical CraftID to keep
              <select name="keepEntityId" required defaultValue="">
                <option value="" disabled>Select CraftID</option>
                {entities.map((item) => (
                  <option value={item.entityId} key={"keep-" + item.entityId}>
                    {item.craftId} · {item.ownerEmail ?? item.ownerUserId} · {item.status ?? "—"}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Duplicate CraftID to archive
              <select name="archiveEntityId" required defaultValue="">
                <option value="" disabled>Select CraftID</option>
                {entities.map((item) => (
                  <option value={item.entityId} key={"archive-" + item.entityId}>
                    {item.craftId} · {item.ownerEmail ?? item.ownerUserId} · {item.status ?? "—"}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Login account to retain
              <select name="targetUserId" required defaultValue="">
                <option value="" disabled>Select account</option>
                {rows.map((row) => (
                  <option value={row.user_id} key={row.user_id}>
                    {row.email ?? row.user_id} · {row.active_entity_count} active
                  </option>
                ))}
              </select>
            </label>

            <label className="adminResolutionWide">
              Administrative reason
              <textarea
                name="reason"
                rows={4}
                minLength={12}
                required
                placeholder="Explain how account ownership was confirmed and why these records are duplicates."
              />
            </label>

            <label>
              Confirmation
              <input
                name="confirmation"
                required
                autoComplete="off"
                placeholder="Type RESOLVE"
              />
            </label>

            <div className="adminResolutionSubmit">
              <button className="button dangerButton" type="submit">
                Resolve duplicate CraftID
              </button>
              <small>
                If the canonical CraftID moves to the retained login, it is reset to
                Draft and public/privacy consent is reset for review.
              </small>
            </div>
            </form>
          </>
        )}
      </section>
    );
  };

  return (
    <main className="adminPage">
      <div className="adminPageHeader">
        <div className="eyebrow">Identity & access governance</div>
        <h1>Account Integrity</h1>
        <p>
          Review authentication accounts and the CraftID records attached to them.
          Different login emails are not assumed to belong to the same person, and
          CraftID never auto-merges records across accounts.
        </p>
      </div>

      {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
      {sp.message ? <p className="formMessage">{sp.message}</p> : null}

      <section className="adminWorkflowSteps">
        <article>
          <span>1</span>
          <div><strong>Review accounts</strong><small>Confirm the emails and CraftIDs that may refer to the same underlying person or workshop.</small></div>
        </article>
        <article>
          <span>2</span>
          <div><strong>Confirm ownership</strong><small>Use external or administrative evidence. CraftID never infers duplicate ownership automatically.</small></div>
        </article>
        <article>
          <span>3</span>
          <div><strong>Resolve only when certain</strong><small>Keep one canonical CraftID, archive the duplicate, and record the reason in the audit trail.</small></div>
        </article>
      </section>

      <section className="adminPanel">
        <div className="adminPanelHeader">
          <div>
            <div className="eyebrow">Account map</div>
            <h2>Login accounts and CraftID records</h2>
          </div>
          <span>{rows.length}</span>
        </div>

        <div className="adminTable">
          <div className="adminTableHead adminAccountIntegrityColumns">
            <span>Login account</span>
            <span>Professional</span>
            <span>Workshop</span>
            <span>Archive</span>
            <span>Last sign-in</span>
          </div>

          {rows.length ? rows.map((row) => {
            const professionalId = craftId(
              row.professional_craftid_number,
              row.professional_check_digits,
            );
            const workshopId = craftId(
              row.workshop_craftid_number,
              row.workshop_check_digits,
            );

            return (
              <div className="adminTableRow adminAccountIntegrityColumns" key={row.user_id}>
                <div className="adminRegistryIdentity">
                  <strong>{row.email ?? "No email"}</strong>
                  <small>{row.user_id}</small>
                  <small>
                    {row.email_confirmed ? "Email confirmed" : "Email not confirmed"} ·{" "}
                    {row.active_entity_count} active
                  </small>
                </div>

                <div className="adminRegistryIdentity">
                  {row.professional_entity_id && professionalId ? (
                    <>
                      <Link href={"/admin/registry/" + row.professional_entity_id}>
                        <strong>{professionalId}</strong>
                      </Link>
                      <small>{row.professional_status ?? "—"}</small>
                    </>
                  ) : <span>—</span>}
                </div>

                <div className="adminRegistryIdentity">
                  {row.workshop_entity_id && workshopId ? (
                    <>
                      <Link href={"/admin/registry/" + row.workshop_entity_id}>
                        <strong>{workshopId}</strong>
                      </Link>
                      <small>{row.workshop_status ?? "—"}</small>
                    </>
                  ) : <span>—</span>}
                </div>

                <span>{row.archived_entity_count}</span>
                <span>
                  {row.last_sign_in_at
                    ? new Date(row.last_sign_in_at).toLocaleString("en-GB")
                    : "Never"}
                </span>
              </div>
            );
          }) : (
            <p className="emptyState adminEmptyTable">No CraftID-linked accounts.</p>
          )}
        </div>
      </section>

      {resolutionPanel("professional")}
      {resolutionPanel("workshop")}

      <section className="adminPanel">
        <div className="adminPanelHeader">
          <div>
            <div className="eyebrow">Superseded logins</div>
            <h2>Consolidated account history</h2>
          </div>
          <span>{supersessions.length}</span>
        </div>

        {supersessions.length ? (
          <div className="adminMiniList">
            {supersessions.map((item) => (
              <article key={item.source_user_id}>
                <strong>
                  {item.source_email ?? item.source_user_id} →{" "}
                  {item.target_email ?? item.target_user_id}
                </strong>
                <span>{item.reason}</span>
                <small>{new Date(item.created_at).toLocaleString("en-GB")}</small>
              </article>
            ))}
          </div>
        ) : (
          <p className="emptyState">No superseded login accounts.</p>
        )}
      </section>

      <section className="adminPanel">
        <div className="eyebrow">Operating rule</div>
        <h2>No automatic cross-email merging</h2>
        <p className="fieldHelp">
          A second email account can represent the same human in reality, but the
          platform must not infer that. Resolve suspected duplicates only after an
          explicit account-integrity review. CraftID numbers remain permanent and are
          never reused. A duplicate resolution archives one CraftID; it does not copy
          or merge its claims, evidence or certificate history into another CraftID.
        </p>
      </section>
    </main>
  );
}
