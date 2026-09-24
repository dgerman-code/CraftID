import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { removeStaffRole, setStaffRole } from "./actions";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ error?: string; message?: string }> };

type StaffMember = {
  user_id: string;
  email: string | null;
  role: "admin" | "reviewer";
  created_at: string;
};

export default async function UsersAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  const { data: staffData, error } = await supabase.rpc("admin_list_staff");
  if (error) throw new Error(error.message);
  const staff = (staffData ?? []) as StaffMember[];

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

      <section className="adminPanel">
        <div className="eyebrow">Grant access</div>
        <h2>Add staff role by user UUID</h2>
        <p className="fieldHelp">The account must already exist in CraftID authentication. This does not create a new login account.</p>
        <form className="adminGrantForm" action={setStaffRole}>
          <label>User UUID<input name="userId" required placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></label>
          <label>Role<select name="role" defaultValue="reviewer"><option value="reviewer">Platform Reviewer</option><option value="admin">Platform Admin</option></select></label>
          <button className="button buttonPrimary" type="submit">Grant role</button>
        </form>
      </section>
    </main>
  );
}
