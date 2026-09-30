import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PartnerEditor } from "../partner-editor";
import {
  type AdminPartner,
  type PrivateDetails,
  partnerMessageCopy,
  partnerRoleLabels,
} from "../partner-types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function EditPartnerPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  const [
    { data: partnersData, error },
    { data: privateData, error: privateError },
  ] = await Promise.all([
    supabase.rpc("admin_partner_organisations"),
    supabase.rpc("admin_partner_private_details"),
  ]);

  if (error) throw new Error(error.message);
  if (privateError) throw new Error(privateError.message);

  const partner = ((partnersData ?? []) as AdminPartner[]).find((item) => item.id === id);
  if (!partner) notFound();

  const privateDetails =
    ((privateData ?? []) as PrivateDetails[]).find(
      (item) => item.partner_organisation_id === id,
    ) ?? null;

  const logoUrl = partner.logo_path
    ? supabase.storage.from("partner-logos").getPublicUrl(partner.logo_path).data.publicUrl
    : null;

  return (
    <main className="adminPage partnerEditorAdminPage">
      <Link className="backLink" href="/admin/partners">← Countries & Partners</Link>

      <div className="partnerEditorHero">
        <div>
          <div className="eyebrow">Partner organisation</div>
          <h1>{partner.short_name_en || partner.legal_name_en}</h1>
          <p>{partner.legal_name_en}</p>
        </div>
        <div className="partnerEditorHeroStatus">
          <span>{partner.country_code} · {partnerRoleLabels[partner.partner_role] ?? partner.partner_role}</span>
          <span className={partner.is_public ? "adminStatus adminStatus-published" : "adminStatus adminStatus-draft"}>
            {partner.is_public ? "Public" : "Hidden"}
          </span>
        </div>
      </div>

      {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
      {sp.message ? (
        <p className="formMessage">{partnerMessageCopy[sp.message] ?? "Partner organisation updated."}</p>
      ) : null}

      <PartnerEditor partner={partner} privateDetails={privateDetails} logoUrl={logoUrl} />
    </main>
  );
}
