/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";
import { countryLabel } from "@/lib/country-label";
import { withLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ lang?: string }> };

type PublicPartner = {
  id: string;
  legal_name_en: string;
  legal_name_uk: string | null;
  short_name_en: string | null;
  short_name_uk: string | null;
  country_code: string;
  partner_role: string;
  website_url: string | null;
  description_en: string | null;
  description_uk: string | null;
  sort_order: number;
  logo_path: string | null;
};

const roleLabels = {
  en: { national_operator: "National Operator", partner: "Partner" },
  fr: { national_operator: "Opérateur national", partner: "Partenaire" },
  de: { national_operator: "Nationaler Betreiber", partner: "Partner" },
  nl: { national_operator: "Nationale operator", partner: "Partner" },
  pl: { national_operator: "Operator krajowy", partner: "Partner" },
  it: { national_operator: "Operatore nazionale", partner: "Partner" },
  es: { national_operator: "Operador nacional", partner: "Socio" },
  uk: { national_operator: "Національний оператор", partner: "Партнер" },
} as const;

const copy = {
  en: {
    eyebrow: "European Network",
    title: "Partners supporting the CraftID ecosystem.",
    intro: "CraftID develops through cooperation with national operators and partner organisations. Only confirmed organisations are shown publicly.",
    pilotEyebrow: "European rollout",
    pilotTitle: "National and sectoral partnerships.",
    pilotText: "CraftID is designed as European infrastructure. Public network information below reflects confirmed organisations only; further expansion is developed through national operators and partner organisations.",
    countriesEyebrow: "Country network",
    countriesTitle: "Confirmed CraftID presence by country.",
    countriesText: "Open a country page to see its confirmed National Operator and public partner organisations.",
    operator: "National Operator",
    partners: "Partners",
    openCountry: "Open country network",
    empty: "No public partner organisations are currently listed.",
    country: "Country",
    role: "Role",
    website: "Website",
    disclosure: "Partner status describes the organisation's relationship to CraftID. It does not by itself grant authority to certify professional claims.",
  },
  fr: {
    eyebrow: "Réseau européen",
    title: "Des partenaires qui soutiennent l’écosystème CraftID.",
    intro: "CraftID se développe grâce à la coopération avec des opérateurs nationaux et des organisations partenaires. Seules les organisations confirmées sont affichées publiquement.",
    pilotEyebrow: "Déploiement européen",
    pilotTitle: "Des partenariats nationaux et sectoriels.",
    pilotText: "CraftID est conçu comme une infrastructure européenne. Les informations publiques ci-dessous reflètent uniquement les organisations confirmées ; l’expansion se développe par l’intermédiaire d’opérateurs nationaux et d’organisations partenaires.",
    countriesEyebrow: "Réseau par pays",
    countriesTitle: "Présence CraftID confirmée par pays.",
    countriesText: "Ouvrez la page d’un pays pour voir son opérateur national confirmé et ses organisations partenaires publiques.",
    operator: "Opérateur national",
    partners: "Partenaires",
    openCountry: "Ouvrir le réseau du pays",
    empty: "Aucune organisation partenaire publique n’est actuellement répertoriée.",
    country: "Pays",
    role: "Rôle",
    website: "Site web",
    disclosure: "Le statut de partenaire décrit la relation de l’organisation avec CraftID. Il ne confère pas, à lui seul, l’autorité de certifier des déclarations professionnelles.",
  },
  de: {
    eyebrow: "Europäisches Netzwerk",
    title: "Partner, die das CraftID-Ökosystem unterstützen.",
    intro: "CraftID entwickelt sich durch die Zusammenarbeit mit nationalen Betreibern und Partnerorganisationen. Öffentlich angezeigt werden nur bestätigte Organisationen.",
    pilotEyebrow: "Europäische Einführung",
    pilotTitle: "Nationale und sektorale Partnerschaften.",
    pilotText: "CraftID ist als europäische Infrastruktur konzipiert. Die öffentlichen Netzwerkinformationen unten zeigen ausschließlich bestätigte Organisationen; die weitere Ausweitung erfolgt über nationale Betreiber und Partnerorganisationen.",
    countriesEyebrow: "Ländernetzwerk",
    countriesTitle: "Bestätigte CraftID-Präsenz nach Land.",
    countriesText: "Öffnen Sie eine Länderseite, um den bestätigten nationalen Betreiber und öffentliche Partnerorganisationen zu sehen.",
    operator: "Nationaler Betreiber",
    partners: "Partner",
    openCountry: "Ländernetzwerk öffnen",
    empty: "Derzeit sind keine öffentlichen Partnerorganisationen gelistet.",
    country: "Land",
    role: "Rolle",
    website: "Website",
    disclosure: "Der Partnerstatus beschreibt die Beziehung einer Organisation zu CraftID. Er verleiht für sich genommen keine Befugnis, berufliche Angaben zu zertifizieren.",
  },
  nl: {
    eyebrow: "Europees netwerk",
    title: "Partners die het CraftID-ecosysteem ondersteunen.",
    intro: "CraftID ontwikkelt zich door samenwerking met nationale operators en partnerorganisaties. Alleen bevestigde organisaties worden publiek weergegeven.",
    pilotEyebrow: "Europese uitrol",
    pilotTitle: "Nationale en sectorale partnerschappen.",
    pilotText: "CraftID is ontworpen als Europese infrastructuur. De openbare netwerkinformatie hieronder toont alleen bevestigde organisaties; verdere uitbreiding gebeurt via nationale operators en partnerorganisaties.",
    countriesEyebrow: "Netwerk per land",
    countriesTitle: "Bevestigde CraftID-aanwezigheid per land.",
    countriesText: "Open een landpagina om de bevestigde nationale operator en openbare partnerorganisaties te bekijken.",
    operator: "Nationale operator",
    partners: "Partners",
    openCountry: "Landennetwerk openen",
    empty: "Er staan momenteel geen openbare partnerorganisaties vermeld.",
    country: "Land",
    role: "Rol",
    website: "Website",
    disclosure: "Partnerstatus beschrijft de relatie van de organisatie met CraftID. Die status geeft op zichzelf geen bevoegdheid om professionele claims te certificeren.",
  },
  pl: {
    eyebrow: "Sieć europejska",
    title: "Partnerzy wspierający ekosystem CraftID.",
    intro: "CraftID rozwija się dzięki współpracy z operatorami krajowymi i organizacjami partnerskimi. Publicznie wyświetlane są wyłącznie potwierdzone organizacje.",
    pilotEyebrow: "Rozwój europejski",
    pilotTitle: "Partnerstwa krajowe i sektorowe.",
    pilotText: "CraftID jest projektowany jako infrastruktura europejska. Publiczne informacje o sieci poniżej obejmują wyłącznie potwierdzone organizacje; dalszy rozwój odbywa się poprzez operatorów krajowych i organizacje partnerskie.",
    countriesEyebrow: "Sieć krajowa",
    countriesTitle: "Potwierdzona obecność CraftID według kraju.",
    countriesText: "Otwórz stronę kraju, aby zobaczyć potwierdzonego operatora krajowego i publiczne organizacje partnerskie.",
    operator: "Operator krajowy",
    partners: "Partnerzy",
    openCountry: "Otwórz sieć kraju",
    empty: "Obecnie nie ma publicznie wymienionych organizacji partnerskich.",
    country: "Kraj",
    role: "Rola",
    website: "Strona internetowa",
    disclosure: "Status partnera opisuje relację organizacji z CraftID. Sam w sobie nie daje uprawnień do certyfikowania deklaracji zawodowych.",
  },
  it: {
    eyebrow: "Rete europea",
    title: "Partner che sostengono l’ecosistema CraftID.",
    intro: "CraftID si sviluppa attraverso la cooperazione con operatori nazionali e organizzazioni partner. Vengono mostrate pubblicamente solo le organizzazioni confermate.",
    pilotEyebrow: "Sviluppo europeo",
    pilotTitle: "Partnership nazionali e settoriali.",
    pilotText: "CraftID è progettato come infrastruttura europea. Le informazioni pubbliche sulla rete riportate di seguito riflettono solo le organizzazioni confermate; l’ulteriore espansione avviene tramite operatori nazionali e organizzazioni partner.",
    countriesEyebrow: "Rete per paese",
    countriesTitle: "Presenza CraftID confermata per paese.",
    countriesText: "Apri la pagina di un paese per vedere l’operatore nazionale confermato e le organizzazioni partner pubbliche.",
    operator: "Operatore nazionale",
    partners: "Partner",
    openCountry: "Apri rete del paese",
    empty: "Al momento non sono elencate organizzazioni partner pubbliche.",
    country: "Paese",
    role: "Ruolo",
    website: "Sito web",
    disclosure: "Lo status di partner descrive il rapporto dell’organizzazione con CraftID. Di per sé non conferisce l’autorità di certificare dichiarazioni professionali.",
  },
  es: {
    eyebrow: "Red europea",
    title: "Socios que apoyan el ecosistema CraftID.",
    intro: "CraftID se desarrolla mediante la cooperación con operadores nacionales y organizaciones asociadas. Solo se muestran públicamente las organizaciones confirmadas.",
    pilotEyebrow: "Despliegue europeo",
    pilotTitle: "Alianzas nacionales y sectoriales.",
    pilotText: "CraftID está diseñado como infraestructura europea. La información pública de la red que aparece a continuación refleja únicamente organizaciones confirmadas; la expansión posterior se desarrolla mediante operadores nacionales y organizaciones asociadas.",
    countriesEyebrow: "Red por país",
    countriesTitle: "Presencia CraftID confirmada por país.",
    countriesText: "Abre la página de un país para ver su operador nacional confirmado y sus organizaciones asociadas públicas.",
    operator: "Operador nacional",
    partners: "Socios",
    openCountry: "Abrir red del país",
    empty: "Actualmente no hay organizaciones asociadas públicas en la lista.",
    country: "País",
    role: "Función",
    website: "Sitio web",
    disclosure: "El estatus de socio describe la relación de la organización con CraftID. Por sí solo no otorga autoridad para certificar declaraciones profesionales.",
  },
  uk: {
    eyebrow: "Європейська мережа",
    title: "Партнери, що підтримують екосистему CraftID.",
    intro: "CraftID розвивається через співпрацю з національними операторами та партнерськими організаціями. Публічно відображаються лише підтверджені організації.",
    pilotEyebrow: "Європейське розгортання",
    pilotTitle: "Національні та галузеві партнерства.",
    pilotText: "CraftID проєктується як європейська інфраструктура. Публічна інформація про мережу нижче відображає лише підтверджені організації; подальше розширення розвивається через національних операторів і партнерські організації.",
    countriesEyebrow: "Мережа за країнами",
    countriesTitle: "Підтверджена присутність CraftID за країнами.",
    countriesText: "Відкрийте сторінку країни, щоб побачити підтвердженого Національного оператора та публічні партнерські організації.",
    operator: "Національний оператор",
    partners: "Партнери",
    openCountry: "Відкрити мережу країни",
    empty: "Наразі немає публічно відображених партнерських організацій.",
    country: "Країна",
    role: "Роль",
    website: "Вебсайт",
    disclosure: "Статус партнера описує відносини організації з CraftID і сам по собі не надає повноважень сертифікувати професійні твердження.",
  },
} as const;

