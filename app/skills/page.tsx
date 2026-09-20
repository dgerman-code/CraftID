import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";

type Props = { searchParams: Promise<{ lang?: string }> };

const copy = {
  en: {
    eyebrow: "Skills & taxonomy",
    title: "A structured language for craft skills.",
    intro: "CraftID uses a growing taxonomy to describe craft disciplines, professions and practical skills in a consistent way while preserving room for local craft traditions and specialist practice.",
    taxonomyTitle: "Core craft domains",
    taxonomyText: "The taxonomy starts with broad craft domains and expands through professions, practical skills and specialist terms. These domains are navigation anchors, not the final classification system.",
    categories: [
      ["Ceramics", "Ceramic production, forming, glazing, firing and related studio practice."],
      ["Wood", "Woodcraft, joinery, furniture making, carving and workshop production."],
      ["Textiles", "Textile making, weaving, embroidery, sewing and related craft techniques."],
      ["Metal", "Metal craft, fabrication, smithing and specialist finishing techniques."],
      ["Glass", "Glass craft, forming, finishing and studio production."],
      ["Jewellery", "Jewellery making, small-scale metalwork and related specialist techniques."],
      ["Restoration", "Repair, conservation and restoration practice across relevant materials."],
      ["Stone", "Stone craft, carving, finishing and related material practice."],
      ["Leather", "Leather craft, construction, finishing and repair."],
      ["Other", "A controlled route for practices not yet represented in the core taxonomy."],
    ],
    alignmentTitle: "European interoperability by design",
    alignmentText: "Taxonomy identifiers remain locale-independent so labels can be translated without changing the underlying data. Future alignment may reference relevant European skills and credential frameworks where useful, without making CraftID dependent on a single external system.",
    traditionTitle: "Skills are not the same as traditions",
    traditionText: "CraftID keeps practical skills, professions, geographic origin and craft traditions as distinct concepts. This reduces ambiguity and allows a record to describe both professional competence and cultural context without conflating them.",
  },
  uk: {
    eyebrow: "Навички та таксономія",
    title: "Структурована мова ремісничих навичок.",
    intro: "CraftID використовує таксономію, що розвивається, для послідовного опису ремісничих напрямів, професій і практичних навичок, зберігаючи місце для локальних традицій та спеціалізованої практики.",
    taxonomyTitle: "Основні ремісничі напрями",
    taxonomyText: "Таксономія починається з широких ремісничих напрямів і розширюється через професії, практичні навички та спеціалізовані терміни. Ці напрями є навігаційною основою, а не завершеною системою класифікації.",
    categories: [
      ["Кераміка", "Виробництво кераміки, формування, глазурування, випал та пов’язана студійна практика."],
      ["Дерево", "Деревообробка, столярство, меблеве виробництво, різьблення та майстернева практика."],
      ["Текстиль", "Ткацтво, вишивка, шиття та інші текстильні ремісничі техніки."],
      ["Метал", "Робота з металом, ковальство, виготовлення та спеціалізоване оздоблення."],
      ["Скло", "Робота зі склом, формування, обробка та студійне виробництво."],
      ["Ювелірна справа", "Виготовлення прикрас, дрібна робота з металом та спеціалізовані техніки."],
      ["Реставрація", "Ремонт, консервація та реставраційна практика для відповідних матеріалів."],
      ["Камінь", "Робота з каменем, різьблення, обробка та пов’язані матеріальні практики."],
      ["Шкіра", "Робота зі шкірою, виготовлення, оздоблення та ремонт."],
      ["Інше", "Контрольований шлях для практик, які ще не представлені в основній таксономії."],
    ],
    alignmentTitle: "Європейська сумісність за задумом",
    alignmentText: "Ідентифікатори таксономії залишаються незалежними від мови, щоб назви можна було перекладати без зміни базових даних. У майбутньому можливе узгодження з релевантними європейськими рамками навичок і цифрових кваліфікацій, де це буде корисно.",
    traditionTitle: "Навички — не те саме, що традиції",
    traditionText: "CraftID розділяє практичні навички, професії, географічне походження та ремісничі традиції як окремі поняття. Це зменшує неоднозначність і дозволяє описувати як професійну компетентність, так і культурний контекст.",
  },
} as const;

export default async function SkillsPage({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale];

  return (
    <>
      <SiteHeader locale={locale} pathname="/skills" />
      <main>
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
              <div className="eyebrow">{locale === "uk" ? "Структура" : "Structure"}</div>
              <h2>{t.taxonomyTitle}</h2>
              <p>{t.taxonomyText}</p>
            </div>
            <div className="taxonomyGrid">
              {t.categories.map(([title, text], index) => (
                <article className="taxonomyCard" key={title}>
                  <span className="choiceIndex">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section editorialSection">
          <div className="container splitFeature">
            <article>
              <div className="eyebrow">{locale === "uk" ? "Сумісність" : "Interoperability"}</div>
              <h2>{t.alignmentTitle}</h2>
              <p>{t.alignmentText}</p>
            </article>
            <article>
              <div className="eyebrow">{locale === "uk" ? "Контекст" : "Context"}</div>
              <h2>{t.traditionTitle}</h2>
              <p>{t.traditionText}</p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
