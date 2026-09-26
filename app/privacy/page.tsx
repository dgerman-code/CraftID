import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";

type Props = { searchParams: Promise<{ lang?: string }> };

const copy = {
  en: {
    eyebrow: "Privacy",
    title: "Professional visibility without unnecessary exposure.",
    intro: "CraftID is designed to separate a public professional record from private supporting evidence and account data.",
    principles: [
      ["Data minimisation", "Collect only information needed to operate the professional record, review evidence and provide relevant platform functions."],
      ["Evidence is private by default", "Raw evidence files are stored privately and are not automatically exposed through public profiles."],
      ["Location control", "Professionals can use country, region or city-level visibility. Exact location is intended only for appropriate public business premises."],
      ["Purpose limitation", "Data should not be reused for unrelated purposes without a lawful basis and transparent governance."],
      ["Account control", "Profile owners manage descriptive information and visibility settings, subject to platform integrity, audit and review requirements."],
      ["Institutional use", "Any future aggregated analytics should respect privacy, lawful processing and clear governance rather than exposing individual private data."],
    ],
    note: "This page explains the product privacy model and is not a substitute for the final legal privacy notice, which must be completed before public launch.",
  },
  uk: {
    eyebrow: "Приватність",
    title: "Професійна видимість без зайвого розкриття даних.",
    intro: "CraftID проєктується так, щоб відокремлювати публічний професійний запис від приватних доказів і даних облікового запису.",
    principles: [
      ["Мінімізація даних", "Збирати лише інформацію, необхідну для роботи професійного запису, перевірки доказів та релевантних функцій платформи."],
      ["Докази приватні за замовчуванням", "Первинні файли доказів зберігаються приватно та не відкриваються автоматично через публічні профілі."],
      ["Контроль місцезнаходження", "Професіонали можуть використовувати рівень країни, регіону або міста. Точне місце передбачене лише для доречних публічних бізнес-приміщень."],
      ["Обмеження мети", "Дані не повинні використовуватися для несумісних цілей без законної підстави та прозорого управління."],
      ["Контроль власника", "Власники профілів керують описовою інформацією та видимістю з урахуванням вимог цілісності платформи, аудиту й перевірки."],
      ["Інституційне використання", "Майбутня агрегована аналітика має поважати приватність, законність обробки та чітке управління, а не розкривати приватні дані окремих осіб."],
    ],
    note: "Ця сторінка пояснює продуктову модель приватності та не замінює фінальне юридичне повідомлення про приватність, яке має бути підготовлене до публічного запуску.",
  },
} as const;

export default async function PrivacyPage({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale as keyof typeof copy] ?? copy.en;

  return (
    <>
      <SiteHeader locale={locale} pathname="/privacy" />
      <main>
        <section className="pageHero">
          <div className="container">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>
        </section>
        <section className="section editorialSection">
          <div className="container informationGrid">
            {t.principles.map(([title, text], index) => (
              <article className="informationCard" key={title}>
                <span className="choiceIndex">{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section disclaimerBand"><div className="container"><p>{t.note}</p></div></section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
