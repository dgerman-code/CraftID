import { countryLabel } from "@/lib/country-label";
import type { Locale } from "@/lib/i18n";

export const europeanCountryCodes = [
  "AL","AD","AM","AT","AZ","BY","BE","BA","BG","HR","CY","CZ","DK","EE",
  "FI","FR","GE","DE","GR","HU","IS","IE","IT","LV","LI","LT","LU","MT",
  "MD","MC","ME","NL","MK","NO","PL","PT","RO","SM","RS","SK","SI","ES",
  "SE","CH","TR","UA","GB","VA"
] as const;

export const opportunityTypes = [
  "grant",
  "open_call",
  "training",
  "fair",
  "exhibition",
  "residency",
  "exchange",
  "competition",
  "certification_support",
  "export_support",
  "business_support",
  "event",
  "other",
] as const;

export const opportunityTypeLabels: Record<
  Locale,
  Record<(typeof opportunityTypes)[number], string>
> = {
  en: { grant:"Grant", open_call:"Open call", training:"Training", fair:"Fair", exhibition:"Exhibition", residency:"Residency", exchange:"Exchange", competition:"Competition", certification_support:"Certification support", export_support:"Export support", business_support:"Business support", event:"Event", other:"Other" },
  fr: { grant:"Subvention", open_call:"Appel ouvert", training:"Formation", fair:"Salon", exhibition:"Exposition", residency:"Résidence", exchange:"Échange", competition:"Concours", certification_support:"Soutien à la certification", export_support:"Soutien à l’export", business_support:"Soutien aux entreprises", event:"Événement", other:"Autre" },
  de: { grant:"Förderung", open_call:"Open Call", training:"Schulung", fair:"Messe", exhibition:"Ausstellung", residency:"Residenz", exchange:"Austausch", competition:"Wettbewerb", certification_support:"Zertifizierungsunterstützung", export_support:"Exportunterstützung", business_support:"Unternehmensförderung", event:"Veranstaltung", other:"Sonstiges" },
  nl: { grant:"Subsidie", open_call:"Open oproep", training:"Training", fair:"Beurs", exhibition:"Tentoonstelling", residency:"Residentie", exchange:"Uitwisseling", competition:"Wedstrijd", certification_support:"Ondersteuning certificering", export_support:"Exportondersteuning", business_support:"Bedrijfsondersteuning", event:"Evenement", other:"Overig" },
  pl: { grant:"Grant", open_call:"Nabór otwarty", training:"Szkolenie", fair:"Targi", exhibition:"Wystawa", residency:"Rezydencja", exchange:"Wymiana", competition:"Konkurs", certification_support:"Wsparcie certyfikacji", export_support:"Wsparcie eksportu", business_support:"Wsparcie biznesowe", event:"Wydarzenie", other:"Inne" },
  it: { grant:"Contributo", open_call:"Call aperta", training:"Formazione", fair:"Fiera", exhibition:"Mostra", residency:"Residenza", exchange:"Scambio", competition:"Concorso", certification_support:"Supporto alla certificazione", export_support:"Supporto all’export", business_support:"Supporto alle imprese", event:"Evento", other:"Altro" },
  es: { grant:"Subvención", open_call:"Convocatoria abierta", training:"Formación", fair:"Feria", exhibition:"Exposición", residency:"Residencia", exchange:"Intercambio", competition:"Concurso", certification_support:"Apoyo a la certificación", export_support:"Apoyo a la exportación", business_support:"Apoyo empresarial", event:"Evento", other:"Otro" },
  uk: { grant:"Грант", open_call:"Відкритий конкурс", training:"Навчання", fair:"Ярмарок", exhibition:"Виставка", residency:"Резиденція", exchange:"Обмін", competition:"Конкурс", certification_support:"Підтримка сертифікації", export_support:"Підтримка експорту", business_support:"Підтримка бізнесу", event:"Подія", other:"Інше" },
};

export function opportunityTypeLabel(locale: Locale, type: string) {
  return opportunityTypeLabels[locale][type as (typeof opportunityTypes)[number]] ?? type.replaceAll("_", " ");
}

export function europeanCountryOptions(locale: Locale) {
  return europeanCountryCodes
    .map((code) => ({ code, label: countryLabel(code, locale) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
