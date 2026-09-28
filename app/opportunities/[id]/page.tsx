import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";
import { withLocale } from "@/lib/i18n";
import { countryLabel } from "@/lib/country-label";
import { opportunityTypeLabel } from "@/lib/opportunities";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

type Opportunity = {
  id: string;
  partner_organisation_id: string;
  partner_name: string;
  partner_country_code: string;
  partner_role: string;
  partner_website_url: string | null;
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
  published_at: string | null;
};

const copy = {
  en:{back:"All opportunities",publishedBy:"Published by",type:"Type",for:"For",professional:"Professional",workshop:"Workshop",both:"Professional and Workshop",location:"Location",available:"Available to",dates:"Dates",deadline:"Deadline",apply:"Apply externally",contact:"Contact organisation",interest:"I’m interested",notice:"CraftID does not certify, endorse or guarantee this opportunity. Eligibility and selection are determined by the publishing organisation.",partnerCountry:"Partner country",europe:"All Europe",international:"International / no country restriction",online:"Online",onsite:"On-site",hybrid:"Hybrid"},
  fr:{back:"Toutes les opportunités",publishedBy:"Publié par",type:"Type",for:"Pour",professional:"Professional",workshop:"Workshop",both:"Professional et Workshop",location:"Lieu",available:"Disponible pour",dates:"Dates",deadline:"Date limite",apply:"Candidater sur le site externe",contact:"Contacter l’organisation",interest:"Je suis intéressé",notice:"CraftID ne certifie, n’approuve ni ne garantit cette opportunité. L’éligibilité et la sélection sont déterminées par l’organisation qui la publie.",partnerCountry:"Pays du partenaire",europe:"Toute l’Europe",international:"International / sans restriction",online:"En ligne",onsite:"Sur place",hybrid:"Hybride"},
  de:{back:"Alle Möglichkeiten",publishedBy:"Veröffentlicht von",type:"Typ",for:"Für",professional:"Professional",workshop:"Workshop",both:"Professional und Workshop",location:"Ort",available:"Verfügbar für",dates:"Zeitraum",deadline:"Frist",apply:"Extern bewerben",contact:"Organisation kontaktieren",interest:"Ich bin interessiert",notice:"CraftID zertifiziert, befürwortet oder garantiert dieses Angebot nicht. Eignung und Auswahl bestimmt die veröffentlichende Organisation.",partnerCountry:"Partnerland",europe:"Ganz Europa",international:"International / ohne Länderbeschränkung",online:"Online",onsite:"Vor Ort",hybrid:"Hybrid"},
  nl:{back:"Alle mogelijkheden",publishedBy:"Gepubliceerd door",type:"Type",for:"Voor",professional:"Professional",workshop:"Workshop",both:"Professional en Workshop",location:"Locatie",available:"Beschikbaar voor",dates:"Data",deadline:"Deadline",apply:"Extern aanvragen",contact:"Neem contact op",interest:"Ik ben geïnteresseerd",notice:"CraftID certificeert, onderschrijft of garandeert deze mogelijkheid niet. Geschiktheid en selectie worden bepaald door de publicerende organisatie.",partnerCountry:"Land van partner",europe:"Heel Europa",international:"Internationaal / geen landbeperking",online:"Online",onsite:"Op locatie",hybrid:"Hybride"},
  pl:{back:"Wszystkie możliwości",publishedBy:"Opublikowane przez",type:"Typ",for:"Dla",professional:"Professional",workshop:"Workshop",both:"Professional i Workshop",location:"Miejsce",available:"Dostępne dla",dates:"Daty",deadline:"Termin",apply:"Aplikuj zewnętrznie",contact:"Skontaktuj się z organizacją",interest:"Jestem zainteresowany",notice:"CraftID nie certyfikuje, nie rekomenduje ani nie gwarantuje tej możliwości. Kryteria i wybór określa organizacja publikująca.",partnerCountry:"Kraj partnera",europe:"Cała Europa",international:"Międzynarodowo / bez ograniczeń",online:"Online",onsite:"Stacjonarnie",hybrid:"Hybrydowo"},
  it:{back:"Tutte le opportunità",publishedBy:"Pubblicato da",type:"Tipo",for:"Per",professional:"Professional",workshop:"Workshop",both:"Professional e Workshop",location:"Luogo",available:"Disponibile per",dates:"Date",deadline:"Scadenza",apply:"Candidati esternamente",contact:"Contatta l’organizzazione",interest:"Sono interessato",notice:"CraftID non certifica, approva o garantisce questa opportunità. Idoneità e selezione sono determinate dall’organizzazione che la pubblica.",partnerCountry:"Paese del partner",europe:"Tutta Europa",international:"Internazionale / senza restrizioni",online:"Online",onsite:"In presenza",hybrid:"Ibrido"},
  es:{back:"Todas las oportunidades",publishedBy:"Publicado por",type:"Tipo",for:"Para",professional:"Professional",workshop:"Workshop",both:"Professional y Workshop",location:"Ubicación",available:"Disponible para",dates:"Fechas",deadline:"Fecha límite",apply:"Solicitar externamente",contact:"Contactar organización",interest:"Me interesa",notice:"CraftID no certifica, avala ni garantiza esta oportunidad. La elegibilidad y selección las determina la organización que publica.",partnerCountry:"País del socio",europe:"Toda Europa",international:"Internacional / sin restricción",online:"Online",onsite:"Presencial",hybrid:"Híbrido"},
  uk:{back:"Усі можливості",publishedBy:"Опубліковано",type:"Тип",for:"Для",professional:"Professional",workshop:"Workshop",both:"Professional і Workshop",location:"Місце",available:"Доступно для",dates:"Дати",deadline:"Дедлайн",apply:"Подати заявку зовні",contact:"Зв’язатися з організацією",interest:"Я зацікавлений",notice:"CraftID не сертифікує, не схвалює і не гарантує цю можливість. Умови участі та відбір визначає організація, що її опублікувала.",partnerCountry:"Країна партнера",europe:"Вся Європа",international:"Міжнародно / без обмежень",online:"Онлайн",onsite:"Офлайн",hybrid:"Гібрид"},
} as const;

