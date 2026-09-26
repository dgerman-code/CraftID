import en from "@/messages/en.json";
import uk from "@/messages/uk.json";

export const supportedLocales = [
  "en",
  "fr",
  "de",
  "nl",
  "pl",
  "it",
  "es",
  "uk",
] as const;

export type Locale = (typeof supportedLocales)[number];

export const localeMeta: Record<
  Locale,
  { label: string; short: string; intl: string }
> = {
  en: { label: "English", short: "EN", intl: "en-GB" },
  fr: { label: "Français", short: "FR", intl: "fr-FR" },
  de: { label: "Deutsch", short: "DE", intl: "de-DE" },
  nl: { label: "Nederlands", short: "NL", intl: "nl-NL" },
  pl: { label: "Polski", short: "PL", intl: "pl-PL" },
  it: { label: "Italiano", short: "IT", intl: "it-IT" },
  es: { label: "Español", short: "ES", intl: "es-ES" },
  uk: { label: "Українська", short: "UA", intl: "uk-UA" },
};

const dictionaries = { en, uk } as const;

export function getDictionary(locale: Locale) {
  return locale === "uk" ? dictionaries.uk : dictionaries.en;
}

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && supportedLocales.includes(value as Locale));
}

export function localeFrom(value?: string | null): Locale {
  return isLocale(value) ? value : "en";
}

export function localeQuery(locale: Locale) {
  return locale === "en" ? "" : `?lang=${locale}`;
}

export function withLocale(path: string, locale: Locale) {
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const queryIndex = withoutHash.indexOf("?");
  const pathname =
    queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : "";
  const params = new URLSearchParams(query);

  if (locale === "en") {
    params.delete("lang");
  } else {
    params.set("lang", locale);
  }

  const suffix = params.toString();
  return `${pathname}${suffix ? `?${suffix}` : ""}${hash}`;
}

export function contentLocale(locale: Locale): "en" | "uk" {
  return locale === "uk" ? "uk" : "en";
}
