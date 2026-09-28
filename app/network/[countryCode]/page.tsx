/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";
import { countryLabel } from "@/lib/country-label";
import { withLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ countryCode: string }>;
  searchParams: Promise<{ lang?: string }>;
};

type PublicPartner = {
  id: string;
  legal_name_en: string;
  legal_name_uk: string | null;
  short_name_en: string | null;
  short_name_uk: string | null;
  country_code: string;
  partner_role: "national_operator" | "partner";
  website_url: string | null;
  description_en: string | null;
  description_uk: string | null;
  sort_order: number;
  logo_path: string | null;
};

const copy = {
  en: {
    eyebrow: "CraftID country network",
    back: "European Network",
    intro: "This page lists only confirmed organisations that are publicly associated with CraftID in this country.",
    operator: "National Operator",
    operatorText: "A National Operator supports country-level coordination of CraftID. This role does not by itself create certification or regulatory authority.",
    noOperator: "No confirmed public National Operator is currently listed for this country.",
    partners: "Partner organisations",
    noPartners: "No additional confirmed public partner organisations are currently listed.",
    website: "Website",
    disclosure: "Partner and National Operator roles describe institutional cooperation with CraftID. They do not automatically authorize an organisation to certify a person, workshop or professional claim.",
  },
  fr: {
    eyebrow: "Réseau CraftID par pays",
    back: "Réseau européen",
    intro: "Cette page présente uniquement les organisations confirmées publiquement associées à CraftID dans ce pays.",
    operator: "Opérateur national",
    operatorText: "Un opérateur national soutient la coordination de CraftID au niveau du pays. Ce rôle ne crée pas, à lui seul, une autorité de certification ou de réglementation.",
    noOperator: "Aucun opérateur national public confirmé n’est actuellement répertorié pour ce pays.",
    partners: "Organisations partenaires",
    noPartners: "Aucune autre organisation partenaire publique confirmée n’est actuellement répertoriée.",
    website: "Site web",
    disclosure: "Les rôles de partenaire et d’opérateur national décrivent une coopération institutionnelle avec CraftID. Ils n’autorisent pas automatiquement une organisation à certifier une personne, un atelier ou une déclaration professionnelle.",
  },
  de: {
    eyebrow: "CraftID-Ländernetzwerk",
    back: "Europäisches Netzwerk",
    intro: "Diese Seite zeigt nur bestätigte Organisationen, die in diesem Land öffentlich mit CraftID verbunden sind.",
    operator: "Nationaler Betreiber",
    operatorText: "Ein nationaler Betreiber unterstützt die landesweite Koordination von CraftID. Diese Rolle begründet für sich genommen keine Zertifizierungs- oder Regulierungsbefugnis.",
    noOperator: "Für dieses Land ist derzeit kein bestätigter öffentlicher nationaler Betreiber gelistet.",
    partners: "Partnerorganisationen",
    noPartners: "Derzeit sind keine weiteren bestätigten öffentlichen Partnerorganisationen gelistet.",
    website: "Website",
    disclosure: "Partner- und Betreiberrollen beschreiben die institutionelle Zusammenarbeit mit CraftID. Sie berechtigen eine Organisation nicht automatisch zur Zertifizierung einer Person, Werkstatt oder beruflichen Angabe.",
  },
  nl: {
    eyebrow: "CraftID-netwerk per land",
    back: "Europees netwerk",
    intro: "Deze pagina toont alleen bevestigde organisaties die in dit land publiek aan CraftID zijn verbonden.",
    operator: "Nationale operator",
    operatorText: "Een nationale operator ondersteunt de coördinatie van CraftID op landelijk niveau. Deze rol creëert op zichzelf geen certificerings- of regelgevende bevoegdheid.",
    noOperator: "Er is momenteel geen bevestigde openbare nationale operator voor dit land vermeld.",
    partners: "Partnerorganisaties",
    noPartners: "Er zijn momenteel geen andere bevestigde openbare partnerorganisaties vermeld.",
    website: "Website",
    disclosure: "Partner- en nationale-operatorrollen beschrijven institutionele samenwerking met CraftID. Ze geven een organisatie niet automatisch de bevoegdheid om een persoon, werkplaats of professionele claim te certificeren.",
  },
  pl: {
    eyebrow: "Sieć CraftID w kraju",
    back: "Sieć europejska",
    intro: "Ta strona pokazuje wyłącznie potwierdzone organizacje publicznie powiązane z CraftID w tym kraju.",
    operator: "Operator krajowy",
    operatorText: "Operator krajowy wspiera koordynację CraftID na poziomie kraju. Sama ta rola nie tworzy uprawnień certyfikacyjnych ani regulacyjnych.",
    noOperator: "Dla tego kraju nie ma obecnie potwierdzonego publicznego operatora krajowego.",
    partners: "Organizacje partnerskie",
    noPartners: "Nie ma obecnie innych potwierdzonych publicznych organizacji partnerskich.",
    website: "Strona internetowa",
    disclosure: "Role partnera i operatora krajowego opisują współpracę instytucjonalną z CraftID. Nie upoważniają automatycznie organizacji do certyfikowania osoby, pracowni ani deklaracji zawodowej.",
  },
  it: {
    eyebrow: "Rete CraftID per paese",
    back: "Rete europea",
    intro: "Questa pagina mostra solo le organizzazioni confermate pubblicamente associate a CraftID in questo paese.",
    operator: "Operatore nazionale",
    operatorText: "Un operatore nazionale supporta il coordinamento di CraftID a livello nazionale. Questo ruolo non crea di per sé autorità di certificazione o regolamentazione.",
    noOperator: "Per questo paese non è attualmente elencato alcun operatore nazionale pubblico confermato.",
    partners: "Organizzazioni partner",
    noPartners: "Non sono attualmente elencate altre organizzazioni partner pubbliche confermate.",
    website: "Sito web",
    disclosure: "I ruoli di partner e operatore nazionale descrivono la cooperazione istituzionale con CraftID. Non autorizzano automaticamente un’organizzazione a certificare una persona, un laboratorio o una dichiarazione professionale.",
  },
  es: {
    eyebrow: "Red CraftID por país",
    back: "Red europea",
    intro: "Esta página muestra únicamente organizaciones confirmadas públicamente asociadas con CraftID en este país.",
    operator: "Operador nacional",
    operatorText: "Un operador nacional apoya la coordinación de CraftID a nivel nacional. Este papel no crea por sí mismo autoridad de certificación o regulatoria.",
    noOperator: "Actualmente no figura ningún operador nacional público confirmado para este país.",
    partners: "Organizaciones asociadas",
    noPartners: "Actualmente no figuran otras organizaciones asociadas públicas confirmadas.",
    website: "Sitio web",
    disclosure: "Las funciones de socio y operador nacional describen cooperación institucional con CraftID. No autorizan automáticamente a una organización a certificar a una persona, taller o declaración profesional.",
  },
  uk: {
    eyebrow: "Мережа CraftID у країні",
    back: "Європейська мережа",
    intro: "На цій сторінці відображаються лише підтверджені організації, які публічно пов’язані з CraftID у цій країні.",
    operator: "Національний оператор",
    operatorText: "Національний оператор підтримує координацію CraftID на рівні країни. Ця роль сама по собі не створює сертифікаційних або регуляторних повноважень.",
    noOperator: "Для цієї країни наразі не вказано підтвердженого публічного Національного оператора.",
    partners: "Партнерські організації",
    noPartners: "Наразі немає інших підтверджених публічних партнерських організацій.",
    website: "Вебсайт",
    disclosure: "Ролі партнера та Національного оператора описують інституційну співпрацю з CraftID. Вони автоматично не надають організації повноважень сертифікувати особу, майстерню або професійне твердження.",
  },
} as const;

