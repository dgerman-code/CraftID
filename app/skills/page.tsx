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
  fr: {
    eyebrow: "Compétences et taxonomie",
    title: "Un langage structuré pour les compétences artisanales.",
    intro: "CraftID utilise une taxonomie évolutive pour décrire de manière cohérente les disciplines artisanales, les professions et les compétences pratiques, tout en préservant la place des traditions locales et des pratiques spécialisées.",
    taxonomyTitle: "Domaines artisanaux principaux",
    taxonomyText: "La taxonomie commence par de grands domaines artisanaux puis s’étend aux professions, compétences pratiques et termes spécialisés. Ces domaines sont des repères de navigation, et non le système de classification définitif.",
    categories: [
      ["Céramique", "Production céramique, façonnage, émaillage, cuisson et pratiques d’atelier associées."],
      ["Bois", "Travail du bois, menuiserie, fabrication de meubles, sculpture et production en atelier."],
      ["Textile", "Fabrication textile, tissage, broderie, couture et techniques artisanales associées."],
      ["Métal", "Travail du métal, fabrication, forge et techniques spécialisées de finition."],
      ["Verre", "Travail du verre, façonnage, finition et production en atelier."],
      ["Bijouterie", "Fabrication de bijoux, travail du métal à petite échelle et techniques spécialisées associées."],
      ["Restauration", "Réparation, conservation et restauration de matériaux pertinents."],
      ["Pierre", "Travail de la pierre, sculpture, finition et pratiques matérielles associées."],
      ["Cuir", "Travail du cuir, assemblage, finition et réparation."],
      ["Autres", "Une voie contrôlée pour les pratiques qui ne figurent pas encore dans la taxonomie centrale."],
    ],
    alignmentTitle: "Interopérabilité européenne dès la conception",
    alignmentText: "Les identifiants de taxonomie restent indépendants de la langue afin que les libellés puissent être traduits sans modifier les données sous-jacentes. De futurs alignements pourront faire référence à des cadres européens pertinents de compétences et de credentials lorsque cela est utile, sans rendre CraftID dépendant d’un seul système externe.",
    traditionTitle: "Les compétences ne sont pas les traditions",
    traditionText: "CraftID traite les compétences pratiques, professions, origines géographiques et traditions artisanales comme des concepts distincts. Cela réduit l’ambiguïté et permet de décrire à la fois la compétence professionnelle et le contexte culturel sans les confondre.",
  },
  de: {
    eyebrow: "Kompetenzen und Taxonomie",
    title: "Eine strukturierte Sprache für handwerkliche Kompetenzen.",
    intro: "CraftID verwendet eine wachsende Taxonomie, um Handwerksbereiche, Berufe und praktische Kompetenzen konsistent zu beschreiben und zugleich Raum für lokale Traditionen und spezialisierte Praxis zu lassen.",
    taxonomyTitle: "Zentrale Handwerksbereiche",
    taxonomyText: "Die Taxonomie beginnt mit breiten Handwerksbereichen und erweitert sich über Berufe, praktische Kompetenzen und Fachbegriffe. Diese Bereiche dienen als Navigationsanker und sind nicht das endgültige Klassifikationssystem.",
    categories: [
      ["Keramik", "Keramikherstellung, Formgebung, Glasieren, Brennen und zugehörige Werkstattpraxis."],
      ["Holz", "Holzhandwerk, Tischlerei, Möbelbau, Schnitzerei und Werkstattproduktion."],
      ["Textilien", "Textilherstellung, Weben, Sticken, Nähen und verwandte Handwerkstechniken."],
      ["Metall", "Metallhandwerk, Fertigung, Schmieden und spezialisierte Veredelungstechniken."],
      ["Glas", "Glashandwerk, Formgebung, Veredelung und Werkstattproduktion."],
      ["Schmuck", "Schmuckherstellung, kleinteilige Metallarbeit und verwandte Fachtechniken."],
      ["Restaurierung", "Reparatur, Konservierung und Restaurierungspraxis für relevante Materialien."],
      ["Stein", "Steinhandwerk, Bildhauerei, Veredelung und verwandte Materialpraxis."],
      ["Leder", "Lederhandwerk, Konstruktion, Veredelung und Reparatur."],
      ["Sonstige", "Ein kontrollierter Weg für Praktiken, die noch nicht in der Kerntaxonomie abgebildet sind."],
    ],
    alignmentTitle: "Europäische Interoperabilität by design",
    alignmentText: "Taxonomie-Kennungen bleiben sprachunabhängig, sodass Bezeichnungen übersetzt werden können, ohne die zugrunde liegenden Daten zu verändern. Künftige Ausrichtungen können bei Bedarf auf relevante europäische Kompetenz- und Credential-Rahmen Bezug nehmen, ohne CraftID von einem einzigen externen System abhängig zu machen.",
    traditionTitle: "Kompetenzen sind nicht dasselbe wie Traditionen",
    traditionText: "CraftID behandelt praktische Kompetenzen, Berufe, geografische Herkunft und Handwerkstraditionen als getrennte Konzepte. Dadurch werden Mehrdeutigkeiten reduziert und sowohl berufliche Kompetenz als auch kultureller Kontext beschrieben, ohne sie zu vermischen.",
  },
  nl: {
    eyebrow: "Vaardigheden en taxonomie",
    title: "Een gestructureerde taal voor ambachtelijke vaardigheden.",
    intro: "CraftID gebruikt een groeiende taxonomie om ambachtelijke disciplines, beroepen en praktische vaardigheden op consistente wijze te beschrijven, met ruimte voor lokale tradities en specialistische praktijk.",
    taxonomyTitle: "Kerngebieden van het ambacht",
    taxonomyText: "De taxonomie begint met brede ambachtsgebieden en groeit via beroepen, praktische vaardigheden en specialistische termen. Deze domeinen zijn navigatieankers, niet het uiteindelijke classificatiesysteem.",
    categories: [
      ["Keramiek", "Keramische productie, vormen, glazuren, bakken en gerelateerde atelierpraktijk."],
      ["Hout", "Houtbewerking, schrijnwerk, meubelmaken, snijwerk en werkplaatsproductie."],
      ["Textiel", "Textielproductie, weven, borduren, naaien en gerelateerde ambachtstechnieken."],
      ["Metaal", "Metaalambacht, fabricage, smeden en specialistische afwerkingstechnieken."],
      ["Glas", "Glasambacht, vormen, afwerken en atelierproductie."],
      ["Sieraden", "Sieraden maken, kleinschalig metaalwerk en gerelateerde specialistische technieken."],
      ["Restauratie", "Reparatie, conservering en restauratie van relevante materialen."],
      ["Steen", "Steenbewerking, beeldhouwen, afwerken en gerelateerde materiaalpraktijk."],
      ["Leer", "Leerbewerking, constructie, afwerking en reparatie."],
      ["Overig", "Een gecontroleerde route voor praktijken die nog niet in de kerntaxonomie zijn opgenomen."],
    ],
    alignmentTitle: "Europese interoperabiliteit by design",
    alignmentText: "Taxonomie-identifiers blijven taalonafhankelijk zodat labels kunnen worden vertaald zonder de onderliggende gegevens te wijzigen. Toekomstige afstemming kan waar nuttig verwijzen naar relevante Europese kaders voor vaardigheden en credentials, zonder CraftID afhankelijk te maken van één extern systeem.",
    traditionTitle: "Vaardigheden zijn niet hetzelfde als tradities",
    traditionText: "CraftID houdt praktische vaardigheden, beroepen, geografische oorsprong en ambachtelijke tradities als afzonderlijke concepten. Dit vermindert ambiguïteit en maakt het mogelijk zowel professionele competentie als culturele context te beschrijven zonder ze te vermengen.",
  },
  pl: {
    eyebrow: "Umiejętności i taksonomia",
    title: "Uporządkowany język umiejętności rzemieślniczych.",
    intro: "CraftID wykorzystuje rozwijaną taksonomię do spójnego opisywania dziedzin rzemiosła, zawodów i praktycznych umiejętności, zachowując miejsce dla lokalnych tradycji i specjalistycznych praktyk.",
    taxonomyTitle: "Główne dziedziny rzemiosła",
    taxonomyText: "Taksonomia zaczyna się od szerokich dziedzin rzemiosła i rozwija poprzez zawody, praktyczne umiejętności i terminy specjalistyczne. Dziedziny te są punktami nawigacyjnymi, a nie ostatecznym systemem klasyfikacji.",
    categories: [
      ["Ceramika", "Produkcja ceramiki, formowanie, szkliwienie, wypał i powiązana praktyka pracowniana."],
      ["Drewno", "Rzemiosło drzewne, stolarstwo, meblarstwo, rzeźbienie i produkcja warsztatowa."],
      ["Tekstylia", "Wytwarzanie tekstyliów, tkactwo, haft, szycie i powiązane techniki rzemieślnicze."],
      ["Metal", "Rzemiosło metalowe, wytwarzanie, kowalstwo i specjalistyczne techniki wykończeniowe."],
      ["Szkło", "Rzemiosło szklarskie, formowanie, wykańczanie i produkcja pracowniana."],
      ["Biżuteria", "Wytwarzanie biżuterii, drobne prace metalowe i powiązane techniki specjalistyczne."],
      ["Renowacja", "Naprawa, konserwacja i praktyka restauratorska dla odpowiednich materiałów."],
      ["Kamień", "Obróbka kamienia, rzeźbienie, wykończenie i powiązane praktyki materiałowe."],
      ["Skóra", "Rzemiosło skórzane, konstrukcja, wykańczanie i naprawa."],
      ["Inne", "Kontrolowana ścieżka dla praktyk, które nie są jeszcze reprezentowane w podstawowej taksonomii."],
    ],
    alignmentTitle: "Europejska interoperacyjność od podstaw",
    alignmentText: "Identyfikatory taksonomii pozostają niezależne od języka, dzięki czemu etykiety można tłumaczyć bez zmiany danych bazowych. Przyszłe dopasowanie może odwoływać się do odpowiednich europejskich ram umiejętności i poświadczeń, jeśli będzie to użyteczne, bez uzależniania CraftID od jednego systemu zewnętrznego.",
    traditionTitle: "Umiejętności to nie to samo co tradycje",
    traditionText: "CraftID traktuje praktyczne umiejętności, zawody, pochodzenie geograficzne i tradycje rzemieślnicze jako odrębne pojęcia. Zmniejsza to niejednoznaczność i pozwala opisywać zarówno kompetencje zawodowe, jak i kontekst kulturowy bez ich mieszania.",
  },
  it: {
    eyebrow: "Competenze e tassonomia",
    title: "Un linguaggio strutturato per le competenze artigianali.",
    intro: "CraftID utilizza una tassonomia in crescita per descrivere in modo coerente discipline artigianali, professioni e competenze pratiche, lasciando spazio alle tradizioni locali e alle pratiche specialistiche.",
    taxonomyTitle: "Principali ambiti artigianali",
    taxonomyText: "La tassonomia parte da ampi ambiti artigianali e si estende attraverso professioni, competenze pratiche e termini specialistici. Questi ambiti sono punti di navigazione, non il sistema di classificazione definitivo.",
    categories: [
      ["Ceramica", "Produzione ceramica, formatura, smaltatura, cottura e relative pratiche di laboratorio."],
      ["Legno", "Lavorazione del legno, falegnameria, produzione di mobili, intaglio e produzione in laboratorio."],
      ["Tessili", "Produzione tessile, tessitura, ricamo, cucito e tecniche artigianali correlate."],
      ["Metallo", "Lavorazione artigianale del metallo, fabbricazione, forgiatura e tecniche specialistiche di finitura."],
      ["Vetro", "Lavorazione del vetro, formatura, finitura e produzione in laboratorio."],
      ["Gioielleria", "Produzione di gioielli, piccola lavorazione dei metalli e tecniche specialistiche correlate."],
      ["Restauro", "Riparazione, conservazione e restauro dei materiali pertinenti."],
      ["Pietra", "Lavorazione della pietra, scultura, finitura e pratiche materiali correlate."],
      ["Pelle", "Lavorazione della pelle, costruzione, finitura e riparazione."],
      ["Altro", "Un percorso controllato per pratiche non ancora rappresentate nella tassonomia centrale."],
    ],
    alignmentTitle: "Interoperabilità europea by design",
    alignmentText: "Gli identificativi della tassonomia restano indipendenti dalla lingua, così le etichette possono essere tradotte senza modificare i dati sottostanti. Futuri allineamenti potranno fare riferimento, quando utile, a pertinenti quadri europei per competenze e credenziali, senza rendere CraftID dipendente da un singolo sistema esterno.",
    traditionTitle: "Le competenze non sono le tradizioni",
    traditionText: "CraftID mantiene distinti i concetti di competenze pratiche, professioni, origine geografica e tradizioni artigianali. Ciò riduce l’ambiguità e consente a un record di descrivere sia la competenza professionale sia il contesto culturale senza confonderli.",
  },
  es: {
    eyebrow: "Competencias y taxonomía",
    title: "Un lenguaje estructurado para las competencias artesanales.",
    intro: "CraftID utiliza una taxonomía en crecimiento para describir de forma coherente disciplinas artesanales, profesiones y competencias prácticas, preservando espacio para las tradiciones locales y la práctica especializada.",
    taxonomyTitle: "Principales ámbitos artesanales",
    taxonomyText: "La taxonomía parte de grandes ámbitos artesanales y se amplía mediante profesiones, competencias prácticas y términos especializados. Estos ámbitos son puntos de navegación, no el sistema de clasificación definitivo.",
    categories: [
      ["Cerámica", "Producción cerámica, conformado, esmaltado, cocción y prácticas de taller relacionadas."],
      ["Madera", "Trabajo de la madera, carpintería, fabricación de muebles, talla y producción de taller."],
      ["Textiles", "Producción textil, tejido, bordado, costura y técnicas artesanales relacionadas."],
      ["Metal", "Artesanía del metal, fabricación, forja y técnicas especializadas de acabado."],
      ["Vidrio", "Artesanía del vidrio, conformado, acabado y producción en taller."],
      ["Joyería", "Fabricación de joyería, trabajo del metal a pequeña escala y técnicas especializadas relacionadas."],
      ["Restauración", "Reparación, conservación y restauración de los materiales pertinentes."],
      ["Piedra", "Trabajo de la piedra, talla, acabado y prácticas materiales relacionadas."],
      ["Cuero", "Artesanía del cuero, construcción, acabado y reparación."],
      ["Otros", "Una vía controlada para prácticas que aún no están representadas en la taxonomía central."],
    ],
    alignmentTitle: "Interoperabilidad europea desde el diseño",
    alignmentText: "Los identificadores de taxonomía permanecen independientes del idioma para que las etiquetas puedan traducirse sin cambiar los datos subyacentes. Futuras alineaciones podrán referenciar marcos europeos relevantes de competencias y credenciales cuando resulte útil, sin hacer que CraftID dependa de un único sistema externo.",
    traditionTitle: "Las competencias no son lo mismo que las tradiciones",
    traditionText: "CraftID mantiene como conceptos distintos las competencias prácticas, profesiones, origen geográfico y tradiciones artesanales. Esto reduce la ambigüedad y permite describir tanto la competencia profesional como el contexto cultural sin confundirlos.",
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

const sectionLabels = {
  en: { structure: "Structure", interoperability: "Interoperability", context: "Context" },
  fr: { structure: "Structure", interoperability: "Interopérabilité", context: "Contexte" },
  de: { structure: "Struktur", interoperability: "Interoperabilität", context: "Kontext" },
  nl: { structure: "Structuur", interoperability: "Interoperabiliteit", context: "Context" },
  pl: { structure: "Struktura", interoperability: "Interoperacyjność", context: "Kontekst" },
  it: { structure: "Struttura", interoperability: "Interoperabilità", context: "Contesto" },
  es: { structure: "Estructura", interoperability: "Interoperabilidad", context: "Contexto" },
  uk: { structure: "Структура", interoperability: "Сумісність", context: "Контекст" },
} as const;

export default async function SkillsPage({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale];
  const section = sectionLabels[locale];

  return (
    <>
      <SiteHeader locale={locale} pathname="/skills" />
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
              <div className="eyebrow">{section.structure}</div>
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
              <div className="eyebrow">{section.interoperability}</div>
              <h2>{t.alignmentTitle}</h2>
              <p>{t.alignmentText}</p>
            </article>
            <article>
              <div className="eyebrow">{section.context}</div>
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
