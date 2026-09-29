/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";
import { withLocale } from "@/lib/i18n";
import {
  europeanCountryOptions,
  opportunityTypes,
  opportunityTypeLabel,
} from "@/lib/opportunities";
import { countryLabel } from "@/lib/country-label";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ lang?: string; country?: string; type?: string }>;
};

type PublicOpportunity = {
  id: string;
  partner_organisation_id: string;
  partner_name: string;
  partner_country_code: string;
  partner_role: string;
  partner_logo_path: string | null;
  title: string;
  summary: string;
  opportunity_type: string;
  content_language: string;
  target_entity: string;
  location_mode: string;
  location_country_code: string | null;
  location_city: string | null;
  eligibility_scope: string;
  eligible_countries: string[];
  starts_on: string | null;
  ends_on: string | null;
  deadline_date: string | null;
  external_apply_url: string | null;
  public_contact_name: string | null;
  public_contact_email: string | null;
  allow_interest: boolean;
  image_path: string | null;
  published_at: string | null;
};

const copy = {
  en: { eyebrow:"Partner opportunities", title:"Opportunities for craftspeople and workshops.", intro:"Grants, open calls, training, fairs, residencies, exchanges and support programmes published by assigned CraftID partner organisations.", filterCountry:"Relevant to country", filterType:"Type", all:"All", applyFilters:"Apply filters", clear:"Clear", partner:"Published by", available:"Available to", deadline:"Deadline", location:"Location", online:"Online", onsite:"On-site", hybrid:"Hybrid", view:"View opportunity", partnerCountry:"Partner country", selected:"Selected countries", europe:"All Europe", international:"International / no country restriction", empty:"No matching opportunities are currently published." },
  fr: { eyebrow:"Opportunités partenaires", title:"Opportunités pour les artisans et les ateliers.", intro:"Subventions, appels ouverts, formations, salons, résidences, échanges et programmes de soutien publiés par les organisations partenaires CraftID désignées.", filterCountry:"Pertinent pour le pays", filterType:"Type", all:"Tous", applyFilters:"Appliquer les filtres", clear:"Effacer", partner:"Publié par", available:"Disponible pour", deadline:"Date limite", location:"Lieu", online:"En ligne", onsite:"Sur place", hybrid:"Hybride", view:"Voir l’opportunité", partnerCountry:"Pays du partenaire", selected:"Pays sélectionnés", europe:"Toute l’Europe", international:"International / sans restriction", empty:"Aucune opportunité correspondante n’est actuellement publiée." },
  de: { eyebrow:"Partnerangebote", title:"Möglichkeiten für Kunsthandwerker und Werkstätten.", intro:"Förderungen, Open Calls, Schulungen, Messen, Residenzen, Austausch- und Unterstützungsprogramme von zugewiesenen CraftID-Partnerorganisationen.", filterCountry:"Relevant für Land", filterType:"Typ", all:"Alle", applyFilters:"Filter anwenden", clear:"Löschen", partner:"Veröffentlicht von", available:"Verfügbar für", deadline:"Frist", location:"Ort", online:"Online", onsite:"Vor Ort", hybrid:"Hybrid", view:"Angebot ansehen", partnerCountry:"Partnerland", selected:"Ausgewählte Länder", europe:"Ganz Europa", international:"International / ohne Länderbeschränkung", empty:"Derzeit sind keine passenden Angebote veröffentlicht." },
  nl: { eyebrow:"Partnermogelijkheden", title:"Mogelijkheden voor makers en werkplaatsen.", intro:"Subsidies, open oproepen, trainingen, beurzen, residenties, uitwisselingen en ondersteuningsprogramma’s van aangewezen CraftID-partners.", filterCountry:"Relevant voor land", filterType:"Type", all:"Alles", applyFilters:"Filters toepassen", clear:"Wissen", partner:"Gepubliceerd door", available:"Beschikbaar voor", deadline:"Deadline", location:"Locatie", online:"Online", onsite:"Op locatie", hybrid:"Hybride", view:"Bekijk mogelijkheid", partnerCountry:"Land van partner", selected:"Geselecteerde landen", europe:"Heel Europa", international:"Internationaal / geen landbeperking", empty:"Er zijn momenteel geen overeenkomende mogelijkheden gepubliceerd." },
  pl: { eyebrow:"Możliwości partnerów", title:"Możliwości dla rzemieślników i pracowni.", intro:"Granty, nabory, szkolenia, targi, rezydencje, wymiany i programy wsparcia publikowane przez wyznaczone organizacje partnerskie CraftID.", filterCountry:"Dla kraju", filterType:"Typ", all:"Wszystkie", applyFilters:"Zastosuj filtry", clear:"Wyczyść", partner:"Opublikowane przez", available:"Dostępne dla", deadline:"Termin", location:"Miejsce", online:"Online", onsite:"Stacjonarnie", hybrid:"Hybrydowo", view:"Zobacz możliwość", partnerCountry:"Kraj partnera", selected:"Wybrane kraje", europe:"Cała Europa", international:"Międzynarodowo / bez ograniczeń", empty:"Obecnie nie ma opublikowanych pasujących możliwości." },
  it: { eyebrow:"Opportunità dei partner", title:"Opportunità per artigiani e laboratori.", intro:"Contributi, call aperte, formazione, fiere, residenze, scambi e programmi di supporto pubblicati dalle organizzazioni partner CraftID designate.", filterCountry:"Rilevante per il paese", filterType:"Tipo", all:"Tutti", applyFilters:"Applica filtri", clear:"Cancella", partner:"Pubblicato da", available:"Disponibile per", deadline:"Scadenza", location:"Luogo", online:"Online", onsite:"In presenza", hybrid:"Ibrido", view:"Vedi opportunità", partnerCountry:"Paese del partner", selected:"Paesi selezionati", europe:"Tutta Europa", international:"Internazionale / senza restrizioni", empty:"Al momento non sono pubblicate opportunità corrispondenti." },
  es: { eyebrow:"Oportunidades de socios", title:"Oportunidades para artesanos y talleres.", intro:"Subvenciones, convocatorias, formación, ferias, residencias, intercambios y programas de apoyo publicados por organizaciones asociadas CraftID designadas.", filterCountry:"Relevante para el país", filterType:"Tipo", all:"Todos", applyFilters:"Aplicar filtros", clear:"Borrar", partner:"Publicado por", available:"Disponible para", deadline:"Fecha límite", location:"Ubicación", online:"Online", onsite:"Presencial", hybrid:"Híbrido", view:"Ver oportunidad", partnerCountry:"País del socio", selected:"Países seleccionados", europe:"Toda Europa", international:"Internacional / sin restricción de país", empty:"Actualmente no hay oportunidades coincidentes publicadas." },
  uk: { eyebrow:"Можливості від партнерів", title:"Можливості для ремісників і майстерень.", intro:"Гранти, відкриті конкурси, навчання, ярмарки, резиденції, обміни та програми підтримки від призначених партнерських організацій CraftID.", filterCountry:"Релевантно для країни", filterType:"Тип", all:"Усі", applyFilters:"Застосувати фільтри", clear:"Очистити", partner:"Опубліковано", available:"Доступно для", deadline:"Дедлайн", location:"Місце", online:"Онлайн", onsite:"Офлайн", hybrid:"Гібрид", view:"Переглянути можливість", partnerCountry:"Країна партнера", selected:"Вибрані країни", europe:"Вся Європа", international:"Міжнародно / без обмежень", empty:"Наразі немає опублікованих можливостей за цими фільтрами." },
} as const;

