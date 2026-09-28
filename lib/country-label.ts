import { localeMeta, type Locale } from "@/lib/i18n";

export function countryLabel(countryCode: string, locale: Locale) {
  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return code;

  try {
    const display = new Intl.DisplayNames([localeMeta[locale].intl], {
      type: "region",
      fallback: "code",
    });
    return display.of(code) ?? code;
  } catch {
    return code;
  }
}
