import Link from "next/link";
import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";

type HomeProps = { searchParams: Promise<{ lang?: string }> };

const copy = {
  en: {
    pilotLabel: "Pilot platform",
    pilotText: "CraftID is currently in active development and testing. Features, data structures and workflows may change before public launch.",
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
    valueEyebrow: "For craft professionals",
    valueTitle: "One identity. Practical value over time.",
    valueIntro: "CraftID is designed to be more than a profile. It gives a craft professional a permanent reference that can be used across products, professional communication, applications and changing places of work.",
    valueItems: [
      ["Permanent CraftID", "One professional identifier that can be used on products, packaging, business cards, websites, CVs, catalogues and applications. The CraftID remains tied to the same professional or workshop over time."],
      ["Public professional profile", "A buyer, fair organiser, partner or institution can follow the CraftID or QR code to see who the maker is and what professional practice they present publicly."],
      ["Evidence-backed skills history", "Skills, experience, training, qualifications and other claims can gradually be connected to supporting evidence and attestations, while keeping evidence private unless disclosure is explicitly intended."],
      ["Professional Identity Certificate", "Issue and download a versioned CraftID Professional Identity Certificate with its own Certificate ID and QR verification for professional communication, applications and printed materials."],
      ["Product traceability", "When a CraftID is placed on a product or document, the identifier can remain resolvable over time so the registered maker or workshop can still be identified even if the active account is later closed."],
      ["Privacy control", "The CraftID owner decides what is public: country, region or city, profile details, contacts and photo. Workshop owners may also explicitly choose whether to publish an exact business address."],
      ["Professional ↔ Workshop link", "A Professional CraftID can be linked to a Workshop CraftID without merging the two identities, so a person keeps their own professional record when a workshop, employer or place of practice changes."],
      ["Transparent trust", "CraftID does not claim that a maker is ‘good’ or globally certified. It shows structured professional information and distinguishes self-declared information, evidence and reviewed claims."],
      ["Access through the partner network", "As the network develops, CraftID can be used by national and sectoral partners, craft organisations, fairs, education providers and support programmes as a structured professional reference."],
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
    pilotLabel: "Пілотна платформа",
    pilotText: "CraftID зараз перебуває в активній розробці та тестуванні. Функції, структура даних і робочі процеси можуть змінюватися до публічного запуску.",
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
    valueEyebrow: "Для майстрів",
    valueTitle: "Одна ідентичність. Практична цінність упродовж професійного шляху.",
    valueIntro: "CraftID задуманий як більше, ніж просто профіль. Майстер отримує постійний професійний ідентифікатор, який можна використовувати на виробах, у професійній комунікації, заявках і при зміні місця роботи чи країни.",
    valueItems: [
      ["Постійний CraftID", "Один професійний ідентифікатор, який можна використовувати на виробах, пакуванні, візитках, сайті, CV, каталогах і заявках. CraftID залишається прив’язаним до того самого майстра або майстерні впродовж часу."],
      ["Публічний професійний профіль", "Покупець, організатор ярмарку, партнер або інституція можуть перейти за CraftID чи QR-кодом і побачити, хто є виробником та яку професійну практику він показує публічно."],
      ["Історія навичок, підкріплена доказами", "Навички, досвід, навчання, кваліфікації та інші твердження можна поступово пов’язувати з доказами та attestations, при цьому самі докази залишаються приватними, якщо їх розкриття окремо не передбачено."],
      ["Professional Identity Certificate", "Випускайте та завантажуйте версійний CraftID Professional Identity Certificate у PDF із власним Certificate ID та QR-перевіркою для професійної комунікації, заявок і друкованих матеріалів."],
      ["Прослідковуваність виробів", "Якщо CraftID нанесено на виріб або документ, ідентифікатор може залишатися доступним для перевірки з часом, щоб можна було встановити зареєстрованого майстра або майстерню навіть після закриття активного акаунта."],
      ["Контроль приватності", "Власник CraftID сам визначає, що є публічним: країна, регіон або місто, дані профілю, контакти та фото. Власник Workshop CraftID також може окремо вирішити, чи публікувати точну бізнес-адресу."],
      ["Зв’язок Professional ↔ Workshop", "Professional CraftID можна пов’язати з Workshop CraftID без об’єднання двох ідентичностей. Майстер зберігає власний професійний запис навіть при зміні майстерні, роботодавця або місця практики."],
      ["Прозора модель довіри", "CraftID не заявляє, що майстер є «хорошим» або глобально сертифікованим. Платформа показує структуровану професійну інформацію та розрізняє самостійно заявлені дані, докази й перевірені твердження."],
      ["Доступ через мережу партнерів", "У міру розвитку мережі CraftID може використовуватися національними та галузевими партнерами, ремісничими організаціями, ярмарками, освітніми установами та програмами підтримки як структурований професійний орієнтир."],
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
        <aside className="pilotNotice" aria-label={t.pilotLabel}>
          <div className="container pilotNoticeInner">
            <strong>{t.pilotLabel}</strong>
            <span>{t.pilotText}</span>
          </div>
        </aside>
        <section className="hero homeHero">
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

        <section className="section homeLogicSection">
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

        <section className="section editorialSection homeEditorialSection">
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
            <div className="sectionLead">
              <div className="eyebrow">{t.valueEyebrow}</div>
              <h2>{t.valueTitle}</h2>
              <p>{t.valueIntro}</p>
            </div>
            <div className="informationGrid">
              {t.valueItems.map(([title, text], index) => (
                <article className="informationCard" key={title}>
                  <span className="choiceIndex">{String(index + 1).padStart(2, "0")}</span>
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
