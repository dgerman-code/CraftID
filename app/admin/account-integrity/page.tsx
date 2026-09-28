import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCraftIdWithHash } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";

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

function craftId(number: number | null, digits: string | null) {
  if (number == null || !digits) return null;
  return formatCraftIdWithHash(number, digits);
}

export default async function AccountIntegrityPage() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  const { data, error } = await supabase.rpc("admin_list_account_integrity");
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as AccountRow[];

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
                  <small>{row.email_confirmed ? "Email confirmed" : "Email not confirmed"} · {row.active_entity_count} active</small>
                </div>

                <div className="adminRegistryIdentity">
                  {row.professional_entity_id && professionalId ? (
                    <>
                      <Link href={`/admin/registry/${row.professional_entity_id}`}>
                        <strong>{professionalId}</strong>
                      </Link>
                      <small>{row.professional_status ?? "—"}</small>
                    </>
                  ) : <span>—</span>}
                </div>

                <div className="adminRegistryIdentity">
                  {row.workshop_entity_id && workshopId ? (
                    <>
                      <Link href={`/admin/registry/${row.workshop_entity_id}`}>
                        <strong>{workshopId}</strong>
                      </Link>
                      <small>{row.workshop_status ?? "—"}</small>
                    </>
                  ) : <span>—</span>}
                </div>

                <span>{row.archived_entity_count}</span>
                <span>{row.last_sign_in_at ? new Date(row.last_sign_in_at).toLocaleString("en-GB") : "Never"}</span>
              </div>
            );
          }) : (
            <p className="emptyState adminEmptyTable">No CraftID-linked accounts.</p>
          )}
        </div>
      </section>

      <section className="adminPanel">
        <div className="eyebrow">Operating rule</div>
        <h2>No automatic cross-email merging</h2>
        <p className="fieldHelp">
          A second email account can represent the same human in reality, but the
          platform must not infer that. Resolve suspected duplicates only after an
          explicit account-integrity review. CraftID numbers remain permanent and are
          never reused.
        </p>
      </section>
    </main>
  );
}
