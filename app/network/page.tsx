/* eslint-disable @next/next/no-img-element */
import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";

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
  en: {
    national_operator: "National Operator",
    partner: "Partner",
  },
  uk: {
    national_operator: "Національний оператор",
    partner: "Партнер",
  },
} as const;

const copy = {
  en: {
    eyebrow: "European Network",
    title: "Partners supporting the CraftID ecosystem.",
    intro: "CraftID develops through cooperation with national operators and partner organisations. Only confirmed organisations are shown publicly.",
    pilotEyebrow: "Initial pilot network",
    pilotTitle: "Ukraine and Belgium as starting environments.",
    pilotText: "CraftID is designed as European infrastructure, with pilot implementation beginning in Ukraine and Belgium and further expansion through national and sectoral cooperation.",
    empty: "No public partner organisations are currently listed.",
    country: "Country",
    role: "Role",
    website: "Website",
    disclosure: "Partner status describes the organisation's relationship to CraftID. It does not by itself grant authority to certify professional claims.",
  },
  uk: {
    eyebrow: "Європейська мережа",
    title: "Партнери, що підтримують екосистему CraftID.",
    intro: "CraftID розвивається через співпрацю з національними операторами та партнерськими організаціями. Публічно відображаються лише підтверджені організації.",
    pilotEyebrow: "Початкова пілотна мережа",
    pilotTitle: "Україна та Бельгія як стартові середовища.",
    pilotText: "CraftID проєктується як європейська інфраструктура з пілотним впровадженням в Україні та Бельгії та подальшим розширенням через національну й галузеву співпрацю.",
    empty: "Наразі немає публічно відображених партнерських організацій.",
    country: "Країна",
    role: "Роль",
    website: "Вебсайт",
    disclosure: "Статус партнера описує відносини організації з CraftID і сам по собі не надає повноважень сертифікувати професійні твердження.",
  },
} as const;

export default async function NetworkPage({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale as keyof typeof copy] ?? copy.en;
  const supabase = await createClient();

  const { data: partnersData, error: partnersError } = await supabase
    .rpc("public_partner_organisations");
  const partners = (partnersData ?? []) as PublicPartner[];

  if (partnersError) {
    console.error("Unable to load public partner organisations", partnersError);
  }

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
                    roleLabels[locale][partner.partner_role as keyof (typeof roleLabels)[typeof locale]] ??
                    partner.partner_role;
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
