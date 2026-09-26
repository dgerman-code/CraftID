import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";

type Props = { searchParams: Promise<{ lang?: string }> };

const copy = {
  en: {
    eyebrow: "Governance",
    title: "Trust requires accountable rules.",
    intro: "CraftID governance is designed around traceability, proportional review, role separation and clear limits on what the platform may claim.",
    items: [
      ["Profile ownership", "Professionals and workshops control their records, while platform rules protect identifier integrity and the audit trail."],
      ["Reviewer separation", "Reviewer and administrator permissions are role-based. Review decisions are attributable to authenticated staff roles."],
      ["Claim-level review", "Evidence review changes the status of a specific claim, not a blanket status for the whole person or workshop."],
      ["Auditability", "Sensitive changes and review actions are recorded so decisions can be traced and corrected where appropriate."],
      ["Taxonomy stewardship", "Core taxonomy changes are controlled rather than freely user-editable, while the model remains extensible over time."],
      ["Disputes and correction", "Production governance should include documented correction, withdrawal and dispute procedures before external scale-up."],
    ],
    boundaryTitle: "Institutional boundary",
    boundaryText: "EUFUA develops and operates CraftID as an independent professional identity and evidence infrastructure. CraftID does not represent the European Union, grant statutory recognition or replace competent authorities, regulated qualifications or formal certification schemes.",
  },
  uk: {
    eyebrow: "Управління",
    title: "Довіра потребує підзвітних правил.",
    intro: "Управління CraftID будується на простежуваності, пропорційній перевірці, розподілі ролей та чітких межах того, що платформа може заявляти.",
    items: [
      ["Власність профілю", "Професіонали та майстерні керують своїми записами, а правила платформи захищають цілісність ідентифікатора та аудиторського сліду."],
      ["Розподіл ролей рецензента", "Права рецензентів та адміністраторів визначаються ролями. Рішення перевірки прив’язані до автентифікованих службових ролей."],
      ["Перевірка на рівні твердження", "Перевірка доказів змінює статус конкретного твердження, а не створює загальний статус для людини чи майстерні."],
      ["Аудитованість", "Чутливі зміни та дії перевірки фіксуються, щоб рішення можна було простежити та, де доречно, виправити."],
      ["Управління таксономією", "Зміни базової таксономії контролюються, а не є вільно редагованими користувачами, водночас модель залишається розширюваною."],
      ["Спори та виправлення", "До масштабування назовні виробниче управління має включати документовані процедури виправлення, відкликання та розгляду спорів."],
    ],
    boundaryTitle: "Інституційна межа",
    boundaryText: "EUFUA розвиває та адмініструє CraftID як незалежну інфраструктуру професійної ідентичності та доказів. CraftID не представляє Європейський Союз, не надає законодавчого визнання та не замінює компетентні органи, регульовані кваліфікації чи формальні схеми сертифікації.",
  },
} as const;

export default async function GovernancePage({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale as keyof typeof copy] ?? copy.en;

  return (
    <>
      <SiteHeader locale={locale} pathname="/governance" />
      <main>
        <section className="pageHero">
          <div className="container">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>
        </section>
        <section className="section editorialSection">
          <div className="container statusGrid">
            {t.items.map(([title, text], index) => (
              <article className="statusCard" key={title}>
                <span className="choiceIndex">{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section trustBand">
          <div className="container sectionLead">
            <div className="eyebrow">EUFUA</div>
            <h2>{t.boundaryTitle}</h2>
            <p>{t.boundaryText}</p>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
