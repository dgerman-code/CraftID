import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";

type Props = { searchParams: Promise<{ lang?: string }> };

const copy = {
  en: {
    eyebrow: "About CraftID",
    title: "Infrastructure for professional visibility and trust.",
    intro: "CraftID is an EUFUA digital instrument designed to make craft competences more visible, portable, evidence-based and understandable across professional, regional and institutional contexts.",
    purposeTitle: "Purpose",
    purposeText: "Many craft professionals and small workshops have fragmented professional evidence: experience sits in one place, qualifications in another, portfolio material elsewhere, while practical skills are often difficult to compare or discover. CraftID brings these elements into a structured professional record.",
    notTitle: "What CraftID is not",
    notItems: [
      "Not a marketplace or sales platform.",
      "Not a social network.",
      "Not a statutory professional register.",
      "Not an EU certification or qualification authority.",
      "Not a substitute for licences, regulated qualifications or formal recognition procedures.",
    ],
    usersTitle: "Who can use it",
    usersText: "The infrastructure is designed for individual craftspeople, workshops and craft-based micro-enterprises, with future institutional interfaces for chambers, education providers, professional organisations, municipalities and other ecosystem actors.",
    ecosystemTitle: "Institutional value",
    ecosystemText: "Aggregated, privacy-respecting data can support skills intelligence, regional development, vocational education, craft heritage continuity, SME support and cross-border cooperation. These institutional uses should develop only with clear governance, lawful data use and transparent methodology.",
    euTitle: "European orientation",
    euText: "CraftID is designed for interoperability with broader European approaches to skills, credentials, digital identity, provenance and regional development. Alignment does not imply endorsement, accreditation or official EU status.",
    governanceTitle: "Governance principle",
    governanceText: "Trust must be evidence-based, proportionate and transparent. The platform should collect only what is necessary, separate public and private information, keep review decisions auditable and avoid claims that exceed the evidence available.",
    initiativeTitle: "An EUFUA digital instrument",
    initiativeText: "EUFUA develops CraftID as professional and ecosystem infrastructure: helping structure information, improve visibility and connect professional evidence with future opportunities and institutional cooperation.",
  },
  uk: {
    eyebrow: "Про CraftID",
    title: "Інфраструктура професійної видимості та довіри.",
    intro: "CraftID — цифровий інструмент EUFUA, створений для того, щоб зробити ремісничі компетенції видимішими, переносимими, доказовими та зрозумілими у професійному, регіональному й інституційному контекстах.",
    purposeTitle: "Мета",
    purposeText: "У багатьох майстрів і невеликих майстерень професійні докази фрагментовані: досвід зберігається в одному місці, кваліфікації — в іншому, портфоліо — окремо, а практичні навички складно порівнювати або знаходити. CraftID поєднує ці елементи у структурований професійний запис.",
    notTitle: "Чим CraftID не є",
    notItems: [
      "Не маркетплейс і не платформа продажів.",
      "Не соціальна мережа.",
      "Не державний чи законодавчий професійний реєстр.",
      "Не орган сертифікації або присвоєння кваліфікацій ЄС.",
      "Не заміна ліцензіям, регульованим кваліфікаціям або формальним процедурам визнання.",
    ],
    usersTitle: "Для кого створено",
    usersText: "Інфраструктура розрахована на окремих майстрів, майстерні та ремісничі мікропідприємства, з перспективою інституційних інтерфейсів для палат, закладів освіти, професійних організацій, муніципалітетів та інших учасників екосистеми.",
    ecosystemTitle: "Інституційна цінність",
    ecosystemText: "Агреговані дані з належним захистом приватності можуть підтримувати аналітику навичок, регіональний розвиток, професійну освіту, збереження ремісничої спадщини, підтримку МСП і транскордонну співпрацю. Такі сценарії мають розвиватися лише з чітким управлінням, законним використанням даних і прозорою методологією.",
    euTitle: "Європейська орієнтація",
    euText: "CraftID проєктується для сумісності з ширшими європейськими підходами до навичок, цифрових кваліфікацій, цифрової ідентичності, походження та регіонального розвитку. Узгодження не означає офіційного схвалення, акредитації чи статусу ЄС.",
    governanceTitle: "Принцип управління",
    governanceText: "Довіра має ґрунтуватися на доказах, бути пропорційною та прозорою. Платформа повинна збирати лише необхідні дані, розділяти публічну й приватну інформацію, зберігати аудитованість рішень та уникати тверджень, що перевищують наявні докази.",
    initiativeTitle: "Цифровий інструмент EUFUA",
    initiativeText: "EUFUA розвиває CraftID як професійну та екосистемну інфраструктуру: для структурування інформації, підвищення видимості та поєднання професійних доказів із майбутніми можливостями та інституційною співпрацею.",
  },
} as const;

export default async function AboutPage({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale as keyof typeof copy] ?? copy.en;

  return (
    <>
      <SiteHeader locale={locale} pathname="/about" />
      <main className="publicInfoPage">
        <section className="pageHero">
          <div className="container">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>
        </section>

        <section className="section editorialSection">
          <div className="container splitFeature">
            <article>
              <div className="eyebrow">01</div>
              <h2>{t.purposeTitle}</h2>
              <p>{t.purposeText}</p>
            </article>
            <article>
              <div className="eyebrow">02</div>
              <h2>{t.usersTitle}</h2>
              <p>{t.usersText}</p>
            </article>
          </div>
        </section>

        <section className="section editorialSection">
          <div className="container">
            <div className="sectionLead">
              <div className="eyebrow">Boundaries</div>
              <h2>{t.notTitle}</h2>
            </div>
            <div className="boundaryList">
              {t.notItems.map((item, index) => (
                <div className="boundaryItem" key={item}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section editorialSection">
          <div className="container informationGrid">
            <article className="informationCard">
              <div className="eyebrow">Ecosystem</div>
              <h3>{t.ecosystemTitle}</h3>
              <p>{t.ecosystemText}</p>
            </article>
            <article className="informationCard">
              <div className="eyebrow">Europe</div>
              <h3>{t.euTitle}</h3>
              <p>{t.euText}</p>
            </article>
            <article className="informationCard">
              <div className="eyebrow">Governance</div>
              <h3>{t.governanceTitle}</h3>
              <p>{t.governanceText}</p>
            </article>
            <article className="informationCard">
              <div className="eyebrow">EUFUA</div>
              <h3>{t.initiativeTitle}</h3>
              <p>{t.initiativeText}</p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