function PartnerCard({
  partner,
  locale,
  websiteLabel,
  logoUrl,
}: {
  partner: PublicPartner;
  locale: keyof typeof copy;
  websiteLabel: string;
  logoUrl: string | null;
}) {
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

  return (
    <article className="partnerPublicCard countryPartnerCard">
      <div className="partnerPublicMeta">
        <div className="partnerPublicLogo">
          {logoUrl ? <img src={logoUrl} alt={name + " logo"} /> : <span>{partner.country_code}</span>}
        </div>
      </div>
      <div>
        {shortName ? <div className="eyebrow">{shortName}</div> : null}
        <h2>{name}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {partner.website_url ? (
        <dl className="partnerPublicFacts">
          <div>
            <dt>{websiteLabel}</dt>
            <dd>
              <a href={partner.website_url} target="_blank" rel="noreferrer">
                {partner.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
              </a>
            </dd>
          </div>
        </dl>
      ) : null}
    </article>
  );
}

export default async function CountryNetworkPage({ params, searchParams }: Props) {
  const [{ countryCode: rawCode }, sp] = await Promise.all([params, searchParams]);
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const countryCode = rawCode.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(countryCode)) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_partner_organisations");

  if (error) {
    console.error("Unable to load public partner organisations", error);
    notFound();
  }

  const partners = ((data ?? []) as PublicPartner[]).filter(
    (partner) => partner.country_code === countryCode,
  );
  if (!partners.length) notFound();

  const operator =
    partners.find((partner) => partner.partner_role === "national_operator") ?? null;
  const countryPartners = partners.filter((partner) => partner.partner_role === "partner");
  const name = countryLabel(countryCode, locale);

  const logoUrl = (partner: PublicPartner) =>
    partner.logo_path
      ? supabase.storage.from("partner-logos").getPublicUrl(partner.logo_path).data.publicUrl
      : null;

  return (
    <>
      <SiteHeader locale={locale} pathname={"/network/" + rawCode.toLowerCase()} />
      <main className="publicInfoPage">
        <section className="pageHero countryNetworkHero">
          <div className="container">
            <Link className="backLink" href={withLocale("/network", locale)}>
              ← {t.back}
            </Link>
            <div className="eyebrow">{t.eyebrow} · {countryCode}</div>
            <h1>{name}</h1>
            <p>{t.intro}</p>
          </div>
        </section>

        <section className="section editorialSection">
          <div className="container">
            <div className="networkCountryHeading">
              <div>
                <div className="eyebrow">{countryCode}</div>
                <h2>{t.operator}</h2>
              </div>
              <p>{t.operatorText}</p>
            </div>
            {operator ? (
              <PartnerCard
                partner={operator}
                locale={locale}
                websiteLabel={t.website}
                logoUrl={logoUrl(operator)}
              />
            ) : (
              <p className="emptyState">{t.noOperator}</p>
            )}
          </div>
        </section>

        <section className="section editorialSection">
          <div className="container">
            <div className="eyebrow">{t.partners}</div>
            {countryPartners.length ? (
              <div className="partnerPublicList">
                {countryPartners.map((partner) => (
                  <PartnerCard
                    key={partner.id}
                    partner={partner}
                    locale={locale}
                    websiteLabel={t.website}
                    logoUrl={logoUrl(partner)}
                  />
                ))}
              </div>
            ) : (
              <p className="emptyState">{t.noPartners}</p>
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
