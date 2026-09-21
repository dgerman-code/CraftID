import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ lang?: string; craftid?: string }> };

function parseCraftId(value: string) {
  const compact = value.trim().replace(/^CraftID\s*/i, "").replace(/^#/, "");
  const match = compact.match(/^0*(\d+)-(\d{2})$/);
  if (!match) return null;

  const number = Number(match[1]);
  if (!Number.isSafeInteger(number) || number < 1) return null;

  return {
    number,
    check: match[2],
    route: `${String(number).padStart(8, "0")}-${match[2]}`,
  };
}

const copy = {
  en: {
    eyebrow: "Public registry",
    title: "Discover professional craft practice.",
    intro: "Find a specific CraftID record directly, or explore published professionals and workshops by craft, skill and location.",
    idEyebrow: "Direct CraftID lookup",
    idTitle: "Find a CraftID record",
    idText: "Use the permanent CraftID number to open a published professional or workshop record directly.",
    idLabel: "CraftID number",
    idPlaceholder: "#00000101-86",
    idButton: "Open record",
    idHint: "Enter the full CraftID number, including the two check digits.",
    idInvalid: "Enter a valid CraftID in the format #00000101-86.",
    idMissing: "No published CraftID record was found for that number.",
    browseEyebrow: "Browse registry",
    browseTitle: "Explore by professional context",
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
      id: "CraftID #00001284-29",
      text: "Independent ceramicist specialising in wheel-thrown stoneware and porcelain, functional tableware and small-batch sculptural work.",
      skills: ["Wheel throwing", "Porcelain", "Ceramic glazing"],
      status: "Evidence reviewed",
    },
    atelier: {
      name: "Atelier Forma",
      role: "Woodcraft workshop",
      location: "Antwerp, Belgium",
      id: "CraftID #00001822-64",
      text: "Small furniture and woodcraft workshop focused on custom interiors, furniture restoration, traditional joinery and small-series production.",
      skills: ["Custom furniture", "Restoration", "Wood joinery"],
      status: "Document reviewed",
    },
  },
  uk: {
    eyebrow: "Публічний реєстр",
    title: "Відкривайте професійну ремісничу практику.",
    intro: "Знайдіть конкретний запис CraftID за номером або переглядайте опубліковані профілі професіоналів і майстерень за ремеслом, навичками та місцем.",
    idEyebrow: "Прямий пошук CraftID",
    idTitle: "Знайти запис CraftID",
    idText: "Використовуйте постійний номер CraftID, щоб одразу відкрити опублікований запис професіонала або майстерні.",
    idLabel: "Номер CraftID",
    idPlaceholder: "#00000101-86",
    idButton: "Відкрити запис",
    idHint: "Введіть повний номер CraftID разом із двома контрольними цифрами.",
    idInvalid: "Введіть коректний CraftID у форматі #00000101-86.",
    idMissing: "Опублікований запис CraftID з таким номером не знайдено.",
    browseEyebrow: "Пошук у реєстрі",
    browseTitle: "Пошук за професійним контекстом",
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
      id: "CraftID #00001284-29",
      text: "Незалежна керамістка, яка спеціалізується на гончарному кам’яному посуді та порцеляні, функціональному посуді й малосерійному скульптурному виробництві.",
      skills: ["Гончарний круг", "Порцеляна", "Глазурування"],
      status: "Докази переглянуто",
    },
    atelier: {
      name: "Atelier Forma",
      role: "Майстерня деревообробки",
      location: "Антверпен, Бельгія",
      id: "CraftID #00001822-64",
      text: "Невелика меблева та деревообробна майстерня, що працює з індивідуальними інтер’єрами, реставрацією меблів, традиційним столярством і малосерійним виробництвом.",
      skills: ["Меблі на замовлення", "Реставрація", "Столярні з’єднання"],
      status: "Документ переглянуто",
    },
  },
} as const;

export default async function DiscoverPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale];
  const q = locale === "uk" ? "?lang=uk" : "";
  let lookupError: string | null = null;

  if (params.craftid) {
    const parsed = parseCraftId(params.craftid);

    if (!parsed) {
      lookupError = t.idInvalid;
    } else {
      const supabase = await createClient();
      const { data: profile } = await supabase.rpc("public_craftid_profile", {
        p_craftid_number: parsed.number,
        p_check_digits: parsed.check,
      });

      if (profile) {
        redirect(`/id/${parsed.route}${q}`);
      }

      lookupError = t.idMissing;
    }
  }

  return (
    <>
      <SiteHeader locale={locale} pathname="/discover" />
      <main>
        <section className="pageHero registryHero">
          <div className="container">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>
        </section>

        <section className="craftIdLookupSection">
          <div className="container craftIdLookupGrid">
            <div className="craftIdLookupIntro">
              <div className="eyebrow">{t.idEyebrow}</div>
              <h2>{t.idTitle}</h2>
              <p>{t.idText}</p>
            </div>
            <form className="craftIdLookupForm" method="get" action="/discover">
              {locale === "uk" ? <input type="hidden" name="lang" value="uk" /> : null}
              <label htmlFor="craftid-lookup">{t.idLabel}</label>
              <div className="craftIdLookupControl">
                <input
                  id="craftid-lookup"
                  name="craftid"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={t.idPlaceholder}
                  defaultValue={params.craftid ?? ""}
                  aria-describedby="craftid-hint"
                />
                <button className="button buttonPrimary" type="submit">{t.idButton}</button>
              </div>
              <p id="craftid-hint" className="craftIdLookupHint">{t.idHint}</p>
              {lookupError ? <p className="formMessage error">{lookupError}</p> : null}
            </form>
          </div>
        </section>

        <section className="section compactSection registryBrowseSection">
          <div className="container">
            <div className="registryBrowseHeading">
              <div className="eyebrow">{t.browseEyebrow}</div>
              <h2>{t.browseTitle}</h2>
            </div>
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
              <div className="eyebrow">{locale === "uk" ? "Карта" : "Map"}</div>
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
