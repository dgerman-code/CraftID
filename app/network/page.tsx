import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ lang?: string }> };

const roleLabels = {
  en: {
    european_coordinator: "European Coordinator",
    national_coordinating_partner: "National Coordinating Partner",
    sectoral_partner: "Sectoral Partner",
    regional_partner: "Regional Partner",
    vet_skills_partner: "VET / Skills Partner",
    knowledge_partner: "Knowledge Partner",
    ecosystem_partner: "Ecosystem Partner",
  },
  uk: {
    european_coordinator: "Європейський координатор",
    national_coordinating_partner: "Національний координаційний партнер",
    sectoral_partner: "Галузевий партнер",
    regional_partner: "Регіональний партнер",
    vet_skills_partner: "Партнер з професійних навичок / VET",
    knowledge_partner: "Партнер знань",
    ecosystem_partner: "Екосистемний партнер",
  },
} as const;

const copy = {
  en: {
    eyebrow: "European Network",
    title: "Partners supporting the CraftID ecosystem.",
    intro: "CraftID develops through cooperation with national, sectoral, skills, knowledge and ecosystem organisations. Only confirmed partners are shown publicly.",
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
    intro: "CraftID розвивається через співпрацю з національними, галузевими, освітніми, експертними та екосистемними організаціями. Публічно відображаються лише підтверджені партнери.",
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
  const t = copy[locale];
  const supabase = await createClient();

  const { data: partners } = await supabase
    .from("partner_organisations")
    .select("id, legal_name_en, legal_name_uk, short_name_en, short_name_uk, country_code, partner_role, website_url, description_en, description_uk, sort_order")
    .eq("status", "confirmed")
    .eq("is_public", true)
    .order("sort_order", { ascending: true })
    .order("legal_name_en", { ascending: true });

  return (
    <>
      <SiteHeader locale={locale} pathname="/network" />
      <main>
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
            {(partners ?? []).length ? (
              <div className="partnerPublicList">
                {(partners ?? []).map((partner) => {
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

                  return (
                    <article className="partnerPublicCard" key={partner.id}>
                      <div className="partnerPublicMeta">
                        <span className="recordId">{partner.country_code}</span>
                        <span>{role}</span>
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
