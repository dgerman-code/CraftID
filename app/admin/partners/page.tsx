import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { savePartnerOrganisation } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string; message?: string; edit?: string }>;
};

const roleLabels: Record<string, string> = {
  european_coordinator: "European Coordinator",
  national_coordinating_partner: "National Coordinating Partner",
  sectoral_partner: "Sectoral Partner",
  regional_partner: "Regional Partner",
  vet_skills_partner: "VET / Skills Partner",
  knowledge_partner: "Knowledge Partner",
  ecosystem_partner: "Ecosystem Partner",
};

const statusLabels: Record<string, string> = {
  invited: "Invited",
  in_discussion: "In discussion",
  confirmed: "Confirmed",
  inactive: "Inactive",
};

const agreementLabels: Record<string, string> = {
  none: "No formal instrument",
  draft: "Draft",
  mandate_on_file: "Mandate on file",
  agreement_signed: "Agreement signed",
};

export default async function PartnerAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  const { data: partners, error } = await supabase
    .from("partner_organisations")
    .select("id, legal_name_en, legal_name_uk, short_name_en, short_name_uk, country_code, partner_role, status, agreement_status, website_url, description_en, description_uk, scope_note, is_public, sort_order, updated_at")
    .order("sort_order", { ascending: true })
    .order("legal_name_en", { ascending: true });

  const edit = sp.edit ? (partners ?? []).find((partner) => partner.id === sp.edit) : null;

  return (
    <main className="adminPage">
      <div className="adminPageHeader">
        <div className="eyebrow">European partner network</div>
        <h1>Partner Organisations</h1>
        <p>
          Manage national, sectoral, regional, skills and knowledge partners.
          Lifecycle status and public visibility are controlled separately.
        </p>
      </div>

      {error ? <p className="formMessage error">{error.message}</p> : null}
      {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
      {sp.message ? <p className="formMessage">Partner organisation saved.</p> : null}

      <div className="adminDetailGrid">
        <section className="adminPanel">
          <div className="adminPanelHeader">
            <div>
              <div className="eyebrow">Network</div>
              <h2>Partner register</h2>
            </div>
            <span>{partners?.length ?? 0}</span>
          </div>

          <div className="adminTable">
            <div className="adminTableHead adminPartnerColumns">
              <span>Organisation</span>
              <span>Country / Role</span>
              <span>Status</span>
              <span>Agreement</span>
              <span>Public</span>
              <span></span>
            </div>

            {(partners ?? []).map((partner) => (
              <div className="adminTableRow adminPartnerColumns" key={partner.id}>
                <div className="adminRegistryIdentity">
                  <strong>{partner.short_name_en || partner.legal_name_en}</strong>
                  <span>{partner.legal_name_en}</span>
                  {partner.legal_name_uk ? <small>{partner.legal_name_uk}{partner.short_name_uk ? ` · ${partner.short_name_uk}` : ""}</small> : null}
                </div>
                <div className="adminRegistryIdentity">
                  <strong>{partner.country_code}</strong>
                  <span>{roleLabels[partner.partner_role] ?? partner.partner_role}</span>
                </div>
                <span className={`adminStatus adminStatus-${partner.status}`}>
                  {statusLabels[partner.status] ?? partner.status}
                </span>
                <span>{agreementLabels[partner.agreement_status] ?? partner.agreement_status}</span>
                <span>{partner.is_public ? "Yes" : "No"}</span>
                <a className="textButton" href={`/admin/partners?edit=${partner.id}`}>Edit</a>
              </div>
            ))}

            {!partners?.length ? <p className="emptyState adminEmptyTable">No partner organisations yet.</p> : null}
          </div>
        </section>

        <aside className="adminPanel">
          <div className="eyebrow">{edit ? "Edit partner" : "New partner"}</div>
          <h2>{edit ? edit.legal_name_en : "Add partner organisation"}</h2>

          <form className="adminStatusForm" action={savePartnerOrganisation}>
            <input type="hidden" name="id" value={edit?.id ?? ""} />

            <label>
              English legal name
              <input name="legalNameEn" required defaultValue={edit?.legal_name_en ?? ""} />
            </label>

            <label>
              Ukrainian legal name
              <input name="legalNameUk" defaultValue={edit?.legal_name_uk ?? ""} />
            </label>

            <div className="adminFormSplit">
              <label>
                EN short name
                <input name="shortNameEn" defaultValue={edit?.short_name_en ?? ""} placeholder="HCU-MSMEs" />
              </label>
              <label>
                UA short name
                <input name="shortNameUk" defaultValue={edit?.short_name_uk ?? ""} placeholder="РПУ-ММСП" />
              </label>
            </div>

            <div className="adminFormSplit">
              <label>
                Country code
                <input name="countryCode" required maxLength={2} defaultValue={edit?.country_code ?? ""} placeholder="UA" />
              </label>
              <label>
                Sort order
                <input name="sortOrder" type="number" defaultValue={edit?.sort_order ?? 0} />
              </label>
            </div>

            <label>
              Partner role
              <select name="partnerRole" defaultValue={edit?.partner_role ?? "sectoral_partner"}>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label>
              Relationship status
              <select name="status" defaultValue={edit?.status ?? "invited"}>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label>
              Agreement / mandate status
              <select name="agreementStatus" defaultValue={edit?.agreement_status ?? "none"}>
                {Object.entries(agreementLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label>
              Website
              <input name="websiteUrl" type="url" defaultValue={edit?.website_url ?? ""} placeholder="https://" />
            </label>

            <label>
              English description
              <textarea name="descriptionEn" rows={4} defaultValue={edit?.description_en ?? ""} />
            </label>

            <label>
              Ukrainian description
              <textarea name="descriptionUk" rows={4} defaultValue={edit?.description_uk ?? ""} />
            </label>

            <label>
              Internal scope / mandate note
              <textarea name="scopeNote" rows={4} defaultValue={edit?.scope_note ?? ""} />
            </label>

            <label className="adminCheckbox">
              <input name="isPublic" type="checkbox" defaultChecked={edit?.is_public ?? false} />
              Show publicly
            </label>
            <p className="fieldHelp">Only partners with Confirmed status can be public.</p>

            <button className="button buttonPrimary" type="submit">
              {edit ? "Save changes" : "Add partner"}
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}
