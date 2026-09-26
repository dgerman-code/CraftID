// CraftID production entrypoint
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
      ["CraftID Record Certificate", "Issue and download a versioned certificate of the CraftID record with its own Certificate No. and QR verification. It records the published CraftID snapshot; it does not certify identity or professional competence."],
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
    trustEyebrow: "Trust model",
  },
  fr: {
    pilotLabel: "Plateforme pilote",
    pilotText: "CraftID est actuellement en phase active de développement et de test. Les fonctionnalités, les structures de données et les flux de travail peuvent évoluer avant le lancement public.",
    eyebrow: "Infrastructure d’identité professionnelle",
    title: "Une identité professionnelle fondée sur des preuves.",
    intro: "CraftID est une infrastructure à vocation européenne pour l’identité professionnelle, les compétences et les preuves, destinée aux artisans, ateliers et micro-entreprises artisanales.",
    create: "Créer un CraftID",
    explore: "Explorer le registre",
    logicLabel: "Logique centrale",
    logic: ["Identité", "Compétences", "Pratique", "Preuves", "Confiance"],
    whyTitle: "Un dossier professionnel durable.",
    whyText: "CraftID offre aux professionnels et aux ateliers une référence professionnelle persistante pouvant relier compétences, expérience, qualifications, affiliations et pièces justificatives dans un dossier structuré.",
    cards: [
      ["Identité", "Une référence CraftID persistante pour un professionnel ou un atelier. L’identifiant n’encode ni pays, ni profession, ni année, ni statut juridique."],
      ["Compétences et pratique", "Décrivez les compétences utilisées dans la pratique professionnelle et reliez-les à l’expérience, aux qualifications, au portfolio et aux affiliations."],
      ["Preuves", "Reliez des déclarations professionnelles précises à des éléments justificatifs. Les preuves sont privées par défaut et ne sont pas automatiquement rendues publiques."],
      ["Confiance", "Les dossiers publics distinguent clairement les informations autodéclarées, les preuves soumises et les déclarations ayant fait l’objet d’un examen."],
    ],
    valueEyebrow: "Pour les professionnels de l’artisanat",
    valueTitle: "Une identité. Une valeur pratique dans le temps.",
    valueIntro: "CraftID est conçu pour être plus qu’un profil. Il fournit une référence professionnelle permanente utilisable sur des produits, dans la communication professionnelle, les candidatures et lors de changements de lieu d’activité.",
    valueItems: [
      ["CraftID permanent", "Un identifiant professionnel unique utilisable sur les produits, emballages, cartes de visite, sites web, CV, catalogues et candidatures. Le CraftID reste lié au même professionnel ou atelier dans le temps."],
      ["Profil professionnel public", "Un acheteur, organisateur de salon, partenaire ou institution peut suivre le CraftID ou le QR code pour voir qui est le créateur et quelle pratique professionnelle il présente publiquement."],
      ["Historique des compétences étayé par des preuves", "Les compétences, l’expérience, la formation, les qualifications et d’autres déclarations peuvent progressivement être reliées à des preuves et attestations, tout en gardant les pièces justificatives privées sauf divulgation explicitement prévue."],
      ["Certificat du dossier CraftID", "Émettez et téléchargez un certificat versionné du dossier CraftID avec son propre numéro de certificat et une vérification par QR code. Il enregistre un instantané publié du CraftID ; il ne certifie ni l’identité ni la compétence professionnelle."],
      ["Traçabilité des produits", "Lorsqu’un CraftID figure sur un produit ou un document, l’identifiant peut rester résolvable dans le temps afin que le créateur ou l’atelier enregistré puisse encore être identifié même après la fermeture du compte actif."],
      ["Contrôle de la confidentialité", "Le titulaire du CraftID choisit ce qui est public : pays, région ou ville, informations du profil, contacts et photo. Les ateliers peuvent aussi décider explicitement de publier ou non leur adresse professionnelle exacte."],
      ["Lien Professional ↔ Workshop", "Un CraftID Professional peut être relié à un CraftID Workshop sans fusionner les deux identités, de sorte qu’une personne conserve son propre dossier professionnel lorsque son atelier, son employeur ou son lieu de pratique change."],
      ["Confiance transparente", "CraftID ne prétend pas qu’un artisan est « bon » ou globalement certifié. Il présente des informations professionnelles structurées et distingue les données autodéclarées, les preuves et les déclarations examinées."],
      ["Accès via le réseau de partenaires", "À mesure que le réseau se développe, CraftID peut être utilisé par des partenaires nationaux et sectoriels, des organisations artisanales, salons, organismes de formation et programmes de soutien comme référence professionnelle structurée."],
    ],
    audience: "À qui s’adresse CraftID",
    profTitle: "Pour les professionnels et les ateliers",
    profText: "Construisez un dossier professionnel portable, indépendant d’une marketplace, d’un employeur ou d’un projet unique. Présentez compétences, pratique et preuves sans transformer le profil en annonce commerciale.",
    instTitle: "Pour les institutions et les écosystèmes",
    instText: "Comprenez où les compétences artisanales sont exercées, identifiez les capacités régionales et soutenez l’intelligence des compétences, les parcours de formation professionnelle, la continuité du patrimoine et la coopération transfrontalière.",
    trustTitle: "La confiance doit être explicite, pas implicite.",
    trustText: "CraftID ne certifie pas une personne dans son ensemble. L’examen porte sur des déclarations précises et les preuves qui leur sont liées. Le langage des statuts publics indique clairement ce qui a — et n’a pas — été examiné.",
    methodology: "Lire la méthodologie",
    trustEyebrow: "Modèle de confiance",
  },
  de: {
    pilotLabel: "Pilotplattform",
    pilotText: "CraftID befindet sich derzeit in aktiver Entwicklung und Erprobung. Funktionen, Datenstrukturen und Abläufe können sich vor dem öffentlichen Start noch ändern.",
    eyebrow: "Infrastruktur für berufliche Identität",
    title: "Berufliche Identität, auf Nachweisen aufgebaut.",
    intro: "CraftID ist eine europäisch ausgerichtete Infrastruktur für berufliche Identität, Kompetenzen und Nachweise für Handwerkerinnen und Handwerker, Werkstätten und handwerksbasierte Kleinstunternehmen.",
    create: "CraftID erstellen",
    explore: "Register erkunden",
    logicLabel: "Kernlogik",
    logic: ["Identität", "Kompetenzen", "Praxis", "Nachweise", "Vertrauen"],
    whyTitle: "Ein dauerhaftes berufliches Profil.",
    whyText: "CraftID gibt Personen und Werkstätten eine dauerhafte berufliche Referenz, die Kompetenzen, Erfahrung, Qualifikationen, Zugehörigkeiten und unterstützende Nachweise in einem strukturierten Datensatz verbinden kann.",
    cards: [
      ["Identität", "Eine dauerhafte CraftID-Referenz für eine Person oder Werkstatt. Die Kennung codiert weder Land noch Beruf, Jahr oder Rechtsstatus."],
      ["Kompetenzen und Praxis", "Beschreiben Sie die in der beruflichen Praxis eingesetzten Kompetenzen und verknüpfen Sie sie mit Erfahrung, Qualifikationen, Portfolio und Zugehörigkeiten."],
      ["Nachweise", "Verknüpfen Sie einzelne berufliche Angaben mit unterstützendem Material. Nachweise sind standardmäßig privat und werden nicht automatisch veröffentlicht."],
      ["Vertrauen", "Öffentliche Datensätze unterscheiden klar zwischen selbst angegebenen Informationen, eingereichten Nachweisen und geprüften Angaben."],
    ],
    valueEyebrow: "Für Handwerksprofis",
    valueTitle: "Eine Identität. Praktischer Wert über die Zeit.",
    valueIntro: "CraftID ist mehr als ein Profil. Es bietet eine dauerhafte berufliche Referenz, die auf Produkten, in der beruflichen Kommunikation, bei Bewerbungen und bei wechselnden Arbeitsorten genutzt werden kann.",
    valueItems: [
      ["Dauerhafte CraftID", "Eine berufliche Kennung für Produkte, Verpackungen, Visitenkarten, Websites, Lebensläufe, Kataloge und Bewerbungen. Die CraftID bleibt langfristig derselben Person oder Werkstatt zugeordnet."],
      ["Öffentliches Berufsprofil", "Käufer, Messeveranstalter, Partner oder Institutionen können über CraftID oder QR-Code sehen, wer die Person ist und welche berufliche Praxis öffentlich dargestellt wird."],
      ["Nachweisgestützte Kompetenzhistorie", "Kompetenzen, Erfahrung, Ausbildung, Qualifikationen und weitere Angaben können schrittweise mit Nachweisen und Bestätigungen verknüpft werden; Nachweise bleiben privat, sofern ihre Offenlegung nicht ausdrücklich vorgesehen ist."],
      ["CraftID Record Certificate", "Erstellen und laden Sie ein versioniertes Zertifikat des CraftID-Eintrags mit eigener Zertifikatsnummer und QR-Prüfung herunter. Es dokumentiert den veröffentlichten Stand des CraftID-Eintrags; es zertifiziert weder Identität noch berufliche Kompetenz."],
      ["Produktrückverfolgbarkeit", "Wird eine CraftID auf einem Produkt oder Dokument angebracht, kann die Kennung langfristig auflösbar bleiben, sodass die registrierte Person oder Werkstatt auch nach Schließung des aktiven Kontos identifiziert werden kann."],
      ["Datenschutzkontrolle", "Der CraftID-Inhaber entscheidet, was öffentlich ist: Land, Region oder Stadt, Profildaten, Kontakte und Foto. Werkstätten können außerdem ausdrücklich festlegen, ob eine genaue Geschäftsadresse veröffentlicht wird."],
      ["Professional ↔ Workshop-Verknüpfung", "Eine Professional CraftID kann mit einer Workshop CraftID verknüpft werden, ohne die beiden Identitäten zusammenzuführen. So behält eine Person ihren eigenen beruflichen Datensatz, wenn sich Werkstatt, Arbeitgeber oder Praxisort ändern."],
      ["Transparentes Vertrauen", "CraftID behauptet nicht, dass jemand „gut“ oder umfassend zertifiziert ist. Die Plattform zeigt strukturierte berufliche Informationen und unterscheidet selbst angegebene Informationen, Nachweise und geprüfte Angaben."],
      ["Zugang über das Partnernetzwerk", "Mit dem Ausbau des Netzwerks kann CraftID von nationalen und sektoralen Partnern, Handwerksorganisationen, Messen, Bildungsanbietern und Förderprogrammen als strukturierte berufliche Referenz genutzt werden."],
    ],
    audience: "Für wen CraftID gedacht ist",
    profTitle: "Für Handwerkerinnen, Handwerker und Werkstätten",
    profText: "Erstellen Sie einen portablen beruflichen Datensatz, unabhängig von Marktplatz, Arbeitgeber oder Einzelprojekt. Stellen Sie Kompetenzen, Praxis und Nachweise dar, ohne das Profil in ein Verkaufsangebot zu verwandeln.",
    instTitle: "Für Institutionen und Ökosysteme",
    instText: "Erkennen Sie, wo handwerkliche Kompetenzen ausgeübt werden, identifizieren Sie regionale Fähigkeiten und unterstützen Sie Kompetenzanalysen, Berufsbildungswege, den Erhalt handwerklichen Erbes und grenzüberschreitende Zusammenarbeit.",
    trustTitle: "Vertrauen sollte ausdrücklich sein, nicht nur vermutet.",
    trustText: "CraftID zertifiziert nicht eine Person als Ganzes. Die Prüfung bezieht sich auf konkrete Angaben und die dazugehörigen Nachweise. Öffentliche Statusangaben zeigen genau, was geprüft wurde — und was nicht.",
    methodology: "Methodik lesen",
    trustEyebrow: "Vertrauensmodell",
  },
  nl: {
    pilotLabel: "Pilotplatform",
    pilotText: "CraftID bevindt zich momenteel in actieve ontwikkeling en testfase. Functies, datastructuren en werkprocessen kunnen vóór de publieke lancering nog wijzigen.",
    eyebrow: "Infrastructuur voor professionele identiteit",
    title: "Professionele identiteit, opgebouwd uit bewijs.",
    intro: "CraftID is een Europees georiënteerde infrastructuur voor professionele identiteit, vaardigheden en bewijs voor ambachtsprofessionals, werkplaatsen en ambachtelijke micro-ondernemingen.",
    create: "CraftID aanmaken",
    explore: "Register bekijken",
    logicLabel: "Kernlogica",
    logic: ["Identiteit", "Vaardigheden", "Praktijk", "Bewijs", "Vertrouwen"],
    whyTitle: "Een duurzaam professioneel dossier.",
    whyText: "CraftID biedt professionals en werkplaatsen een blijvende professionele referentie waarin vaardigheden, ervaring, kwalificaties, affiliaties en ondersteunend bewijs in één gestructureerd dossier kunnen worden verbonden.",
    cards: [
      ["Identiteit", "Een blijvende CraftID-referentie voor een professional of werkplaats. De identifier codeert geen land, beroep, jaar of juridische status."],
      ["Vaardigheden en praktijk", "Beschrijf vaardigheden die in de professionele praktijk worden gebruikt en koppel ze aan ervaring, kwalificaties, portfolio en affiliaties."],
      ["Bewijs", "Koppel afzonderlijke professionele claims aan ondersteunend materiaal. Bewijs is standaard privé en wordt niet automatisch openbaar gemaakt."],
      ["Vertrouwen", "Openbare dossiers maken duidelijk onderscheid tussen zelf opgegeven informatie, ingediend bewijs en claims die zijn beoordeeld."],
    ],
    valueEyebrow: "Voor ambachtsprofessionals",
    valueTitle: "Eén identiteit. Praktische waarde door de tijd heen.",
    valueIntro: "CraftID is ontworpen als meer dan een profiel. Het geeft een ambachtsprofessional een permanente referentie die kan worden gebruikt op producten, in professionele communicatie, aanvragen en bij veranderende werkplekken.",
    valueItems: [
      ["Permanente CraftID", "Eén professionele identifier voor producten, verpakkingen, visitekaartjes, websites, cv’s, catalogi en aanvragen. De CraftID blijft door de tijd heen gekoppeld aan dezelfde professional of werkplaats."],
      ["Openbaar professioneel profiel", "Een koper, beursorganisator, partner of instelling kan via de CraftID of QR-code zien wie de maker is en welke professionele praktijk openbaar wordt gepresenteerd."],
      ["Met bewijs onderbouwde vaardighedengeschiedenis", "Vaardigheden, ervaring, opleiding, kwalificaties en andere claims kunnen geleidelijk aan bewijs en attestaties worden gekoppeld, terwijl bewijs privé blijft tenzij openbaarmaking uitdrukkelijk is bedoeld."],
      ["CraftID Record Certificate", "Geef een certificaat met versienummer van het CraftID-dossier uit en download het met een eigen certificaatnummer en QR-verificatie. Het legt de gepubliceerde momentopname van het CraftID-dossier vast; het certificeert geen identiteit of professionele bekwaamheid."],
      ["Producttraceerbaarheid", "Wanneer een CraftID op een product of document staat, kan de identifier blijvend opvraagbaar zijn zodat de geregistreerde maker of werkplaats ook na sluiting van het actieve account nog kan worden geïdentificeerd."],
      ["Privacycontrole", "De CraftID-eigenaar bepaalt wat openbaar is: land, regio of stad, profielgegevens, contactgegevens en foto. Werkplaatsen kunnen ook expliciet kiezen of een exact bedrijfsadres openbaar wordt gemaakt."],
      ["Professional ↔ Workshop-koppeling", "Een Professional CraftID kan aan een Workshop CraftID worden gekoppeld zonder de twee identiteiten samen te voegen, zodat iemand het eigen professionele dossier behoudt wanneer werkplaats, werkgever of praktijklocatie verandert."],
      ["Transparant vertrouwen", "CraftID beweert niet dat een maker ‘goed’ of algemeen gecertificeerd is. Het toont gestructureerde professionele informatie en onderscheidt zelfverklaarde informatie, bewijs en beoordeelde claims."],
      ["Toegang via het partnernetwerk", "Naarmate het netwerk groeit, kan CraftID door nationale en sectorale partners, ambachtsorganisaties, beurzen, opleidingsaanbieders en steunprogramma’s worden gebruikt als gestructureerde professionele referentie."],
    ],
    audience: "Voor wie CraftID bedoeld is",
    profTitle: "Voor professionals en werkplaatsen",
    profText: "Bouw een overdraagbaar professioneel dossier dat onafhankelijk is van een marktplaats, werkgever of afzonderlijk project. Presenteer vaardigheden, praktijk en bewijs zonder het profiel tot een verkoopadvertentie te maken.",
    instTitle: "Voor instellingen en ecosystemen",
    instText: "Krijg inzicht in waar ambachtelijke vaardigheden worden beoefend, identificeer regionale capaciteiten en ondersteun skills intelligence, beroepsgerichte leertrajecten, continuïteit van erfgoed en grensoverschrijdende samenwerking.",
    trustTitle: "Vertrouwen moet expliciet zijn, niet impliciet.",
    trustText: "CraftID certificeert geen persoon als geheel. Beoordeling geldt voor specifieke claims en het daaraan gekoppelde bewijs. Publieke statustaal maakt precies duidelijk wat wel — en niet — is beoordeeld.",
    methodology: "Lees de methodologie",
    trustEyebrow: "Vertrouwensmodel",
  },
  pl: {
    pilotLabel: "Platforma pilotażowa",
    pilotText: "CraftID jest obecnie aktywnie rozwijany i testowany. Funkcje, struktury danych i procesy mogą ulec zmianie przed publicznym uruchomieniem.",
    eyebrow: "Infrastruktura tożsamości zawodowej",
    title: "Tożsamość zawodowa oparta na dowodach.",
    intro: "CraftID to europejsko ukierunkowana infrastruktura tożsamości zawodowej, umiejętności i dowodów dla rzemieślników, pracowni i mikroprzedsiębiorstw opartych na rzemiośle.",
    create: "Utwórz CraftID",
    explore: "Przeglądaj rejestr",
    logicLabel: "Logika podstawowa",
    logic: ["Tożsamość", "Umiejętności", "Praktyka", "Dowody", "Zaufanie"],
    whyTitle: "Trwały zapis zawodowy.",
    whyText: "CraftID zapewnia osobom i pracowniom stały punkt odniesienia zawodowego, który może łączyć umiejętności, doświadczenie, kwalifikacje, afiliacje i materiały dowodowe w jednym uporządkowanym zapisie.",
    cards: [
      ["Tożsamość", "Stały identyfikator CraftID dla profesjonalisty lub pracowni. Identyfikator nie koduje kraju, zawodu, roku ani statusu prawnego."],
      ["Umiejętności i praktyka", "Opisuj umiejętności wykorzystywane w praktyce zawodowej i łącz je z doświadczeniem, kwalifikacjami, portfolio i afiliacjami."],
      ["Dowody", "Łącz konkretne deklaracje zawodowe z materiałami potwierdzającymi. Dowody są domyślnie prywatne i nie są automatycznie publikowane."],
      ["Zaufanie", "Publiczne zapisy wyraźnie rozróżniają informacje zadeklarowane samodzielnie, złożone dowody i deklaracje, które przeszły przegląd."],
    ],
    valueEyebrow: "Dla profesjonalistów rzemiosła",
    valueTitle: "Jedna tożsamość. Praktyczna wartość w czasie.",
    valueIntro: "CraftID ma być czymś więcej niż profilem. Daje rzemieślnikowi stały identyfikator zawodowy do wykorzystania na produktach, w komunikacji zawodowej, wnioskach i przy zmianie miejsca pracy.",
    valueItems: [
      ["Stały CraftID", "Jeden identyfikator zawodowy do użycia na produktach, opakowaniach, wizytówkach, stronach internetowych, CV, katalogach i wnioskach. CraftID pozostaje przypisany do tej samej osoby lub pracowni w czasie."],
      ["Publiczny profil zawodowy", "Kupujący, organizator targów, partner lub instytucja może przejść przez CraftID lub kod QR i zobaczyć, kim jest twórca oraz jaką praktykę zawodową przedstawia publicznie."],
      ["Historia umiejętności oparta na dowodach", "Umiejętności, doświadczenie, szkolenia, kwalifikacje i inne deklaracje mogą być stopniowo łączone z dowodami i poświadczeniami, przy zachowaniu prywatności dowodów, chyba że ich ujawnienie jest wyraźnie zamierzone."],
      ["CraftID Record Certificate", "Wydawaj i pobieraj wersjonowany certyfikat wpisu CraftID z własnym numerem certyfikatu i weryfikacją kodem QR. Utrwala on opublikowany stan wpisu CraftID; nie certyfikuje tożsamości ani kompetencji zawodowych."],
      ["Identyfikowalność produktów", "Gdy CraftID zostanie umieszczony na produkcie lub dokumencie, identyfikator może pozostać dostępny w czasie, aby zarejestrowany twórca lub pracownia mogli być zidentyfikowani także po zamknięciu aktywnego konta."],
      ["Kontrola prywatności", "Właściciel CraftID decyduje, co jest publiczne: kraj, region lub miasto, dane profilu, kontakty i zdjęcie. Właściciel pracowni może też wyraźnie zdecydować, czy publikować dokładny adres działalności."],
      ["Połączenie Professional ↔ Workshop", "Professional CraftID może być połączony z Workshop CraftID bez łączenia obu tożsamości, dzięki czemu osoba zachowuje własny zapis zawodowy, gdy zmienia się pracownia, pracodawca lub miejsce praktyki."],
      ["Przejrzyste zaufanie", "CraftID nie twierdzi, że twórca jest „dobry” ani ogólnie certyfikowany. Pokazuje uporządkowane informacje zawodowe i rozróżnia dane zadeklarowane samodzielnie, dowody oraz deklaracje poddane ocenie."],
      ["Dostęp przez sieć partnerów", "Wraz z rozwojem sieci CraftID może być wykorzystywany przez partnerów krajowych i sektorowych, organizacje rzemieślnicze, targi, instytucje edukacyjne i programy wsparcia jako uporządkowany punkt odniesienia zawodowego."],
    ],
    audience: "Dla kogo jest CraftID",
    profTitle: "Dla profesjonalistów i pracowni",
    profText: "Buduj przenośny zapis zawodowy niezależny od marketplace’u, pracodawcy czy pojedynczego projektu. Prezentuj umiejętności, praktykę i dowody bez zamieniania profilu w ofertę sprzedażową.",
    instTitle: "Dla instytucji i ekosystemów",
    instText: "Zrozum, gdzie praktykowane są umiejętności rzemieślnicze, identyfikuj regionalne kompetencje i wspieraj analizę umiejętności, ścieżki kształcenia zawodowego, ciągłość dziedzictwa oraz współpracę transgraniczną.",
    trustTitle: "Zaufanie powinno być wyraźne, a nie domyślne.",
    trustText: "CraftID nie certyfikuje całej osoby. Przegląd dotyczy konkretnych deklaracji i powiązanych z nimi dowodów. Publiczne statusy mają jasno pokazywać, co zostało — a co nie zostało — sprawdzone.",
    methodology: "Przeczytaj metodologię",
    trustEyebrow: "Model zaufania",
  },
  it: {
    pilotLabel: "Piattaforma pilota",
    pilotText: "CraftID è attualmente in fase di sviluppo e test attivi. Funzioni, strutture dei dati e flussi di lavoro possono cambiare prima del lancio pubblico.",
    eyebrow: "Infrastruttura per l’identità professionale",
    title: "Identità professionale, costruita sulle evidenze.",
    intro: "CraftID è un’infrastruttura orientata all’Europa per identità professionale, competenze ed evidenze, destinata ad artigiani, laboratori e microimprese basate sull’artigianato.",
    create: "Crea CraftID",
    explore: "Esplora il registro",
    logicLabel: "Logica centrale",
    logic: ["Identità", "Competenze", "Pratica", "Evidenze", "Fiducia"],
    whyTitle: "Un dossier professionale durevole.",
    whyText: "CraftID offre a persone e laboratori un riferimento professionale persistente che può collegare competenze, esperienza, qualifiche, affiliazioni e materiali di supporto in un unico dossier strutturato.",
    cards: [
      ["Identità", "Un riferimento CraftID persistente per un professionista o un laboratorio. L’identificativo non codifica paese, professione, anno o status giuridico."],
      ["Competenze e pratica", "Descrivi le competenze utilizzate nella pratica professionale e collegale a esperienza, qualifiche, portfolio e affiliazioni."],
      ["Evidenze", "Collega specifiche dichiarazioni professionali a materiali di supporto. Le evidenze sono private per impostazione predefinita e non vengono rese pubbliche automaticamente."],
      ["Fiducia", "I profili pubblici distinguono chiaramente tra informazioni autodichiarate, evidenze presentate e dichiarazioni sottoposte a revisione."],
    ],
    valueEyebrow: "Per i professionisti dell’artigianato",
    valueTitle: "Un’identità. Valore pratico nel tempo.",
    valueIntro: "CraftID è progettato per essere più di un profilo. Offre a un professionista dell’artigianato un riferimento permanente utilizzabile sui prodotti, nella comunicazione professionale, nelle candidature e al cambiare dei luoghi di lavoro.",
    valueItems: [
      ["CraftID permanente", "Un unico identificativo professionale utilizzabile su prodotti, imballaggi, biglietti da visita, siti web, CV, cataloghi e candidature. Il CraftID resta associato nel tempo allo stesso professionista o laboratorio."],
      ["Profilo professionale pubblico", "Un acquirente, organizzatore di fiera, partner o istituzione può seguire il CraftID o il codice QR per vedere chi è il maker e quale pratica professionale presenta pubblicamente."],
      ["Storia delle competenze supportata da evidenze", "Competenze, esperienza, formazione, qualifiche e altre dichiarazioni possono essere progressivamente collegate a evidenze e attestazioni, mantenendo private le prove salvo quando la divulgazione è espressamente prevista."],
      ["CraftID Record Certificate", "Emetti e scarica un certificato con numero di versione della scheda CraftID, con un proprio numero di certificato e verifica tramite QR. Registra lo stato pubblicato della scheda CraftID; non certifica l’identità né la competenza professionale."],
      ["Tracciabilità dei prodotti", "Quando un CraftID è applicato a un prodotto o documento, l’identificativo può restare risolvibile nel tempo affinché il maker o laboratorio registrato possa essere identificato anche dopo la chiusura dell’account attivo."],
      ["Controllo della privacy", "Il titolare del CraftID decide cosa è pubblico: paese, regione o città, dettagli del profilo, contatti e foto. I laboratori possono inoltre scegliere esplicitamente se pubblicare un indirizzo aziendale esatto."],
      ["Collegamento Professional ↔ Workshop", "Un Professional CraftID può essere collegato a un Workshop CraftID senza fondere le due identità, così la persona conserva il proprio record professionale quando cambiano laboratorio, datore di lavoro o luogo di pratica."],
      ["Fiducia trasparente", "CraftID non afferma che un artigiano sia “bravo” o certificato in senso generale. Mostra informazioni professionali strutturate e distingue informazioni autodichiarate, evidenze e dichiarazioni esaminate."],
      ["Accesso attraverso la rete di partner", "Con lo sviluppo della rete, CraftID può essere utilizzato da partner nazionali e settoriali, organizzazioni artigiane, fiere, enti di formazione e programmi di supporto come riferimento professionale strutturato."],
    ],
    audience: "A chi è rivolto CraftID",
    profTitle: "Per professionisti e laboratori",
    profText: "Costruisci un record professionale portabile, indipendente da marketplace, datore di lavoro o singolo progetto. Presenta competenze, pratica ed evidenze senza trasformare il profilo in un annuncio di vendita.",
    instTitle: "Per istituzioni ed ecosistemi",
    instText: "Comprendi dove vengono praticate le competenze artigianali, individua le capacità regionali e supporta l’analisi delle competenze, i percorsi di formazione professionale, la continuità del patrimonio e la cooperazione transfrontaliera.",
    trustTitle: "La fiducia deve essere esplicita, non implicita.",
    trustText: "CraftID non certifica una persona nel suo complesso. L’esame riguarda dichiarazioni specifiche e le evidenze ad esse collegate. Il linguaggio degli status pubblici mostra esattamente cosa è stato — e cosa non è stato — esaminato.",
    methodology: "Leggi la metodologia",
    trustEyebrow: "Modello di fiducia",
  },
  es: {
    pilotLabel: "Plataforma piloto",
    pilotText: "CraftID se encuentra actualmente en desarrollo y pruebas activas. Las funciones, las estructuras de datos y los flujos de trabajo pueden cambiar antes del lanzamiento público.",
    eyebrow: "Infraestructura de identidad profesional",
    title: "Identidad profesional, construida sobre evidencias.",
    intro: "CraftID es una infraestructura de orientación europea para identidad profesional, competencias y evidencias dirigida a artesanos, talleres y microempresas basadas en oficios y artesanía.",
    create: "Crear CraftID",
    explore: "Explorar el registro",
    logicLabel: "Lógica central",
    logic: ["Identidad", "Competencias", "Práctica", "Evidencias", "Confianza"],
    whyTitle: "Un registro profesional duradero.",
    whyText: "CraftID ofrece a profesionales y talleres una referencia profesional persistente que puede conectar competencias, experiencia, cualificaciones, afiliaciones y materiales de apoyo en un único registro estructurado.",
    cards: [
      ["Identidad", "Una referencia CraftID persistente para un profesional o taller. El identificador no codifica país, profesión, año ni situación jurídica."],
      ["Competencias y práctica", "Describe las competencias utilizadas en la práctica profesional y relaciónalas con experiencia, cualificaciones, portfolio y afiliaciones."],
      ["Evidencias", "Vincula declaraciones profesionales concretas con materiales de apoyo. Las evidencias son privadas por defecto y no se publican automáticamente."],
      ["Confianza", "Los registros públicos distinguen claramente entre información autodeclarada, evidencias presentadas y declaraciones que han sido revisadas."],
    ],
    valueEyebrow: "Para profesionales de la artesanía",
    valueTitle: "Una identidad. Valor práctico a lo largo del tiempo.",
    valueIntro: "CraftID está diseñado para ser más que un perfil. Proporciona a un profesional de la artesanía una referencia permanente que puede utilizarse en productos, comunicación profesional, solicitudes y cambios de lugar de trabajo.",
    valueItems: [
      ["CraftID permanente", "Un único identificador profesional que puede utilizarse en productos, embalajes, tarjetas, sitios web, CV, catálogos y solicitudes. El CraftID permanece vinculado al mismo profesional o taller a lo largo del tiempo."],
      ["Perfil profesional público", "Un comprador, organizador de feria, socio o institución puede seguir el CraftID o el código QR para ver quién es el creador y qué práctica profesional presenta públicamente."],
      ["Historial de competencias respaldado por evidencias", "Las competencias, la experiencia, la formación, las cualificaciones y otras declaraciones pueden vincularse gradualmente a evidencias y constancias, manteniendo las evidencias privadas salvo que su divulgación esté expresamente prevista."],
      ["CraftID Record Certificate", "Emite y descarga un certificado versionado de la ficha CraftID con su propio número de certificado y verificación mediante QR. Registra la versión publicada de la ficha CraftID; no certifica la identidad ni la competencia profesional."],
      ["Trazabilidad de productos", "Cuando un CraftID se coloca en un producto o documento, el identificador puede seguir siendo resoluble con el tiempo para que el creador o taller registrado pueda identificarse incluso después de cerrar la cuenta activa."],
      ["Control de privacidad", "El titular del CraftID decide qué es público: país, región o ciudad, datos del perfil, contactos y foto. Los talleres también pueden decidir expresamente si publican una dirección empresarial exacta."],
      ["Vínculo Professional ↔ Workshop", "Un Professional CraftID puede vincularse a un Workshop CraftID sin fusionar ambas identidades, de modo que una persona conserva su propio registro profesional cuando cambia de taller, empleador o lugar de práctica."],
      ["Confianza transparente", "CraftID no afirma que un creador sea «bueno» ni que esté certificado de forma general. Muestra información profesional estructurada y distingue entre información autodeclarada, evidencias y declaraciones revisadas."],
      ["Acceso a través de la red de socios", "A medida que crece la red, CraftID puede ser utilizado por socios nacionales y sectoriales, organizaciones artesanales, ferias, proveedores de formación y programas de apoyo como referencia profesional estructurada."],
    ],
    audience: "Para quién es CraftID",
    profTitle: "Para profesionales y talleres",
    profText: "Construye un registro profesional portátil e independiente de un marketplace, empleador o proyecto concreto. Presenta competencias, práctica y evidencias sin convertir el perfil en un anuncio de venta.",
    instTitle: "Para instituciones y ecosistemas",
    instText: "Comprende dónde se practican las competencias artesanales, identifica capacidades regionales y apoya la inteligencia de competencias, los itinerarios de formación profesional, la continuidad del patrimonio y la cooperación transfronteriza.",
    trustTitle: "La confianza debe ser explícita, no implícita.",
    trustText: "CraftID no certifica a una persona en su conjunto. La revisión se aplica a declaraciones concretas y a las evidencias vinculadas. El lenguaje de los estados públicos muestra exactamente qué ha sido — y qué no ha sido — revisado.",
    methodology: "Leer la metodología",
    trustEyebrow: "Modelo de confianza",
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
      ["Сертифікат запису CraftID", "Випускайте та завантажуйте версійний сертифікат запису CraftID із власним номером сертифіката та QR-перевіркою. Він фіксує опублікований стан запису CraftID і не є підтвердженням особи чи професійної компетентності."],
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
    trustEyebrow: "Модель довіри",
  },
} as const;

export default async function HomePage({ searchParams }: HomeProps) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale];
  const q = locale === "en" ? "" : `?lang=${locale}`;

  return (
    <>
      <SiteHeader locale={locale} pathname="/" />
      <main className="publicInfoPage">
        <aside className="pilotNotice" aria-label={t.pilotLabel}>
          <div className="container pilotNoticeInner">
            <strong>{t.pilotLabel}</strong>
            <span>{t.pilotText}</span>
          </div>
        </aside>
        <section className={`hero homeHero homeHero--${locale}`}>
          <div className="container">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1 className={`homeHeroTitle homeHeroTitle--${locale}`}>{t.title}</h1>
            <p className="homeHeroIntro">{t.intro}</p>
            <div className="actions">
              <Link className="button buttonPrimary" href={`/signup${q}`}>{t.create}</Link>
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
              <div className="eyebrow">{t.trustEyebrow}</div>
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
