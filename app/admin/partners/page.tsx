/* eslint-disable @next/next/no-img-element */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  revokePartnerPortalAccess,
  savePartnerOrganisation,
} from "./actions";

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

type PrivateDetails = {
  partner_organisation_id: string;
  contact_name: string | null;
  contact_title: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  internal_note: string | null;
  portal_emails: string[];
};

const roleLabels: Record<string, string> = {
  national_operator: "National Operator",
  partner: "Country Partner",
};

export default async function PartnerAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
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

  const edit = sp.edit
    ? partners.find((partner) => partner.id === sp.edit)
    : null;
  const editPrivate = edit ? privateByPartner.get(edit.id) : null;
  const editLogoUrl = edit?.logo_path
    ? supabase.storage.from("partner-logos").getPublicUrl(edit.logo_path).data
        .publicUrl
    : null;

  return (
    <main className="adminPage">
      <div className="adminPageHeader">
        <div className="eyebrow">CraftID country network</div>
        <h1>Countries & Partner Roles</h1>
        <p>
          Assign a National Operator or Country Partner to a country, keep a short
          private contact card, and grant selected organisation contacts access to
          publish opportunities for CraftID holders.
        </p>
      </div>

      {error ? <p className="formMessage error">{error.message}</p> : null}
      {privateError ? (
        <p className="formMessage error">{privateError.message}</p>
      ) : null}
      {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
      {sp.message ? (
        <p className="formMessage">Partner organisation saved.</p>
      ) : null}

      <div className="adminDetailGrid">
        <section className="adminPanel">
          <div className="adminPanelHeader">
            <div>
              <div className="eyebrow">Assigned roles</div>
              <h2>Country partner register</h2>
            </div>
            <span>{partners.length}</span>
          </div>

          <div className="adminTable">
            <div className="adminTableHead adminPartnerSimpleColumns">
              <span>Organisation</span>
              <span>Country / Role</span>
              <span>Admin contact</span>
              <span>Portal access</span>
              <span>Public</span>
              <span></span>
            </div>

            {partners.map((partner) => {
              const details = privateByPartner.get(partner.id);
              return (
                <div
                  className="adminTableRow adminPartnerSimpleColumns"
                  key={partner.id}
                >
                  <div className="adminPartnerIdentityCell">
                    <div className="adminPartnerLogoThumb">
                      {partner.logo_path ? (
                        <img
                          src={
                            supabase.storage
                              .from("partner-logos")
                              .getPublicUrl(partner.logo_path).data.publicUrl
                          }
                          alt=""
                        />
                      ) : (
                        <span>
                          {(partner.short_name_en || partner.legal_name_en)
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="adminRegistryIdentity">
                      <strong>
                        {partner.short_name_en || partner.legal_name_en}
                      </strong>
                      <span>{partner.legal_name_en}</span>
                    </div>
                  </div>

                  <div className="adminRegistryIdentity">
                    <strong>{partner.country_code}</strong>
                    <span>
                      {roleLabels[partner.partner_role] ?? partner.partner_role}
                    </span>
                  </div>

                  <div className="adminRegistryIdentity">
                    <strong>{details?.contact_name || "—"}</strong>
                    {details?.contact_title ? (
                      <span>{details.contact_title}</span>
                    ) : null}
                    {details?.contact_email ? (
                      <small>{details.contact_email}</small>
                    ) : null}
                    {details?.contact_phone ? (
                      <small>{details.contact_phone}</small>
                    ) : null}
                  </div>

                  <div className="adminRegistryIdentity">
                    {details?.portal_emails?.length ? (
                      details.portal_emails.map((email) => (
                        <small key={email}>{email}</small>
                      ))
                    ) : (
                      <span>—</span>
                    )}
                  </div>

                  <span>{partner.is_public ? "Yes" : "No"}</span>
                  <a
                    className="textButton"
                    href={`/admin/partners?edit=${partner.id}`}
                  >
                    Edit
                  </a>
                </div>
              );
            })}

            {!partners.length ? (
              <p className="emptyState adminEmptyTable">
                No country partner roles assigned yet.
              </p>
            ) : null}
          </div>
        </section>

        <aside className="adminPanel">
          <div className="eyebrow">
            {edit ? "Edit country role" : "Assign organisation"}
          </div>
          <h2>{edit ? edit.legal_name_en : "Add partner organisation"}</h2>

          <form
            className="adminStatusForm"
            action={savePartnerOrganisation}
            encType="multipart/form-data"
          >
            <input type="hidden" name="id" value={edit?.id ?? ""} />
            <input
              type="hidden"
              name="agreementStatus"
              value={edit?.agreement_status ?? "none"}
            />

            <label>
              English legal name
              <input
                name="legalNameEn"
                required
                defaultValue={edit?.legal_name_en ?? ""}
              />
            </label>

            <label>
              Ukrainian legal name
              <input
                name="legalNameUk"
                defaultValue={edit?.legal_name_uk ?? ""}
              />
            </label>

            <div className="adminFormSplit">
              <label>
                EN short name
                <input
                  name="shortNameEn"
                  defaultValue={edit?.short_name_en ?? ""}
                  placeholder="HCU-MSMEs"
                />
              </label>
              <label>
                UA short name
                <input
                  name="shortNameUk"
                  defaultValue={edit?.short_name_uk ?? ""}
                />
              </label>
            </div>

            <div className="adminPartnerLogoField">
              <div>
                <span className="adminFieldLabel">Organisation logo</span>
                <p className="fieldHelp">
                  PNG, JPG or WebP · max 2 MB. Used in the public network and
                  opportunities.
                </p>
              </div>
              <div className="adminPartnerLogoControl">
                <div className="adminPartnerLogoPreview">
                  {editLogoUrl ? (
                    <img src={editLogoUrl} alt="" />
                  ) : (
                    <span>No logo</span>
                  )}
                </div>
                <div className="adminPartnerLogoActions">
                  <input
                    name="logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                  />
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
                <input
                  name="countryCode"
                  required
                  maxLength={2}
                  defaultValue={edit?.country_code ?? ""}
                  placeholder="UA"
                />
              </label>
              <label>
                Role in country
                <select
                  name="partnerRole"
                  defaultValue={edit?.partner_role ?? "partner"}
                >
                  <option value="national_operator">National Operator</option>
                  <option value="partner">Country Partner</option>
                </select>
              </label>
            </div>

            <label>
              Website
              <input
                name="websiteUrl"
                type="url"
                defaultValue={edit?.website_url ?? ""}
                placeholder="https://"
              />
            </label>

            <label>
              English description
              <textarea
                name="descriptionEn"
                rows={3}
                defaultValue={edit?.description_en ?? ""}
              />
            </label>

            <label>
              Ukrainian description
              <textarea
                name="descriptionUk"
                rows={3}
                defaultValue={edit?.description_uk ?? ""}
              />
            </label>

            <label className="adminCheckbox">
              <input
                name="isPublic"
                type="checkbox"
                defaultChecked={edit?.is_public ?? true}
              />
              Show this assigned organisation publicly
            </label>

            <input
              name="sortOrder"
              type="hidden"
              value={edit?.sort_order ?? 0}
            />

            <div className="adminFormDivider" />

            <div>
              <div className="eyebrow">Admin-only contact card</div>
              <p className="fieldHelp">
                These details are private and are not shown on the public CraftID
                network.
              </p>
            </div>

            <div className="adminFormSplit">
              <label>
                Contact name
                <input
                  name="contactName"
                  defaultValue={editPrivate?.contact_name ?? ""}
                />
              </label>
              <label>
                Position
                <input
                  name="contactTitle"
                  defaultValue={editPrivate?.contact_title ?? ""}
                />
              </label>
            </div>

            <div className="adminFormSplit">
              <label>
                Email
                <input
                  name="contactEmail"
                  type="email"
                  defaultValue={editPrivate?.contact_email ?? ""}
                />
              </label>
              <label>
                Phone
                <input
                  name="contactPhone"
                  defaultValue={editPrivate?.contact_phone ?? ""}
                />
              </label>
            </div>

            <label>
              Internal note
              <textarea
                name="internalNote"
                rows={3}
                defaultValue={editPrivate?.internal_note ?? ""}
              />
            </label>

            <div className="adminFormDivider" />

            <div>
              <div className="eyebrow">Partner portal access</div>
              <p className="fieldHelp">
                Add a confirmed login email that may publish opportunities for
                this organisation. The user signs in through the normal CraftID
                login.
              </p>
            </div>

            <label>
              Add portal login email
              <input name="portalEmail" type="email" placeholder="name@organisation.eu" />
            </label>

            {editPrivate?.portal_emails?.length ? (
              <div className="adminPortalAccessList">
                {editPrivate.portal_emails.map((email) => (
                  <div key={email}>
                    <span>{email}</span>
                    <button
                      className="textButton"
                      formAction={revokePartnerPortalAccess}
                      name="email"
                      value={email}
                      type="submit"
                    >
                      Revoke
                    </button>
                    <input type="hidden" name="partnerId" value={edit?.id ?? ""} />
                  </div>
                ))}
              </div>
            ) : null}

            <button className="button buttonPrimary" type="submit">
              {edit ? "Save assignment" : "Assign organisation"}
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}
