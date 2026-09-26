import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";

type Props = { searchParams: Promise<{ lang?: string }> };

const copy = {
  en: {
    eyebrow: "About CraftID",
    boundariesLabel: "Boundaries",
    ecosystemLabel: "Ecosystem",
    europeLabel: "Europe",
    governanceLabel: "Governance",
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
  fr: {
    eyebrow: "À propos de CraftID",
    boundariesLabel: "Limites",
    ecosystemLabel: "Écosystème",
    europeLabel: "Europe",
    governanceLabel: "Gouvernance",
    title: "Une infrastructure pour la visibilité professionnelle et la confiance.",
    intro: "CraftID est un instrument numérique d’EUFUA conçu pour rendre les compétences artisanales plus visibles, portables, fondées sur des preuves et compréhensibles dans des contextes professionnels, régionaux et institutionnels.",
    purposeTitle: "Objectif",
    purposeText: "Chez de nombreux professionnels de l’artisanat et petits ateliers, les preuves professionnelles sont fragmentées : l’expérience se trouve à un endroit, les qualifications à un autre, le portfolio ailleurs, tandis que les compétences pratiques sont souvent difficiles à comparer ou à découvrir. CraftID rassemble ces éléments dans un dossier professionnel structuré.",
    notTitle: "Ce que CraftID n’est pas",
    notItems: ["Ni marketplace ni plateforme de vente.","Ni réseau social.","Ni registre professionnel légal ou réglementaire.","Ni autorité de certification ou de qualification de l’UE.","Ni substitut aux licences, qualifications réglementées ou procédures formelles de reconnaissance."],
    usersTitle: "À qui s’adresse-t-il",
    usersText: "L’infrastructure est conçue pour les artisans individuels, les ateliers et les microentreprises artisanales, avec de futures interfaces institutionnelles pour les chambres, organismes de formation, organisations professionnelles, municipalités et autres acteurs de l’écosystème.",
    ecosystemTitle: "Valeur institutionnelle",
    ecosystemText: "Des données agrégées et respectueuses de la vie privée peuvent soutenir l’intelligence des compétences, le développement régional, la formation professionnelle, la continuité du patrimoine artisanal, le soutien aux PME et la coopération transfrontalière. Ces usages doivent se développer avec une gouvernance claire, un traitement licite des données et une méthodologie transparente.",
    euTitle: "Orientation européenne",
    euText: "CraftID est conçu pour être interopérable avec des approches européennes plus larges concernant les compétences, les justificatifs, l’identité numérique, la provenance et le développement régional. Cet alignement n’implique ni approbation, ni accréditation, ni statut officiel de l’UE.",
    governanceTitle: "Principe de gouvernance",
    governanceText: "La confiance doit être fondée sur des preuves, proportionnée et transparente. La plateforme doit collecter uniquement ce qui est nécessaire, séparer informations publiques et privées, garantir la traçabilité des décisions d’examen et éviter toute affirmation dépassant les preuves disponibles.",
    initiativeTitle: "Un instrument numérique d’EUFUA",
    initiativeText: "EUFUA développe CraftID comme infrastructure professionnelle et d’écosystème : pour structurer l’information, améliorer la visibilité et relier les preuves professionnelles à de futures opportunités et coopérations institutionnelles.",
  },
  de: {
    eyebrow: "Über CraftID",
    boundariesLabel: "Grenzen",
    ecosystemLabel: "Ökosystem",
    europeLabel: "Europa",
    governanceLabel: "Governance",
    title: "Infrastruktur für berufliche Sichtbarkeit und Vertrauen.",
    intro: "CraftID ist ein digitales Instrument von EUFUA, das handwerkliche Kompetenzen sichtbarer, portabler, nachweisbasiert und in beruflichen, regionalen und institutionellen Kontexten verständlicher machen soll.",
    purposeTitle: "Zweck",
    purposeText: "Bei vielen Handwerksprofis und kleinen Werkstätten sind berufliche Nachweise fragmentiert: Erfahrung liegt an einer Stelle, Qualifikationen an einer anderen und Portfoliomaterial wiederum woanders; praktische Kompetenzen sind oft schwer vergleichbar oder auffindbar. CraftID führt diese Elemente in einem strukturierten beruflichen Datensatz zusammen.",
    notTitle: "Was CraftID nicht ist",
    notItems: ["Kein Marktplatz und keine Verkaufsplattform.","Kein soziales Netzwerk.","Kein gesetzliches Berufsregister.","Keine EU-Zertifizierungs- oder Qualifikationsbehörde.","Kein Ersatz für Lizenzen, reglementierte Qualifikationen oder formale Anerkennungsverfahren."],
    usersTitle: "Wer es nutzen kann",
    usersText: "Die Infrastruktur ist für einzelne Handwerkerinnen und Handwerker, Werkstätten und handwerksbasierte Kleinstunternehmen konzipiert, mit zukünftigen institutionellen Schnittstellen für Kammern, Bildungsanbieter, Berufsverbände, Kommunen und weitere Akteure des Ökosystems.",
    ecosystemTitle: "Institutioneller Wert",
    ecosystemText: "Aggregierte, datenschutzgerechte Daten können Kompetenzanalysen, Regionalentwicklung, Berufsbildung, die Kontinuität handwerklichen Erbes, KMU-Unterstützung und grenzüberschreitende Zusammenarbeit fördern. Solche Nutzungen sollten nur mit klarer Governance, rechtmäßiger Datennutzung und transparenter Methodik entwickelt werden.",
    euTitle: "Europäische Ausrichtung",
    euText: "CraftID ist auf Interoperabilität mit breiteren europäischen Ansätzen zu Kompetenzen, Nachweisen, digitaler Identität, Provenienz und Regionalentwicklung ausgelegt. Ausrichtung bedeutet keine Billigung, Akkreditierung oder offiziellen EU-Status.",
    governanceTitle: "Governance-Prinzip",
    governanceText: "Vertrauen muss nachweisbasiert, verhältnismäßig und transparent sein. Die Plattform soll nur notwendige Daten erheben, öffentliche und private Informationen trennen, Prüfentscheidungen nachvollziehbar halten und Aussagen vermeiden, die über die verfügbaren Nachweise hinausgehen.",
    initiativeTitle: "Ein digitales Instrument von EUFUA",
    initiativeText: "EUFUA entwickelt CraftID als berufliche und ökosystembezogene Infrastruktur: zur Strukturierung von Informationen, Verbesserung der Sichtbarkeit und Verbindung beruflicher Nachweise mit zukünftigen Möglichkeiten und institutioneller Zusammenarbeit.",
  },
  nl: {
    eyebrow: "Over CraftID",
    boundariesLabel: "Grenzen",
    ecosystemLabel: "Ecosysteem",
    europeLabel: "Europa",
    governanceLabel: "Governance",
    title: "Infrastructuur voor professionele zichtbaarheid en vertrouwen.",
    intro: "CraftID is een digitaal instrument van EUFUA dat ambachtelijke competenties zichtbaarder, overdraagbaar, onderbouwd met bewijs en begrijpelijk wil maken in professionele, regionale en institutionele contexten.",
    purposeTitle: "Doel",
    purposeText: "Bij veel ambachtsprofessionals en kleine werkplaatsen is professioneel bewijs versnipperd: ervaring staat op één plek, kwalificaties op een andere en portfoliomateriaal elders, terwijl praktische vaardigheden vaak moeilijk te vergelijken of te vinden zijn. CraftID brengt deze elementen samen in één gestructureerd professioneel dossier.",
    notTitle: "Wat CraftID niet is",
    notItems: ["Geen marktplaats of verkoopplatform.","Geen sociaal netwerk.","Geen wettelijk beroepsregister.","Geen EU-certificerings- of kwalificatieautoriteit.","Geen vervanging voor vergunningen, gereglementeerde kwalificaties of formele erkenningsprocedures."],
    usersTitle: "Voor wie het bedoeld is",
    usersText: "De infrastructuur is ontworpen voor individuele ambachtsprofessionals, werkplaatsen en ambachtelijke micro-ondernemingen, met toekomstige institutionele interfaces voor kamers, opleidingsaanbieders, beroepsorganisaties, gemeenten en andere ecosysteemactoren.",
    ecosystemTitle: "Institutionele waarde",
    ecosystemText: "Geaggregeerde, privacybewuste gegevens kunnen skills intelligence, regionale ontwikkeling, beroepsonderwijs, continuïteit van ambachtelijk erfgoed, mkb-ondersteuning en grensoverschrijdende samenwerking ondersteunen. Zulke toepassingen moeten alleen worden ontwikkeld met duidelijke governance, rechtmatig datagebruik en transparante methodologie.",
    euTitle: "Europese oriëntatie",
    euText: "CraftID is ontworpen voor interoperabiliteit met bredere Europese benaderingen van vaardigheden, credentials, digitale identiteit, provenance en regionale ontwikkeling. Afstemming betekent geen goedkeuring, accreditatie of officiële EU-status.",
    governanceTitle: "Governanceprincipe",
    governanceText: "Vertrouwen moet bewijsgericht, proportioneel en transparant zijn. Het platform moet alleen noodzakelijke gegevens verzamelen, publieke en private informatie scheiden, beoordelingsbesluiten controleerbaar houden en claims vermijden die verder gaan dan het beschikbare bewijs.",
    initiativeTitle: "Een digitaal instrument van EUFUA",
    initiativeText: "EUFUA ontwikkelt CraftID als professionele en ecosysteeminfrastructuur: om informatie te structureren, zichtbaarheid te verbeteren en professioneel bewijs te verbinden met toekomstige kansen en institutionele samenwerking.",
  },
  pl: {
    eyebrow: "O CraftID",
    boundariesLabel: "Granice",
    ecosystemLabel: "Ekosystem",
    europeLabel: "Europa",
    governanceLabel: "Zarządzanie",
    title: "Infrastruktura widoczności zawodowej i zaufania.",
    intro: "CraftID to cyfrowe narzędzie EUFUA stworzone po to, aby kompetencje rzemieślnicze były bardziej widoczne, przenośne, oparte na dowodach i zrozumiałe w kontekście zawodowym, regionalnym i instytucjonalnym.",
    purposeTitle: "Cel",
    purposeText: "U wielu rzemieślników i małych pracowni dowody zawodowe są rozproszone: doświadczenie znajduje się w jednym miejscu, kwalifikacje w innym, materiały portfolio gdzie indziej, a praktyczne umiejętności często trudno porównać lub odnaleźć. CraftID łączy te elementy w uporządkowany zapis zawodowy.",
    notTitle: "Czym CraftID nie jest",
    notItems: ["Nie jest marketplace’em ani platformą sprzedażową.","Nie jest siecią społecznościową.","Nie jest ustawowym rejestrem zawodowym.","Nie jest organem UE nadającym certyfikaty ani kwalifikacje.","Nie zastępuje licencji, kwalifikacji regulowanych ani formalnych procedur uznawania."],
    usersTitle: "Kto może korzystać",
    usersText: "Infrastruktura jest przeznaczona dla indywidualnych rzemieślników, pracowni i mikroprzedsiębiorstw rzemieślniczych, z przyszłymi interfejsami instytucjonalnymi dla izb, podmiotów edukacyjnych, organizacji zawodowych, samorządów i innych uczestników ekosystemu.",
    ecosystemTitle: "Wartość instytucjonalna",
    ecosystemText: "Zagregowane dane z poszanowaniem prywatności mogą wspierać analizę umiejętności, rozwój regionalny, kształcenie zawodowe, ciągłość dziedzictwa rzemieślniczego, wsparcie MŚP i współpracę transgraniczną. Takie zastosowania powinny rozwijać się wyłącznie przy jasnym zarządzaniu, legalnym wykorzystaniu danych i przejrzystej metodologii.",
    euTitle: "Orientacja europejska",
    euText: "CraftID jest projektowany z myślą o interoperacyjności z szerszymi europejskimi podejściami do umiejętności, poświadczeń, tożsamości cyfrowej, pochodzenia i rozwoju regionalnego. Zgodność nie oznacza poparcia, akredytacji ani oficjalnego statusu UE.",
    governanceTitle: "Zasada zarządzania",
    governanceText: "Zaufanie powinno opierać się na dowodach, być proporcjonalne i przejrzyste. Platforma powinna zbierać tylko niezbędne dane, oddzielać informacje publiczne od prywatnych, zapewniać audytowalność decyzji i unikać twierdzeń wykraczających poza dostępne dowody.",
    initiativeTitle: "Cyfrowe narzędzie EUFUA",
    initiativeText: "EUFUA rozwija CraftID jako infrastrukturę zawodową i ekosystemową: pomagając porządkować informacje, zwiększać widoczność oraz łączyć dowody zawodowe z przyszłymi możliwościami i współpracą instytucjonalną.",
  },
  it: {
    eyebrow: "Informazioni su CraftID",
    boundariesLabel: "Limiti",
    ecosystemLabel: "Ecosistema",
    europeLabel: "Europa",
    governanceLabel: "Governance",
    title: "Infrastruttura per visibilità professionale e fiducia.",
    intro: "CraftID è uno strumento digitale di EUFUA progettato per rendere le competenze artigianali più visibili, portabili, basate su evidenze e comprensibili in contesti professionali, regionali e istituzionali.",
    purposeTitle: "Finalità",
    purposeText: "Per molti professionisti dell’artigianato e piccoli laboratori le evidenze professionali sono frammentate: l’esperienza è in un luogo, le qualifiche in un altro, il portfolio altrove, mentre le competenze pratiche sono spesso difficili da confrontare o trovare. CraftID riunisce questi elementi in un record professionale strutturato.",
    notTitle: "Cosa CraftID non è",
    notItems: ["Non è un marketplace o una piattaforma di vendita.","Non è un social network.","Non è un registro professionale previsto dalla legge.","Non è un’autorità UE di certificazione o qualificazione.","Non sostituisce licenze, qualifiche regolamentate o procedure formali di riconoscimento."],
    usersTitle: "Chi può utilizzarlo",
    usersText: "L’infrastruttura è pensata per singoli artigiani, laboratori e microimprese artigianali, con future interfacce istituzionali per camere, enti di formazione, organizzazioni professionali, comuni e altri attori dell’ecosistema.",
    ecosystemTitle: "Valore istituzionale",
    ecosystemText: "Dati aggregati e rispettosi della privacy possono sostenere l’analisi delle competenze, lo sviluppo regionale, la formazione professionale, la continuità del patrimonio artigianale, il supporto alle PMI e la cooperazione transfrontaliera. Tali utilizzi devono svilupparsi solo con governance chiara, uso lecito dei dati e metodologia trasparente.",
    euTitle: "Orientamento europeo",
    euText: "CraftID è progettato per l’interoperabilità con più ampi approcci europei a competenze, credenziali, identità digitale, provenienza e sviluppo regionale. L’allineamento non implica approvazione, accreditamento o status ufficiale dell’UE.",
    governanceTitle: "Principio di governance",
    governanceText: "La fiducia deve essere basata su evidenze, proporzionata e trasparente. La piattaforma dovrebbe raccogliere solo ciò che è necessario, separare informazioni pubbliche e private, mantenere tracciabili le decisioni di revisione ed evitare affermazioni superiori alle evidenze disponibili.",
    initiativeTitle: "Uno strumento digitale di EUFUA",
    initiativeText: "EUFUA sviluppa CraftID come infrastruttura professionale e di ecosistema: per strutturare le informazioni, migliorare la visibilità e collegare le evidenze professionali a future opportunità e cooperazioni istituzionali.",
  },
  es: {
    eyebrow: "Acerca de CraftID",
    boundariesLabel: "Límites",
    ecosystemLabel: "Ecosistema",
    europeLabel: "Europa",
    governanceLabel: "Gobernanza",
    title: "Infraestructura para la visibilidad profesional y la confianza.",
    intro: "CraftID es un instrumento digital de EUFUA diseñado para hacer que las competencias artesanales sean más visibles, portátiles, basadas en evidencias y comprensibles en contextos profesionales, regionales e institucionales.",
    purposeTitle: "Finalidad",
    purposeText: "Para muchos profesionales de la artesanía y pequeños talleres, las evidencias profesionales están fragmentadas: la experiencia está en un lugar, las cualificaciones en otro y el portfolio en otro, mientras que las competencias prácticas suelen ser difíciles de comparar o descubrir. CraftID reúne estos elementos en un registro profesional estructurado.",
    notTitle: "Lo que CraftID no es",
    notItems: ["No es un marketplace ni una plataforma de ventas.","No es una red social.","No es un registro profesional legal.","No es una autoridad de certificación o cualificación de la UE.","No sustituye licencias, cualificaciones reguladas ni procedimientos formales de reconocimiento."],
    usersTitle: "Quién puede utilizarlo",
    usersText: "La infraestructura está diseñada para artesanos individuales, talleres y microempresas artesanales, con futuras interfaces institucionales para cámaras, proveedores de formación, organizaciones profesionales, municipios y otros actores del ecosistema.",
    ecosystemTitle: "Valor institucional",
    ecosystemText: "Los datos agregados y respetuosos con la privacidad pueden apoyar la inteligencia de competencias, el desarrollo regional, la formación profesional, la continuidad del patrimonio artesanal, el apoyo a las pymes y la cooperación transfronteriza. Estos usos deben desarrollarse únicamente con una gobernanza clara, uso lícito de los datos y metodología transparente.",
    euTitle: "Orientación europea",
    euText: "CraftID está diseñado para interoperar con enfoques europeos más amplios sobre competencias, credenciales, identidad digital, procedencia y desarrollo regional. La alineación no implica respaldo, acreditación ni estatus oficial de la UE.",
    governanceTitle: "Principio de gobernanza",
    governanceText: "La confianza debe estar basada en evidencias, ser proporcional y transparente. La plataforma debe recopilar solo lo necesario, separar información pública y privada, mantener auditables las decisiones de revisión y evitar afirmaciones que excedan las evidencias disponibles.",
    initiativeTitle: "Un instrumento digital de EUFUA",
    initiativeText: "EUFUA desarrolla CraftID como infraestructura profesional y de ecosistema: ayudando a estructurar información, mejorar la visibilidad y conectar evidencias profesionales con futuras oportunidades y cooperación institucional.",
  },
  uk: {
    eyebrow: "Про CraftID",
    boundariesLabel: "Межі",
    ecosystemLabel: "Екосистема",
    europeLabel: "Європа",
    governanceLabel: "Управління",
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
              <div className="eyebrow">{t.boundariesLabel}</div>
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
              <div className="eyebrow">{t.ecosystemLabel}</div>
              <h3>{t.ecosystemTitle}</h3>
              <p>{t.ecosystemText}</p>
            </article>
            <article className="informationCard">
              <div className="eyebrow">{t.europeLabel}</div>
              <h3>{t.euTitle}</h3>
              <p>{t.euText}</p>
            </article>
            <article className="informationCard">
              <div className="eyebrow">{t.governanceLabel}</div>
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