export default async function OpportunityPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_opportunity", {
    p_opportunity_id: id,
  });
  if (error) throw new Error(error.message);
  if (!data) notFound();
  const item = data as Opportunity;

  const available =
    item.eligibility_scope === "partner_country"
      ? countryLabel(item.partner_country_code, locale)
      : item.eligibility_scope === "selected_countries"
        ? item.eligible_countries.map((code) => countryLabel(code, locale)).join(", ")
        : item.eligibility_scope === "all_europe"
          ? t.europe
          : t.international;

  const location =
    item.location_mode === "online"
      ? t.online
      : [item.location_city, item.location_country_code ? countryLabel(item.location_country_code, locale) : null]
          .filter(Boolean)
          .join(", ");

  const target =
    item.target_entity === "professional"
      ? t.professional
      : item.target_entity === "workshop"
        ? t.workshop
        : t.both;

  return (
    <>
      <SiteHeader locale={locale} pathname="/opportunities" />
      <main className="publicInfoPage">
        <section className="pageHero opportunityDetailHero">
          <div className="container">
            <Link className="backLink" href={withLocale("/opportunities", locale)}>← {t.back}</Link>
            <div className="eyebrow">{opportunityTypeLabel(locale, item.opportunity_type)}</div>
            <h1>{item.title}</h1>
            <p>{item.summary}</p>
          </div>
        </section>

        <section className="section editorialSection">
          <div className="container opportunityDetailGrid">
            <article className="opportunityFacts">
              <dl>
                <div><dt>{t.publishedBy}</dt><dd>{item.partner_name}</dd></div>
                <div><dt>{t.type}</dt><dd>{opportunityTypeLabel(locale, item.opportunity_type)}</dd></div>
                <div><dt>{t.for}</dt><dd>{target}</dd></div>
                <div><dt>{t.location}</dt><dd>{item.location_mode === "hybrid" ? `${t.hybrid} · ${location}` : item.location_mode === "onsite" ? `${t.onsite} · ${location}` : location}</dd></div>
                <div><dt>{t.available}</dt><dd>{available}</dd></div>
                {item.starts_on || item.ends_on ? <div><dt>{t.dates}</dt><dd>{[item.starts_on, item.ends_on].filter(Boolean).join(" — ")}</dd></div> : null}
                {item.deadline_date ? <div><dt>{t.deadline}</dt><dd>{new Date(item.deadline_date + "T00:00:00").toLocaleDateString(locale)}</dd></div> : null}
              </dl>
            </article>

            <aside className="opportunityActions">
              {item.external_apply_url ? (
                <a className="button buttonPrimary" href={item.external_apply_url} target="_blank" rel="noopener noreferrer">
                  {t.apply} ↗
                </a>
              ) : null}
              {item.public_contact_email ? (
                <a className="button" href={`mailto:${item.public_contact_email}`}>
                  {t.contact}
                </a>
              ) : null}
              {item.allow_interest ? (
                <Link className="button" href={withLocale(`/opportunities/${item.id}/interest`, locale)}>
                  {t.interest}
                </Link>
              ) : null}
              {item.public_contact_name ? <small>{item.public_contact_name}</small> : null}
            </aside>
          </div>
        </section>

        <section className="section disclaimerBand">
          <div className="container"><p>{t.notice}</p></div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
