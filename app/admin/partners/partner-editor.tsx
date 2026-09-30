/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  deletePartnerOrganisation,
  revokePartnerPortalAccess,
  savePartnerOrganisation,
} from "./actions";
import { PartnerAccessSetup } from "./partner-access-setup";
import type { AdminPartner, PrivateDetails } from "./partner-types";

type Props = {
  partner?: AdminPartner | null;
  privateDetails?: PrivateDetails | null;
  logoUrl?: string | null;
};

export function PartnerEditor({
  partner = null,
  privateDetails = null,
  logoUrl = null,
}: Props) {
  const isEdit = Boolean(partner);

  return (
    <div className="partnerEditorPage">
      <form
        className="partnerEditorForm"
        action={savePartnerOrganisation}
        encType="multipart/form-data"
        key={partner?.id ?? "new-partner"}
      >
        <input type="hidden" name="id" value={partner?.id ?? ""} />
        <input
          type="hidden"
          name="agreementStatus"
          value={partner?.agreement_status ?? "none"}
        />
        <input
          name="sortOrder"
          type="hidden"
          value={partner?.sort_order ?? 0}
        />

        <section className="adminPanel partnerEditorSection">
          <div className="partnerEditorSectionHeader">
            <div>
              <div className="eyebrow">01 · Organisation & public profile</div>
              <h2>Organisation details</h2>
              <p>
                Public-facing identity used in the CraftID network and on
                Opportunities published by this organisation.
              </p>
            </div>
            <div className="partnerEditorVisibility">
              <span>Public visibility</span>
              <label className="adminCheckbox">
                <input
                  name="isPublic"
                  type="checkbox"
                  defaultChecked={partner?.is_public ?? true}
                />
                Show publicly
              </label>
            </div>
          </div>

          <div className="partnerEditorPublicGrid">
            <div className="partnerEditorFields">
              <label>
                English legal name
                <input
                  name="legalNameEn"
                  required
                  defaultValue={partner?.legal_name_en ?? ""}
                />
              </label>

              <label>
                Ukrainian legal name
                <input
                  name="legalNameUk"
                  defaultValue={partner?.legal_name_uk ?? ""}
                />
              </label>

              <div className="adminFormSplit">
                <label>
                  EN short name
                  <input
                    name="shortNameEn"
                    defaultValue={partner?.short_name_en ?? ""}
                    placeholder="HCU-MSMEs"
                  />
                </label>
                <label>
                  UA short name
                  <input
                    name="shortNameUk"
                    defaultValue={partner?.short_name_uk ?? ""}
                  />
                </label>
              </div>

              <div className="adminFormSplit">
                <label>
                  Country code
                  <input
                    name="countryCode"
                    required
                    maxLength={2}
                    defaultValue={partner?.country_code ?? ""}
                    placeholder="UA"
                  />
                </label>
                <label>
                  Role in country
                  <select
                    name="partnerRole"
                    defaultValue={partner?.partner_role ?? "partner"}
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
                  defaultValue={partner?.website_url ?? ""}
                  placeholder="https://"
                />
              </label>
            </div>

            <div className="partnerEditorLogoCard">
              <div>
                <div className="eyebrow">Organisation logo</div>
                <p className="fieldHelp">
                  PNG, JPG or WebP · max 2 MB. Used across the public network and
                  Opportunity attribution.
                </p>
              </div>
              <div className="partnerEditorLogoPreview">
                {logoUrl ? <img src={logoUrl} alt="" /> : <span>No logo</span>}
              </div>
              <input
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
              />
              {partner?.logo_path ? (
                <label className="adminCheckbox">
                  <input name="removeLogo" type="checkbox" />
                  Remove current logo
                </label>
              ) : null}
            </div>
          </div>

          <div className="partnerEditorDescriptions">
            <label>
              English description
              <textarea
                name="descriptionEn"
                rows={4}
                defaultValue={partner?.description_en ?? ""}
              />
            </label>
            <label>
              Ukrainian description
              <textarea
                name="descriptionUk"
                rows={4}
                defaultValue={partner?.description_uk ?? ""}
              />
            </label>
          </div>
        </section>

        <section className="adminPanel partnerEditorSection">
          <div className="partnerEditorSectionHeader">
            <div>
              <div className="eyebrow">02 · Private administration</div>
              <h2>Admin contact</h2>
              <p>
                Internal contact information for Platform Admin. These details are
                never shown on the public CraftID network.
              </p>
            </div>
            <span className="adminPrivacyBadge">Admin only</span>
          </div>

          <div className="partnerEditorFields partnerEditorFieldsWide">
            <div className="adminFormSplit">
              <label>
                Contact name
                <input
                  name="contactName"
                  defaultValue={privateDetails?.contact_name ?? ""}
                />
              </label>
              <label>
                Position
                <input
                  name="contactTitle"
                  defaultValue={privateDetails?.contact_title ?? ""}
                />
              </label>
            </div>

            <div className="adminFormSplit">
              <label>
                Email
                <input
                  name="contactEmail"
                  type="email"
                  defaultValue={privateDetails?.contact_email ?? ""}
                />
              </label>
              <label>
                Phone
                <input
                  name="contactPhone"
                  defaultValue={privateDetails?.contact_phone ?? ""}
                />
              </label>
            </div>

            <label>
              Internal note
              <textarea
                name="internalNote"
                rows={4}
                defaultValue={privateDetails?.internal_note ?? ""}
              />
            </label>
          </div>
        </section>

        <section className="adminPanel partnerEditorSection">
          <div className="partnerEditorSectionHeader">
            <div>
              <div className="eyebrow">03 · Partner Workspace access</div>
              <h2>Portal users</h2>
              <p>
                People listed here may enter the Partner Workspace and publish
                Opportunities for this organisation.
              </p>
            </div>
            <Link className="textButton" href="/partner/login" target="_blank">
              Partner login ↗
            </Link>
          </div>

          {privateDetails?.portal_emails?.length ? (
            <div className="partnerPortalUsers">
              {privateDetails.portal_emails.map((email) => (
                <div className="partnerPortalUserRow" key={email}>
                  <div>
                    <span className="adminStatus adminStatus-published">Active</span>
                    <strong>{email}</strong>
                  </div>
                  <button
                    className="textButton"
                    formAction={revokePartnerPortalAccess}
                    name="email"
                    value={email}
                    type="submit"
                  >
                    Revoke access
                  </button>
                  <input
                    type="hidden"
                    name="partnerId"
                    value={partner?.id ?? ""}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="adminEmptyStateCard partnerPortalEmpty">
              <strong>No portal users yet</strong>
              <span>
                Add a login below if this organisation should manage its own
                Opportunities.
              </span>
            </div>
          )}

          <details className="partnerAccessDisclosure" open={!isEdit}>
            <summary>+ Add portal user</summary>
            <div className="partnerAccessDisclosureBody">
              <PartnerAccessSetup />
            </div>
          </details>
        </section>

        <div className="partnerEditorStickyBar">
          <Link className="button" href="/admin/partners">
            Cancel
          </Link>
          <button className="button buttonPrimary" type="submit">
            {isEdit ? "Save changes" : "Create organisation"}
          </button>
        </div>
      </form>

      {partner ? (
        <section className="partnerEditorDangerZone">
          <div>
            <div className="eyebrow">Danger zone</div>
            <h2>Delete organisation</h2>
            <p>
              Deletion removes the country role, private contact card and Partner
              Workspace access. If the organisation already owns Opportunities,
              deletion is blocked to protect interaction history.
            </p>
          </div>
          <form action={deletePartnerOrganisation}>
            <input type="hidden" name="partnerId" value={partner.id} />
            <input
              type="hidden"
              name="reason"
              value="Removed from Countries & Partner Roles by Platform Admin"
            />
            <button className="button dangerButton" type="submit">
              Delete organisation
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
