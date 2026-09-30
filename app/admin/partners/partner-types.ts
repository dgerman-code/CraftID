export type AdminPartner = {
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

export type PrivateDetails = {
  partner_organisation_id: string;
  contact_name: string | null;
  contact_title: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  internal_note: string | null;
  portal_emails: string[];
};

export const partnerRoleLabels: Record<string, string> = {
  national_operator: "National Operator",
  partner: "Country Partner",
};

export const partnerMessageCopy: Record<string, string> = {
  saved: "Partner organisation saved.",
  deleted: "Partner organisation deleted.",
  "access-updated": "Partner portal access updated.",
  "partner-access-created":
    "Partner login created. A confirmation email was sent; the temporary password must be replaced at first access.",
  "partner-access-existing":
    "Partner access assigned to an existing CraftID account. Its existing password was not changed.",
};
