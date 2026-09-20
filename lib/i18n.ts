import en from "@/messages/en.json";
import uk from "@/messages/uk.json";

export const supportedLocales = ["en", "uk"] as const;
export type Locale = (typeof supportedLocales)[number];

const dictionaries = { en, uk };

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export function isLocale(value: string): value is Locale {
  return supportedLocales.includes(value as Locale);
}
