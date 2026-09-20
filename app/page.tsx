import Link from "next/link";
import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";

type HomeProps = { searchParams: Promise<{ lang?: string }> };

const copy = {
  en: {
    eyebrow: "Professional identity infrastructure",
    title: "Professional identity, built on evidence.",
    intro: "CraftID is a European-oriented professional identity, skills and evidence infrastructure for craftspeople, workshops and craft-based micro-enterprises.",
    create: "Create CraftID",
    explore: "Explore registry",
    logicLabel: "Core logic",
    logic: ["Identity", "Skills", "Practice", "Evidence", "Trust"],
    whyTitle: "A durable professional record.",
    whyText: "CraftID gives people and workshops a persistent professional reference that can connect skills, experience, qualifications, affiliations and supporting evidence in one structured record.",
    cards: [
      ["Identity", "A persistent CraftID reference for a professional or workshop. The identifier does not encode country, profession, year or legal status."],
      ["Skills & practice", "Describe the skills used in professional practice and connect them with experience, qualifications, portfolio items and affiliations."],
      ["Evidence", "Link individual professional claims to supporting material. Evidence is private by default and is not automatically made public."],
      ["Trust", "Public records distinguish clearly between self-declared information, submitted evidence and claims that have undergone review."],
    ],
    audience: "Who CraftID is for",
    profTitle: "For professionals and workshops",
    profText: "Build a portable professional record that is independent of a marketplace, employer or single project. Present skills, practice and evidence without turning the profile into a sales listing.",
    instTitle: "For institutions and ecosystems",
    instText: "Understand where craft skills are practised, identify regional capabilities and support skills intelligence, vocational pathways, heritage continuity and cross-border cooperation.",
    trustTitle: "Trust should be explicit, not implied.",
    trustText: "CraftID does not certify a whole person. Review applies to specific claims and the evidence linked to them. Public status language is designed to show exactly what has — and has not — been reviewed.",
    methodology: "Read the methodology",
  },
  uk: {
    eyebrow: "Інфраструктура професійної ідентичності",
    title: "Професійна ідентичність, побудована на доказах.",
    intro: "CraftID — європейсько-орієнтована інфраструктура професійної ідентичності, навичок і доказів для майстрів, майстерень та мікропідприємств у сфері ремесел.",
    create: "Створити CraftID",
    explore: "Переглянути реєстр",
    logicLabel: "Основна логіка",
    logic: ["Ідентичність", "Навички", "Практика", "Докази", "Довіра"],
    whyTitle: "Сталий професійний запис.",
    whyText: "CraftID надає майстрам і майстерням постійний професійний ідентифікатор, який поєднує навички, досвід, кваліфікації, професійні зв’язки та підтвердні матеріали в одному структурованому записі.",
    cards: [
      ["Ідентичність", "Постійний ідентифікатор CraftID для фахівця або майстерні. Він не кодує країну, професію, рік чи юридичний статус."],
      ["Навички та практика", "Описуйте професійно застосовувані навички та пов’язуйте їх із досвідом, кваліфікаціями, портфоліо і професійними зв’язками."],
      ["Докази", "Пов’язуйте окремі професійні твердження з підтвердними матеріалами. Докази за замовчуванням є приватними."],
      ["Довіра", "Публічний запис чітко розрізняє самостійно заявлену інформацію, подані докази та твердження, що пройшли перевірку."],
    ],
    audience: "Для кого CraftID",
    profTitle: "Для майстрів і майстерень",
    profText: "Створюйте переносимий професійний запис, незалежний від маркетплейсу, роботодавця чи окремого проєкту. Представляйте навички, практику та докази без перетворення профілю на оголошення про продаж.",
    instTitle: "Для інституцій та екосистем",
    instText: "Отримуйте краще розуміння того, де практикуються ремісничі навички, які регіональні компетенції існують, та використовуйте це для розвитку навичок, професійної освіти, збереження спадщини й транскордонної співпраці.",
    trustTitle: "Довіра має бути чіткою, а не припущеною.",
    trustText: "CraftID не сертифікує людину в цілому. Перевірка стосується конкретних тверджень і пов’язаних із ними доказів. Публічні статуси показують, що саме було перевірено — і що не було.",
    methodology: "Переглянути методологію",
  },
} as const;

export default async function HomePage({ searchParams }: HomeProps) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale];
  const q = locale === "uk" ? "?lang=uk" : "";

  return (
    <>
      <SiteHeader locale={locale} pathname="/" />
      <main>
        <section className="hero">
          <div className="container">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
            <div className="actions">
              <Link className="button buttonPrimary" href="/signup">{t.create}</Link>
              <Link className="button" href={`/discover${q}`}>{t.explore}</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="eyebrow">{t.logicLabel}</div>
            <div className="logic">
              {t.logic.map((item, index) => (
                <div className="logicItem" key={item}>
                  <strong>0{index + 1}</strong>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section editorialSection">
          <div className="container">
            <div className="sectionLead">
              <div className="eyebrow">CraftID</div>
              <h2>{t.whyTitle}</h2>
              <p>{t.whyText}</p>
            </div>
            <div className="informationGrid">
              {t.cards.map(([title, text], index) => (
                <article className="informationCard" key={title}>
                  <span className="choiceIndex">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section editorialSection">
          <div className="container">
            <div className="eyebrow">{t.audience}</div>
            <div className="splitFeature">
              <article>
                <h2>{t.profTitle}</h2>
                <p>{t.profText}</p>
              </article>
              <article>
                <h2>{t.instTitle}</h2>
                <p>{t.instText}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section trustBand">
          <div className="container trustBandInner">
            <div>
              <div className="eyebrow">Trust model</div>
              <h2>{t.trustTitle}</h2>
              <p>{t.trustText}</p>
            </div>
            <Link className="button" href={`/methodology${q}`}>{t.methodology}</Link>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
