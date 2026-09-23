import { formatCraftId as formatCraftIdValue, normalizeCertificateLookup } from "@/lib/craftid-format";

export type PublicCraftIdCertificate = {
  certificate_id: string;
  certificate_code: string;
  version_no: number;
  certificate_status: "issued" | "revoked";
  issued_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  issued_display_name: string;
  issued_role_label: string | null;
  issued_country_code: string | null;
  entity_type: "professional" | "workshop";
  craftid_number: number;
  craftid_check_digits: string;
  entity_created_at: string;
  current_craftid_status: "draft" | "published" | "suspended" | "archived";
  current_profile_available: boolean;
};

export function formatCraftId(number: number | string, checkDigits: string) {
  return formatCraftIdValue(number, checkDigits);
}

export function normalizeCertificateCode(value: string) {
  return normalizeCertificateLookup(value);
}

export function isCertificateCode(value: string) {
  return /^CID-CERT-\d{8}-\d{2}-V\d{2,}$/.test(normalizeCertificateCode(value));
}
