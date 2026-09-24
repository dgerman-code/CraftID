/* eslint-disable @next/next/no-img-element */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { savePartnerOrganisation } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string; message?: string; edit?: string }>;
};

type AdminPartner = {
  id: string;
  legal_name_en: string;
  legal_name_uk: string | null;
  short_name_en: string | null;
  short_name_uk: string | null;
  country_code: string;
  partner_role: string;
  status: string;
  agreement_status: string;
  website_url: string | null;
  description_en: string | null;
  description_uk: string | null;
  scope_note: string | null;
  is_public: boolean;
  sort_order: number;
  logo_path: string | null;
  updated_at: string;
};

const roleLabels: Record<string, string> = {
  national_operator: "National Operator",
  partner: "Partner",
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

  const { data: partnersData, error } = await supabase
    .rpc("admin_partner_organisations");
  const partners = (partnersData ?? []) as AdminPartner[];

  const edit = sp.edit ? partners.find((partner) => partner.id === sp.edit) : null;
  const editLogoUrl = edit?.logo_path
    ? supabase.storage.from("partner-logos").getPublicUrl(edit.logo_path).data.publicUrl
    : null;

  return (
    <main className="adminPage">
      <div className="adminPageHeader">
        <div className="eyebrow">European partner network</div>
        <h1>Partner Organisations</h1>
        <p>
          Manage national operators and partner organisations.
          One confirmed National Operator may be designated per country; multiple Partners may coexist.
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
            <span>{partners.length}</span>
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

            {partners.map((partner) => (
              <div className="adminTableRow adminPartnerColumns" key={partner.id}>
                <div className="adminPartnerIdentityCell">
                  <div className="adminPartnerLogoThumb">
                    {partner.logo_path ? (
                      <img
                        src={supabase.storage.from("partner-logos").getPublicUrl(partner.logo_path).data.publicUrl}
                        alt=""
                      />
                    ) : (
                      <span>{(partner.short_name_en || partner.legal_name_en).slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="adminRegistryIdentity">
                    <strong>{partner.short_name_en || partner.legal_name_en}</strong>
                  <span>{partner.legal_name_en}</span>
                    {partner.legal_name_uk ? <small>{partner.legal_name_uk}{partner.short_name_uk ? ` · ${partner.short_name_uk}` : ""}</small> : null}
                  </div>
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

            {!partners.length ? <p className="emptyState adminEmptyTable">No partner organisations yet.</p> : null}
          </div>
        </section>

        <aside className="adminPanel">
          <div className="eyebrow">{edit ? "Edit partner" : "New partner"}</div>
          <h2>{edit ? edit.legal_name_en : "Add partner organisation"}</h2>

          <form className="adminStatusForm" action={savePartnerOrganisation} encType="multipart/form-data">
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

            <div className="adminPartnerLogoField">
              <div>
                <span className="adminFieldLabel">Organisation logo</span>
                <p className="fieldHelp">PNG, JPG or WebP · max 2 MB. Shown in the public partner network.</p>
              </div>
              <div className="adminPartnerLogoControl">
                <div className="adminPartnerLogoPreview">
                  {editLogoUrl ? <img src={editLogoUrl} alt="" /> : <span>No logo</span>}
                </div>
                <div className="adminPartnerLogoActions">
                  <input name="logo" type="file" accept="image/png,image/jpeg,image/webp" />
                  {edit?.logo_path ? (
                    <label className="adminCheckbox">
                      <input name="removeLogo" type="checkbox" />
                      Remove current logo
                    </label>
                  ) : null}
                </div>
              </div>
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
              <select name="partnerRole" defaultValue={edit?.partner_role ?? "partner"}>
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
