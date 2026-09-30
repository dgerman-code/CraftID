import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { removeStaffRole, setStaffRole } from "./actions";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ error?: string; message?: string; email?: string }> };

type StaffMember = {
  user_id: string;
  email: string | null;
  role: "admin" | "reviewer";
  created_at: string;
};

type AuthLookup = {
  user_id: string;
  email: string;
  current_role: "admin" | "reviewer" | null;
  created_at: string;
  email_confirmed: boolean;
};

export default async function UsersAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  const { data: staffData, error } = await supabase.rpc("admin_list_staff");
  if (error) throw new Error(error.message);
  const staff = (staffData ?? []) as StaffMember[];

  const lookupEmail = String(sp.email ?? "").trim().toLowerCase();
  let lookup: AuthLookup | null = null;
  let lookupError: string | null = null;

  if (lookupEmail) {
    const { data, error: findError } = await supabase.rpc(
      "admin_find_auth_user_by_email",
      { p_email: lookupEmail },
    );

    if (findError) {
      lookupError = findError.message;
    } else {
      lookup = ((data ?? [])[0] ?? null) as AuthLookup | null;
    }
  }

  return (
    <main className="adminPage">
      <div className="adminPageHeader">
        <div className="eyebrow">Access governance</div>
        <h1>Users & Roles</h1>
        <p>Manage CraftID administrative and reviewer access. Role changes are written to the audit trail. The last administrator cannot be removed.</p>
      </div>

      {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
      {sp.message ? <p className="formMessage">Access role updated.</p> : null}

      <section className="adminPanel">
        <div className="adminPanelHeader"><div><div className="eyebrow">Current staff</div><h2>Administrative access</h2></div><span>{staff.length}</span></div>
        <div className="adminTable">
          <div className="adminTableHead adminUsersColumns"><span>Email / User</span><span>Role</span><span>Since</span><span>Actions</span></div>
          {staff.map((member) => (
            <div className="adminTableRow adminUsersColumns" key={member.user_id}>
              <div className="adminRegistryIdentity"><strong>{member.email ?? "No email"}</strong><small>{member.user_id}</small></div>
              <span className="adminStatus">{member.role === "admin" ? "Platform Admin" : "Platform Reviewer"}</span>
              <span>{new Date(member.created_at).toLocaleDateString("en-GB")}</span>
              <div className="adminInlineActions">
                <form action={setStaffRole}>
                  <input type="hidden" name="userId" value={member.user_id} />
                  <input type="hidden" name="role" value={member.role === "admin" ? "reviewer" : "admin"} />
                  <button className="textButton" type="submit">{member.role === "admin" ? "Make Platform Reviewer" : "Make Platform Admin"}</button>
                </form>
                <form action={removeStaffRole}>
                  <input type="hidden" name="userId" value={member.user_id} />
                  <button className="textButton dangerText" type="submit">Remove access</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="adminPanel staffAccessPanel">
        <div className="adminPanelHeader">
          <div>
            <div className="eyebrow">Grant access</div>
            <h2>Add staff access by email</h2>
          </div>
        </div>
        <p className="fieldHelp">
          Find an existing CraftID authentication account by its exact email address.
          Staff access does not create a new login account.
        </p>

        <form className="staffLookupForm" method="get">
          <label>
            Email
            <input
              name="email"
              type="email"
              required
              defaultValue={lookupEmail}
              placeholder="reviewer@organisation.eu"
            />
          </label>
          <button className="button" type="submit">Find user</button>
        </form>

        {lookupError ? <p className="formMessage error">{lookupError}</p> : null}

        {lookupEmail && !lookup && !lookupError ? (
          <div className="adminEmptyStateCard staffLookupResult">
            <strong>Account not found</strong>
            <span>
              No CraftID authentication account exists for <b>{lookupEmail}</b>.
              The person must create and confirm a CraftID login before a staff
              role can be granted.
            </span>
          </div>
        ) : null}

        {lookup ? (
          <div className="staffLookupResult staffLookupFound">
            <div className="staffLookupIdentity">
              <div>
                <span className="recordId">Account found</span>
                <strong>{lookup.email}</strong>
                <small>User ID · {lookup.user_id}</small>
              </div>
              <div className="staffLookupMeta">
                <span>
                  Email {lookup.email_confirmed ? "confirmed" : "not confirmed"}
                </span>
                <span>
                  Current access ·{" "}
                  {lookup.current_role === "admin"
                    ? "Platform Admin"
                    : lookup.current_role === "reviewer"
                      ? "Platform Reviewer"
                      : "No staff role"}
                </span>
              </div>
            </div>

            <form className="staffGrantResolved" action={setStaffRole}>
              <input type="hidden" name="userId" value={lookup.user_id} />
              <label>
                Role
                <select name="role" defaultValue={lookup.current_role ?? "reviewer"}>
                  <option value="reviewer">Platform Reviewer</option>
                  <option value="admin">Platform Admin</option>
                </select>
              </label>
              <button className="button buttonPrimary" type="submit">
                {lookup.current_role ? "Update access" : "Grant access"}
              </button>
            </form>
          </div>
        ) : null}
      </section>
    </main>
  );
}
