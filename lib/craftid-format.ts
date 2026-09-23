export type ParsedCraftId = {
  number: number;
  check: string;
  formatted: string;
};

export function formatCraftId(number: number | string, checkDigits: string) {
  const digits = String(number).replace(/\D/g, "").padStart(8, "0").slice(-8);
  return digits.slice(0, 4) + "-" + digits.slice(4) + "-" + checkDigits;
}

export function formatCraftIdWithHash(number: number | string, checkDigits: string) {
  return "#" + formatCraftId(number, checkDigits);
}

export function parseCraftId(value: string | null | undefined): ParsedCraftId | null {
  if (!value) return null;

  const cleaned = value
    .trim()
    .replace(/^CraftID\s*/i, "")
    .replace(/^#/, "")
    .replace(/[\s-]/g, "");

  if (!/^\d{3,}$/.test(cleaned)) return null;

  const check = cleaned.slice(-2);
  const numberDigits = cleaned.slice(0, -2);
  const number = Number(numberDigits);

  if (!Number.isSafeInteger(number) || number < 1) return null;

  return {
    number,
    check,
    formatted: formatCraftId(number, check),
  };
}

export function formatCertificateNumber(
  number: number | string,
  checkDigits: string,
  version: number | string,
) {
  return (
    formatCraftId(number, checkDigits) +
    "/" +
    String(version).replace(/\D/g, "").padStart(2, "0")
  );
}

export function normalizeCertificateLookup(value: string) {
  const trimmed = value.trim().toUpperCase();

  if (/^CID-CERT-\d{8}-\d{2}-V\d{2,}$/.test(trimmed)) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 12) return "";

  const craftDigits = digits.slice(0, 8);
  const check = digits.slice(8, 10);
  const version = digits.slice(10);

  if (!/^\d{8}$/.test(craftDigits) || !/^\d{2}$/.test(check) || !/^\d+$/.test(version)) {
    return "";
  }

  return (
    "CID-CERT-" +
    craftDigits +
    "-" +
    check +
    "-V" +
    version.padStart(2, "0")
  );
}
