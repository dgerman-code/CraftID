import Link from "next/link";
import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";

type Props = { searchParams: Promise<{ lang?: string }> };

const copy = {
  en: {
    eyebrow: "Public registry",
    title: "Discover professional craft practice.",
    intro: "Search professional records and workshops by craft, skill and location. CraftID is a professional identity and evidence infrastructure — not a marketplace.",
    note: "Public location is shown only at the level selected by the profile owner. Individual professionals default to city- or region-level visibility.",
    search: "Search registry",
    placeholder: "Name, craft or skill",
    craft: "Craft",
    country: "Country",
    type: "Profile type",
    all: "All",
    professional: "Professional",
    workshop: "Workshop",
    featured: "Selected records",
    mapTitle: "Territorial skills visibility",
    mapText: "CraftID can support privacy-safe mapping of professional and workshop locations to make regional skill clusters and craft ecosystems more visible over time.",
    mapCta: "Map view — coming next",
    maria: {
      name: "Maria Kovalenko",
      role: "Ceramicist",
      location: "Lviv, Ukraine",
      id: "CraftID #00001284",
      text: "Independent ceramicist specialising in wheel-thrown stoneware and porcelain, functional tableware and small-batch sculptural work.",
      skills: ["Wheel throwing", "Porcelain", "Ceramic glazing"],
      status: "Evidence reviewed",
    },
    atelier: {
      name: "Atelier Forma",
      role: "Woodcraft workshop",
      location: "Antwerp, Belgium",
      id: "CraftID #00001822",
      text: "Small furniture and woodcraft workshop focused on custom interiors, furniture restoration, traditional joinery and small-series production.",
      skills: ["Custom furniture", "Restoration", "Wood joinery"],
      status: "Document reviewed",
    },
  },
  uk: {
    eyebrow: "Публічний реєстр",
    title: "Відкривайте професійну ремісничу практику.",
    intro: "Шукайте професійні профілі та майстерні за ремеслом, навичкою та місцем. CraftID — це інфраструктура професійної ідентичності й доказів, а не маркетплейс.",
    note: "Публічне місце відображається лише з точністю, обраною власником профілю. Для індивідуальних професіоналів типовим є рівень міста або регіону.",
    search: "Пошук у реєстрі",
    placeholder: "Ім’я, ремесло або навичка",
    craft: "Ремесло",
    country: "Країна",
    type: "Тип профілю",
    all: "Усі",
    professional: "Професіонал",
    workshop: "Майстерня",
    featured: "Вибрані записи",
    mapTitle: "Територіальна видимість навичок",
    mapText: "CraftID може підтримувати приватно-безпечне картографування розташування фахівців і майстерень, щоб з часом зробити видимішими регіональні кластери навичок і ремісничі екосистеми.",
    mapCta: "Карта — наступний етап",
    maria: {
      name: "Maria Kovalenko",
      role: "Керамістка",
      location: "Львів, Україна",
      id: "CraftID #00001284",
      text: "Незалежна керамістка, яка спеціалізується на гончарному кам’яному посуді та порцеляні, функціональному посуді й малосерійному скульптурному виробництві.",
      skills: ["Гончарний круг", "Порцеляна", "Глазурування"],
      status: "Докази переглянуто",
    },
    atelier: {
      name: "Atelier Forma",
      role: "Майстерня деревообробки",
      location: "Антверпен, Бельгія",
      id: "CraftID #00001822",
      text: "Невелика меблева та деревообробна майстерня, що працює з індивідуальними інтер’єрами, реставрацією меблів, традиційним столярством і малосерійним виробництвом.",
      skills: ["Меблі на замовлення", "Реставрація", "Столярні з’єднання"],
      status: "Документ переглянуто",
    },
  },
} as const;

export default async function DiscoverPage({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale];
  const q = locale === "uk" ? "?lang=uk" : "";

  return (
    <>
      <SiteHeader locale={locale} pathname="/discover" />
      <main>
        <section className="pageHero">
          <div className="container">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>
        </section>

        <section className="section compactSection">
          <div className="container">
            <div className="registryToolbar">
              <label className="searchField">
                <span>{t.search}</span>
                <input placeholder={t.placeholder} />
              </label>
              <label>
                <span>{t.craft}</span>
                <select><option>{t.all}</option><option>Ceramics</option><option>Wood</option><option>Textiles</option></select>
              </label>
              <label>
                <span>{t.country}</span>
                <select><option>{t.all}</option><option>Ukraine</option><option>Belgium</option><option>Poland</option></select>
              </label>
              <label>
                <span>{t.type}</span>
                <select><option>{t.all}</option><option>{t.professional}</option><option>{t.workshop}</option></select>
              </label>
            </div>
            <p className="privacyNote">{t.note}</p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="eyebrow">{t.featured}</div>
            <div className="recordList">
              {[t.maria, t.atelier].map((record, index) => (
                <article className="publicRecord" key={record.id}>
                  <div className="recordNumber">0{index + 1}</div>
                  <div>
                    <div className="recordId">{record.id}</div>
                    <h2>{record.name}</h2>
                    <p className="recordRole">{record.role} · {record.location}</p>
                    <p>{record.text}</p>
                    <div className="tagRow">{record.skills.map((s) => <span className="tag" key={s}>{s}</span>)}</div>
                  </div>
                  <div className="recordStatus">
                    <span>{record.status}</span>
                    <Link href={index === 0 ? `/professionals/maria-kovalenko${q}` : `/workshops/atelier-forma${q}`}>
                      {locale === "uk" ? "Відкрити запис" : "Open record"} →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section trustBand">
          <div className="container trustBandInner">
            <div>
              <div className="eyebrow">Map</div>
              <h2>{t.mapTitle}</h2>
              <p>{t.mapText}</p>
            </div>
            <span className="button buttonDisabled">{t.mapCta}</span>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
