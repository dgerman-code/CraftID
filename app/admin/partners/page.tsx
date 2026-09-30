/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  type AdminPartner,
  type PrivateDetails,
  partnerMessageCopy,
  partnerRoleLabels,
} from "./partner-types";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string; message?: string; edit?: string }>;
};

export default async function PartnerAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  if (sp.edit) redirect(`/admin/partners/${encodeURIComponent(sp.edit)}`);

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

  const partners = (partnersData ?? []) as AdminPartner[];
  const privateDetails = (privateData ?? []) as PrivateDetails[];
  const privateByPartner = new Map(
    privateDetails.map((item) => [item.partner_organisation_id, item]),
  );

  const countries = new Set(partners.map((partner) => partner.country_code));
  const operators = partners.filter(
    (partner) => partner.partner_role === "national_operator",
  ).length;
  const portalUsers = privateDetails.reduce(
    (sum, item) => sum + (item.portal_emails?.length ?? 0),
    0,
  );

  return (
    <main className="adminPage partnerRegisterPage">
      <div className="adminPageHeader partnerRegisterHeader">
        <div>
          <div className="eyebrow">CraftID country network</div>
          <h1>Countries & Partners</h1>
          <p>
            Manage National Operators and Country Partners, their private admin
            contacts and Partner Workspace access.
          </p>
        </div>
        <Link className="button buttonPrimary" href="/admin/partners/new">
          + Add organisation
        </Link>
      </div>

      {error ? <p className="formMessage error">{error.message}</p> : null}
      {privateError ? <p className="formMessage error">{privateError.message}</p> : null}
      {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
      {sp.message ? (
        <p className="formMessage">
          {partnerMessageCopy[sp.message] ?? "Partner organisation updated."}
        </p>
      ) : null}

      <section className="partnerRegisterSummary">
        <article><span>Organisations</span><strong>{partners.length}</strong></article>
        <article><span>Countries</span><strong>{countries.size}</strong></article>
        <article><span>National Operators</span><strong>{operators}</strong></article>
        <article><span>Portal users</span><strong>{portalUsers}</strong></article>
      </section>

      <section className="adminPanel partnerRegisterPanel">
        <div className="adminPanelHeader">
          <div>
            <div className="eyebrow">Assigned roles</div>
            <h2>Partner register</h2>
          </div>
          <span>{partners.length}</span>
        </div>

        {partners.length ? (
          <div className="partnerRegisterTable">
            <div className="partnerRegisterTableHead">
              <span>Organisation</span>
              <span>Country / role</span>
              <span>Admin contact</span>
              <span>Portal access</span>
              <span>Public</span>
              <span />
            </div>

            {partners.map((partner) => {
              const details = privateByPartner.get(partner.id);
              const logoUrl = partner.logo_path
                ? supabase.storage.from("partner-logos").getPublicUrl(partner.logo_path).data.publicUrl
                : null;

              return (
                <article className="partnerRegisterRow" key={partner.id}>
                  <div className="partnerRegisterIdentity">
                    <div className="partnerRegisterLogo">
                      {logoUrl ? (
                        <img src={logoUrl} alt="" />
                      ) : (
                        <span>{(partner.short_name_en || partner.legal_name_en).slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <strong>{partner.short_name_en || partner.legal_name_en}</strong>
                      {partner.short_name_en ? <small>{partner.legal_name_en}</small> : null}
                    </div>
                  </div>

                  <div className="partnerRegisterCell">
                    <strong>{partner.country_code}</strong>
                    <small>{partnerRoleLabels[partner.partner_role] ?? partner.partner_role}</small>
                  </div>

                  <div className="partnerRegisterCell">
                    <strong>{details?.contact_name || "—"}</strong>
                    {details?.contact_email ? <small>{details.contact_email}</small> : null}
                  </div>

                  <div className="partnerRegisterCell">
                    <strong>{details?.portal_emails?.length ?? 0}</strong>
                    {details?.portal_emails?.[0] ? <small>{details.portal_emails[0]}</small> : null}
                  </div>

                  <div>
                    <span className={partner.is_public ? "adminStatus adminStatus-published" : "adminStatus adminStatus-draft"}>
                      {partner.is_public ? "Public" : "Hidden"}
                    </span>
                  </div>

                  <Link className="button partnerRegisterEdit" href={`/admin/partners/${partner.id}`}>
                    Edit →
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="adminEmptyStateCard">
            <strong>No partner organisations yet</strong>
            <span>Add the first National Operator or Country Partner.</span>
          </div>
        )}
      </section>
    </main>
  );
}
