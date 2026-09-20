import Link from "next/link";
import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";

type Props = { searchParams: Promise<{ lang?: string }> };

const copy = {
  en: {
    id: "CraftID #00001822-64",
    name: "Atelier Forma",
    role: "Woodcraft workshop",
    location: "Antwerp, Belgium",
    summary: "Atelier Forma is a small furniture and woodcraft workshop focused on custom interiors, furniture restoration and small-series production. The workshop combines traditional joinery with contemporary fabrication methods.",
    sectors: "Craft sectors",
    capabilities: "Capabilities",
    services: "Products & services",
    team: "Team",
    capacity: "Production capacity",
    interests: "Cooperation interests",
    trust: "Trust & evidence",
    status: "Document reviewed",
    back: "Back to registry",
    disclaimer: "Demo record. All workshop content is fictional and shown only to demonstrate the CraftID information model.",
  },
  uk: {
    id: "CraftID #00001822-64",
    name: "Atelier Forma",
    role: "Майстерня деревообробки",
    location: "Антверпен, Бельгія",
    summary: "Atelier Forma — невелика меблева та деревообробна майстерня, що спеціалізується на індивідуальних інтер’єрах, реставрації меблів і малосерійному виробництві. Майстерня поєднує традиційні столярні з’єднання із сучасними виробничими методами.",
    sectors: "Ремісничі напрями",
    capabilities: "Можливості",
    services: "Продукти та послуги",
    team: "Команда",
    capacity: "Виробнича спроможність",
    interests: "Інтереси співпраці",
    trust: "Довіра та докази",
    status: "Документ переглянуто",
    back: "Назад до реєстру",
    disclaimer: "Демонстраційний запис. Увесь зміст майстерні є вигаданим і використовується лише для демонстрації інформаційної моделі CraftID.",
  },
} as const;

export default async function WorkshopProfile({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale];
  const q = locale === "uk" ? "?lang=uk" : "";

  return (
    <>
      <SiteHeader locale={locale} pathname="/workshops/atelier-forma" />
      <main>
        <section className="profileHero">
          <div className="container">
            <Link className="backLink" href={`/discover${q}`}>← {t.back}</Link>
            <div className="profileHeaderGrid">
              <div>
                <div className="recordId">{t.id}</div>
                <h1>{t.name}</h1>
                <p className="profileRole">{t.role} · {t.location}</p>
              </div>
              <div className="trustStamp">
                <span>Trust status</span>
                <strong>{t.status}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="section profileSection">
          <div className="container profileColumns">
            <div className="profileMain">
              <p className="profileSummary">{t.summary}</p>

              <div className="profileBlock">
                <div className="eyebrow">{t.sectors}</div>
                <div className="tagRow">
                  {["Furniture", "Woodcraft", "Restoration"].map((x) => <span className="tag" key={x}>{x}</span>)}
                </div>
              </div>

              <div className="profileBlock">
                <div className="eyebrow">{t.capabilities}</div>
                <div className="tagRow">
                  {["Custom furniture", "Furniture restoration", "Wood joinery", "Small-series production"].map((x) => <span className="tag" key={x}>{x}</span>)}
                </div>
              </div>

              <div className="profileBlock">
                <div className="eyebrow">{t.services}</div>
                <p>Custom furniture, repair and restoration, fitted interiors, prototyping and small production runs.</p>
              </div>
            </div>

            <aside className="profileAside">
              <div className="profileMetaBlock">
                <div className="eyebrow">{t.team}</div>
                <p>5 workshop members · 3 professional CraftID affiliations confirmed</p>
              </div>
              <div className="profileMetaBlock">
                <div className="eyebrow">{t.capacity}</div>
                <p>Small-series workshop capacity with project-based scheduling. Capacity information is self-declared and may vary by project.</p>
              </div>
              <div className="profileMetaBlock">
                <div className="eyebrow">{t.interests}</div>
                <p>Cross-border production · Restoration projects · Design collaboration</p>
              </div>
              <div className="profileMetaBlock">
                <div className="eyebrow">{t.trust}</div>
                <p>Business registration — document reviewed</p>
                <p>Workshop capabilities — self-declared</p>
                <p>Team affiliation — external source confirmed</p>
              </div>
            </aside>
          </div>
        </section>

        <section className="section disclaimerBand">
          <div className="container"><p>{t.disclaimer}</p></div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