function formatOpportunityDate(value: string, locale: keyof typeof copy) {
  return new Date(value + "T00:00:00").toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function eligibilityLabel(item: PublicOpportunity, locale: keyof typeof copy) {
  const t = copy[locale];
  if (item.eligibility_scope === "partner_country") {
    return countryLabel(item.partner_country_code, locale);
  }
  if (item.eligibility_scope === "selected_countries") {
    return item.eligible_countries.map((code) => countryLabel(code, locale)).join(", ");
  }
  if (item.eligibility_scope === "all_europe") return t.europe;
  return t.international;
}

export default async function OpportunitiesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const country = /^[A-Za-z]{2}$/.test(sp.country ?? "")
    ? String(sp.country).toUpperCase()
    : "";
  const type = opportunityTypes.includes(
    String(sp.type ?? "") as (typeof opportunityTypes)[number],
  )
    ? String(sp.type)
    : "";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_opportunities", {
    p_country_code: country || null,
    p_opportunity_type: type || null,
  });
  if (error) throw new Error(error.message);
  const opportunities = (data ?? []) as PublicOpportunity[];
  const countries = europeanCountryOptions(locale);

  return (
    <>
      <SiteHeader locale={locale} pathname="/opportunities" />
      <main className="publicInfoPage">
        <section className="pageHero">
          <div className="container">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>
        </section>

        <section className="section editorialSection">
          <div className="container">
            <form className="opportunityFilters">
              {locale !== "en" ? <input type="hidden" name="lang" value={locale} /> : null}
              <label>
                {t.filterCountry}
                <select name="country" defaultValue={country}>
                  <option value="">{t.all}</option>
                  {countries.map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label>
                {t.filterType}
                <select name="type" defaultValue={type}>
                  <option value="">{t.all}</option>
                  {opportunityTypes.map((item) => (
                    <option key={item} value={item}>{opportunityTypeLabel(locale, item)}</option>
                  ))}
                </select>
              </label>
              <button className="button buttonPrimary" type="submit">{t.applyFilters}</button>
              <Link className="textButton" href={withLocale("/opportunities", locale)}>{t.clear}</Link>
            </form>

            <div className="publicOpportunityGrid">
              {opportunities.map((item) => {
                const partnerLogoUrl = item.partner_logo_path
                  ? supabase.storage.from("partner-logos").getPublicUrl(item.partner_logo_path).data.publicUrl
                  : null;
                const visualUrl = item.image_path
                  ? supabase.storage.from("opportunity-images").getPublicUrl(item.image_path).data.publicUrl
                  : partnerLogoUrl;
                const visualKind = item.image_path ? "cover" : "logo";
                const location =
                  item.location_mode === "online"
                    ? t.online
                    : [
                        item.location_city,
                        item.location_country_code
                          ? countryLabel(item.location_country_code, locale)
                          : null,
                      ]
                        .filter(Boolean)
                        .join(", ");
                return (
                  <article className="publicOpportunityCard" key={item.id}>
                    {visualUrl ? (
                      <div className={`publicOpportunityVisual ${visualKind}`}>
                        <img src={visualUrl} alt="" />
                      </div>
                    ) : null}
                    <div className="recordId">
                      {opportunityTypeLabel(locale, item.opportunity_type)}
                    </div>
                    <h2>{item.title}</h2>
                    <p>{item.summary}</p>
                    <dl>
                      <div className="opportunityCardPartner">
                        <dt>{t.partner}</dt>
                        <dd className="opportunityCardPartnerName">
                          {item.image_path && partnerLogoUrl ? (
                            <img src={partnerLogoUrl} alt="" />
                          ) : null}
                          <span>{item.partner_name}</span>
                        </dd>
                      </div>
                      <div>
                        <dt>{t.available}</dt>
                        <dd>{eligibilityLabel(item, locale)}</dd>
                      </div>
                      <div>
                        <dt>{t.location}</dt>
                        <dd>{item.location_mode === "hybrid" ? `${t.hybrid} · ${location}` : item.location_mode === "onsite" ? `${t.onsite} · ${location}` : location}</dd>
                      </div>
                      {item.deadline_date ? (
                        <div>
                          <dt>{t.deadline}</dt>
                          <dd>{formatOpportunityDate(item.deadline_date, locale)}</dd>
                        </div>
                      ) : null}
                    </dl>
                    <Link className="textButton" href={withLocale(`/opportunities/${item.id}`, locale)}>
                      {t.view} →
                    </Link>
                  </article>
                );
              })}
            </div>

            {!opportunities.length ? <p className="emptyState">{t.empty}</p> : null}
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
