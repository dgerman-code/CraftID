/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  deletePartnerOrganisation,
  revokePartnerPortalAccess,
  savePartnerOrganisation,
} from "./actions";
import { PartnerAccessSetup } from "./partner-access-setup";

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

const messageCopy: Record<string, string> = {
  saved: "Partner organisation saved.",
  deleted: "Partner organisation deleted.",
  "access-updated": "Partner portal access updated.",
  "partner-access-created":
    "Partner login created. A confirmation email was sent; the temporary password must be replaced at first access.",
  "partner-access-existing":
    "Partner access assigned to an existing CraftID account. Its existing password was not changed.",
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
    ? partners.find((partner) => partner.id === sp.edit) ?? null
    : null;
  const editPrivate = edit ? privateByPartner.get(edit.id) : null;
  const editLogoUrl = edit?.logo_path
    ? supabase.storage.from("partner-logos").getPublicUrl(edit.logo_path).data
        .publicUrl
    : null;

  return (
    <main className="adminPage partnerAdminPage">
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
        <p className="formMessage">
          {messageCopy[sp.message] ?? "Partner organisation updated."}
        </p>
      ) : null}

      <div className="partnerAdminLayout">
        <section className="adminPanel partnerAdminListPanel">
          <div className="adminPanelHeader">
            <div>
              <div className="eyebrow">Assigned roles</div>
              <h2>Country partner register</h2>
            </div>
            <div className="partnerAdminHeaderActions">
              <span>{partners.length}</span>
              <Link className="button partnerAdminAddButton" href="/admin/partners">
                + Add organisation
              </Link>
            </div>
          </div>

          <div className="partnerAdminCards">
            {partners.map((partner) => {
              const details = privateByPartner.get(partner.id);
              const logoUrl = partner.logo_path
                ? supabase.storage.from("partner-logos").getPublicUrl(partner.logo_path)
                    .data.publicUrl
                : null;

              return (
                <article
                  className={
                    edit?.id === partner.id
                      ? "partnerAdminCard active"
                      : "partnerAdminCard"
                  }
                  key={partner.id}
                >
                  <div className="partnerAdminCardMain">
                    <div className="adminPartnerLogoThumb partnerAdminCardLogo">
                      {logoUrl ? (
                        <img src={logoUrl} alt="" />
                      ) : (
                        <span>
                          {(partner.short_name_en || partner.legal_name_en)
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="partnerAdminCardIdentity">
                      <div className="recordId">
                        {partner.country_code} ·{" "}
                        {roleLabels[partner.partner_role] ?? partner.partner_role}
                      </div>
                      <h3>{partner.short_name_en || partner.legal_name_en}</h3>
                      {partner.short_name_en ? (
                        <p>{partner.legal_name_en}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="partnerAdminCardMeta">
                    <div>
                      <span>Admin contact</span>
                      <strong>{details?.contact_name || "—"}</strong>
                      {details?.contact_title ? (
                        <small>{details.contact_title}</small>
                      ) : null}
                      {details?.contact_email ? (
                        <small>{details.contact_email}</small>
                      ) : null}
                    </div>

                    <div>
                      <span>Portal access</span>
                      <strong>
                        {details?.portal_emails?.length
                          ? details.portal_emails.length
                          : "—"}
                      </strong>
                      {details?.portal_emails?.[0] ? (
                        <small>{details.portal_emails[0]}</small>
                      ) : null}
                    </div>

                    <div>
                      <span>Public</span>
                      <strong>{partner.is_public ? "Yes" : "No"}</strong>
                    </div>
                  </div>

                  <div className="partnerAdminCardActions">
                    <Link
                      className="button partnerAdminEditButton"
                      href={`/admin/partners?edit=${partner.id}`}
                    >
                      Edit
                    </Link>
                  </div>
                </article>
              );
            })}

            {!partners.length ? (
              <p className="emptyState">No country partner roles assigned yet.</p>
            ) : null}
          </div>
        </section>

        <aside className="adminPanel partnerAdminEditorPanel">
          <div className="partnerAdminEditorHeader">
            <div>
              <div className="eyebrow">
                {edit ? "Edit assigned organisation" : "Assign organisation"}
              </div>
              <h2>{edit ? edit.legal_name_en : "Add partner organisation"}</h2>
            </div>
            {edit ? (
              <Link className="textButton" href="/admin/partners">
                Close
              </Link>
            ) : null}
          </div>

          <form
            className="adminStatusForm partnerAdminForm"
            action={savePartnerOrganisation}
            encType="multipart/form-data"
            key={edit?.id ?? "new-partner"}
          >
            <input type="hidden" name="id" value={edit?.id ?? ""} />
            <input
              type="hidden"
              name="agreementStatus"
              value={edit?.agreement_status ?? "none"}
            />

            <div className="adminFormSectionIntro">
              <div className="eyebrow">Organisation & public profile</div>
              <p className="fieldHelp">
                Core organisation details used in the CraftID partner network and public Opportunity attribution.
              </p>
            </div>

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
                Add the email that may manage this organisation’s Partner Workspace and publish Opportunities.
                For a new login you can issue a temporary password; the partner must replace it at first access.
              </p>
              <div className="partnerAdminLoginLink">
                <span>Partner sign-in</span>
                <Link href="/partner/login" target="_blank">
                  craftid.eu/partner/login ↗
                </Link>
              </div>
            </div>

            <PartnerAccessSetup />

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
                    <input
                      type="hidden"
                      name="partnerId"
                      value={edit?.id ?? ""}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <div className="partnerAdminSaveRow">
              <button className="button buttonPrimary" type="submit">
                {edit ? "Save changes" : "Assign organisation"}
              </button>
              {edit ? (
                <Link className="button" href="/admin/partners">
                  Cancel
                </Link>
              ) : null}
            </div>
          </form>

          {edit ? (
            <div className="partnerAdminDangerZone">
              <div>
                <div className="eyebrow">Delete organisation</div>
                <p>
                  Deletion removes the country role, private contact card and
                  partner portal access. If this organisation already owns
                  opportunities, deletion is blocked to protect interaction
                  history.
                </p>
              </div>
              <form action={deletePartnerOrganisation}>
                <input type="hidden" name="partnerId" value={edit.id} />
                <input
                  type="hidden"
                  name="reason"
                  value="Removed from Countries & Partner Roles by Platform Admin"
                />
                <button className="button dangerButton" type="submit">
                  Delete organisation
                </button>
              </form>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
