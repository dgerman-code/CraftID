import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";

type Props = { searchParams: Promise<{ lang?: string }> };

const copy = {
  en: {
    eyebrow: "Trust methodology",
    title: "Clear claims. Clear evidence. Clear review status.",
    intro: "CraftID separates what a profile owner says about professional practice from the evidence that may support a specific claim, and from the review status of that claim.",
    modelTitle: "Claim-based trust model",
    modelText: "Review is applied to individual claims and supporting evidence. CraftID does not use a blanket “verified professional” status. Identity review is a separate control and is not a higher professional trust level.",
    identityTrack: "Identity review",
    identityTrackText: "Identity review links identity evidence to the profile owner. It runs in parallel to professional claim review and does not verify skills, experience or qualifications.",
    statuses: [
      ["Self-declared", "Information entered by the profile owner and not independently reviewed."],
      ["Evidence submitted", "Supporting evidence has been uploaded or referenced for a specific claim and is awaiting or undergoing review."],
      ["Document reviewed", "A reviewer has inspected documentary evidence in relation to the displayed claim. This does not independently recognise the underlying qualification or status."],
      ["Evidence reviewed", "Available evidence has been assessed and reasonably supports the specific claim under the applicable review procedure."],
      ["External source confirmed", "A claim corresponds to an identifiable external source, register, institution or issuer."],
    ],
    reviewsTitle: "What CraftID may review",
    reviewsText: "Identity information and evidence linked to individual professional claims, such as selected qualifications, experience, affiliations, business registration or other documented assertions.",
    notTitle: "What CraftID does not certify",
    notText: "CraftID does not grant official professional status, statutory licences, EU qualifications, geographical indication rights or blanket certification of a person or workshop.",
    evidenceTitle: "Evidence and privacy",
    evidenceText: "Raw supporting files are private by default. Public profiles show relevant trust status and source information rather than exposing sensitive documents automatically.",
    governanceTitle: "Review governance",
    governanceText: "Review actions should be attributable, auditable and reversible where correction or dispute is required. Reviewer access is role-based, and private reviewer notes are not part of the public profile.",
    disclaimer: "CraftID is an independent professional identity and evidence infrastructure. Its methodology may draw on relevant European approaches to traceability, evidence, provenance and credentials, without constituting statutory registration, certification or recognition.",
  },
  uk: {
    eyebrow: "Методологія довіри",
    title: "Чіткі твердження. Чіткі докази. Чіткий статус перевірки.",
    intro: "CraftID розділяє інформацію, яку власник профілю заявляє про професійну практику, докази, що можуть підтверджувати конкретне твердження, та статус перевірки цього твердження.",
    modelTitle: "Модель довіри на рівні тверджень",
    modelText: "Перевірка застосовується до окремих тверджень і підтвердних матеріалів. CraftID не використовує узагальнений статус «верифікований професіонал». Перевірка ідентичності є окремим контролем і не є вищим рівнем професійної довіри.",
    identityTrack: "Перевірка ідентичності",
    identityTrackText: "Перевірка ідентичності пов’язує документи, що посвідчують особу, з власником профілю. Вона відбувається паралельно до перевірки професійних тверджень і не підтверджує навички, досвід чи кваліфікації.",
    statuses: [
      ["Заявлено самостійно", "Інформація внесена власником профілю та не перевірялася незалежно."],
      ["Докази подано", "Підтвердний матеріал завантажено або зазначено для конкретного твердження; перевірка очікується або триває."],
      ["Документ переглянуто", "Рецензент переглянув документальні докази у зв’язку з відображеним твердженням. Це не означає незалежного визнання кваліфікації чи статусу."],
      ["Докази переглянуто", "Наявні докази оцінено та вони обґрунтовано підтримують конкретне твердження відповідно до застосованої процедури."],
      ["Підтверджено зовнішнім джерелом", "Твердження відповідає ідентифікованому зовнішньому джерелу, реєстру, установі або видавцю."],
    ],
    reviewsTitle: "Що CraftID може перевіряти",
    reviewsText: "Дані про ідентичність та докази, пов’язані з окремими професійними твердженнями, наприклад вибраними кваліфікаціями, досвідом, професійними зв’язками, реєстрацією бізнесу або іншими документованими відомостями.",
    notTitle: "Що CraftID не сертифікує",
    notText: "CraftID не надає офіційного професійного статусу, законодавчих ліцензій, кваліфікацій ЄС, прав на географічні зазначення або загальної сертифікації людини чи майстерні.",
    evidenceTitle: "Докази та приватність",
    evidenceText: "Первинні підтвердні файли за замовчуванням є приватними. Публічні профілі показують релевантний статус довіри та інформацію про джерело, а не автоматично відкривають чутливі документи.",
    governanceTitle: "Управління перевіркою",
    governanceText: "Дії з перевірки мають бути атрибутованими, аудитованими та придатними до перегляду у разі виправлення або спору. Доступ рецензентів визначається ролями, а приватні нотатки рецензента не є частиною публічного профілю.",
    disclaimer: "CraftID є незалежною інфраструктурою професійної ідентичності та доказів. Її методологія може спиратися на релевантні європейські підходи до простежуваності, доказів, походження та цифрових кваліфікацій, але не є законодавчою реєстрацією, сертифікацією чи офіційним визнанням.",
  },
} as const;

export default async function MethodologyPage({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale as keyof typeof copy] ?? copy.en;

  return (
    <>
      <SiteHeader locale={locale} pathname="/methodology" />
      <main className="publicInfoPage">
        <section className="pageHero">
          <div className="container">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>
        </section>

        <section className="section editorialSection">
          <div className="container">
            <div className="sectionLead">
              <div className="eyebrow">Trust</div>
              <h2>{t.modelTitle}</h2>
              <p>{t.modelText}</p>
            </div>
            <div className="trustModelLayout">
              <div className="claimTrustTrack">
                {t.statuses.map(([title, text], index) => (
                  <article className="claimTrustStep" key={title}>
                    <span className="choiceIndex">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </article>
                ))}
              </div>
              <aside className="identityTrustTrack">
                <div className="eyebrow">{locale === "uk" ? "Паралельний контроль" : "Parallel control"}</div>
                <h3>{t.identityTrack}</h3>
                <p>{t.identityTrackText}</p>
              </aside>
            </div>
          </div>
        </section>

        <section className="section editorialSection">
          <div className="container informationGrid">
            <article className="informationCard">
              <div className="eyebrow">Scope</div>
              <h3>{t.reviewsTitle}</h3>
              <p>{t.reviewsText}</p>
            </article>
            <article className="informationCard">
              <div className="eyebrow">Limits</div>
              <h3>{t.notTitle}</h3>
              <p>{t.notText}</p>
            </article>
            <article className="informationCard">
              <div className="eyebrow">Privacy</div>
              <h3>{t.evidenceTitle}</h3>
              <p>{t.evidenceText}</p>
            </article>
            <article className="informationCard">
              <div className="eyebrow">Governance</div>
              <h3>{t.governanceTitle}</h3>
              <p>{t.governanceText}</p>
            </article>
          </div>
        </section>

        <section className="section disclaimerBand">
          <div className="container">
            <p>{t.disclaimer}</p>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
