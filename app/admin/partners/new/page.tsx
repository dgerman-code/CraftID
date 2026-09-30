import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PartnerEditor } from "../partner-editor";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewPartnerPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  return (
    <main className="adminPage partnerEditorAdminPage">
      <Link className="backLink" href="/admin/partners">← Countries & Partners</Link>
      <div className="adminPageHeader">
        <div className="eyebrow">New partner organisation</div>
        <h1>Add organisation</h1>
        <p>Create the organisation record first, then configure private administration and Partner Workspace access.</p>
      </div>
      {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
      <PartnerEditor />
    </main>
  );
}