export default async function NetworkPage({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale];
  const supabase = await createClient();

  const { data: partnersData, error: partnersError } = await supabase
    .rpc("public_partner_organisations");
  const partners = (partnersData ?? []) as PublicPartner[];

  if (partnersError) {
    console.error("Unable to load public partner organisations", partnersError);
  }

  const countryGroups = Array.from(
    partners.reduce((map, partner) => {
      const current = map.get(partner.country_code) ?? [];
      current.push(partner);
      map.set(partner.country_code, current);
      return map;
    }, new Map<string, PublicPartner[]>()),
  )
    .map(([countryCode, organisations]) => ({
      countryCode,
      countryName: countryLabel(countryCode, locale),
      nationalOperator:
        organisations.find((item) => item.partner_role === "national_operator") ?? null,
      partnerCount: organisations.filter((item) => item.partner_role === "partner").length,
    }))
    .sort((a, b) => a.countryName.localeCompare(b.countryName, locale));

  return (
    <>
      <SiteHeader locale={locale} pathname="/network" />
      <main className="publicInfoPage">
        <section className="pageHero">
          <div className="container">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>
        </section>

        <section className="section editorialSection">
          <div className="container networkIntro">
            <div>
              <div className="eyebrow">{t.pilotEyebrow}</div>
              <h2>{t.pilotTitle}</h2>
            </div>
            <p>{t.pilotText}</p>
          </div>
        </section>

        {countryGroups.length ? (
          <section className="section editorialSection countryNetworkSection">
            <div className="container">
              <div className="networkCountryHeading">
                <div>
                  <div className="eyebrow">{t.countriesEyebrow}</div>
                  <h2>{t.countriesTitle}</h2>
                </div>
                <p>{t.countriesText}</p>
              </div>
              <div className="networkCountryGrid">
                {countryGroups.map((country) => (
                  <Link
                    className="networkCountryCard"
                    href={withLocale(`/network/${country.countryCode.toLowerCase()}`, locale)}
                    key={country.countryCode}
                  >
                    <div className="recordId">{country.countryCode}</div>
                    <h3>{country.countryName}</h3>
                    <dl>
                      <div>
                        <dt>{t.operator}</dt>
                        <dd>
                          {country.nationalOperator
                            ? country.nationalOperator.short_name_en ||
                              country.nationalOperator.legal_name_en
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt>{t.partners}</dt>
                        <dd>{country.partnerCount}</dd>
                      </div>
                    </dl>
                    <span>{t.openCountry} →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="section editorialSection">
          <div className="container">
            {partners.length ? (
              <div className="partnerPublicList">
                {partners.map((partner) => {
                  const name =
                    locale === "uk"
                      ? partner.legal_name_uk || partner.legal_name_en
                      : partner.legal_name_en;
                  const shortName =
                    locale === "uk"
                      ? partner.short_name_uk || partner.short_name_en
                      : partner.short_name_en;
                  const description =
                    locale === "uk"
                      ? partner.description_uk || partner.description_en
                      : partner.description_en;
                  const role =
                    roleLabels[locale][
                      partner.partner_role as keyof (typeof roleLabels)[typeof locale]
                    ] ?? partner.partner_role;
                  const logoUrl = partner.logo_path
                    ? supabase.storage.from("partner-logos").getPublicUrl(partner.logo_path).data.publicUrl
                    : null;

                  return (
                    <article className="partnerPublicCard" key={partner.id}>
                      <div className="partnerPublicMeta">
                        <div className="partnerPublicLogo">
                          {logoUrl ? (
                            <img src={logoUrl} alt={`${name} logo`} />
                          ) : (
                            <span>{partner.country_code}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        {shortName ? <div className="eyebrow">{shortName}</div> : null}
                        <h2>{name}</h2>
                        {description ? <p>{description}</p> : null}
                      </div>
                      <dl className="partnerPublicFacts">
                        <div>
                          <dt>{t.country}</dt>
                          <dd>{partner.country_code}</dd>
                        </div>
                        <div>
                          <dt>{t.role}</dt>
                          <dd>{role}</dd>
                        </div>
                        {partner.website_url ? (
                          <div>
                            <dt>{t.website}</dt>
                            <dd>
                              <a href={partner.website_url} target="_blank" rel="noreferrer">
                                {partner.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
                              </a>
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="emptyState">{t.empty}</p>
            )}
          </div>
        </section>

        <section className="section disclaimerBand">
          <div className="container">
            <p>{t.disclosure}</p>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
