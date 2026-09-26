import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/login/actions";
import { LanguageMenu, localeFrom } from "@/components/site-shell";
import { closeCraftIdAccount, createAdditionalCraftId } from "./actions";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { formatCraftId } from "@/lib/craftid-format";
import { localeQuery, withLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ lang?: string; entity?: string; error?: string; message?: string }>;
};

const copy = {
  en: {
    eyebrow: "My CraftID",
    signOut: "Sign out",
    recordFallback: "CraftID record",
    complete: "Add a professional title or craft sector to describe your practice.",
    current: "Your published record is live. Keep its professional information and evidence current.",
    addTitle: "Add a professional title or craft sector",
    addLocation: "Add a public city or region",
    addSkills: "Add professional skills",
    addExperience: "Add experience or qualifications",
    addEvidence: "Link supporting evidence",
    reviewPublish: "Review privacy and publish",
    maintain: "Review your published record and keep it current",
    status: "Status",
    location: "Location",
    notSet: "Not set",
    next: "Next steps",
    profile: "Profile",
    profileText: "Manage the information that describes you or your workshop.",
    skills: "Skills & claims",
    skillsText: "Build structured claims around skills, experience and qualifications.",
    evidence: "Evidence",
    evidenceText: "Manage private supporting material linked to individual claims.",
    privacy: "Privacy",
    privacyText: "Choose what is visible publicly and how precise your location may be.",
    public: "Public profile",
    publicText: "Preview the record before publication or review the live public version.",
    requests: "Contact requests",
    requestsText: "Review controlled enquiries without publishing your private email or phone.",
    referrals: "Institutional opportunities",
    referralsText: "Review project, partnership, training and commission invitations routed through CraftID.",
    support: "Opportunities & Support",
    supportText: "Tell CraftID what kinds of funding, advice, training, partnerships and other support are relevant to you.",
    certificate: "CraftID Record Certificate",
    certificateText: "Issue and download a versioned certificate of this CraftID record with a public Certificate No. and QR verification.",
    mark: "CraftID Mark",
    markText: "Use your CraftID on websites, product cards, workshop signage and print. The mark identifies a CraftID record; it is not a certification or quality seal.",
    open: "Open",
    typeProfessional: "Professional",
    typeWorkshop: "Workshop",
    draft: "Draft",
    published: "Published",
    suspended: "Suspended",
    archived: "Archived",
    records: "Your CraftID records",
    switch: "Switch record",
    createProfessional: "Create Professional CraftID",
    createWorkshop: "Create Workshop CraftID",
    professionalCreated: "Professional CraftID created and linked to your workshop record.",
    workshopCreated: "Workshop CraftID created and linked to your professional record.",
    professionalExists: "You already have an active Professional CraftID.",
    workshopExists: "You already have an active Workshop CraftID.",
    relationshipNote: "Personal and workshop records remain separate CraftIDs. Their relationship can be managed without merging professional evidence.",
    account: "Account",
    closeAccount: "Close CraftID account",
    closeAccountText: "Your active CraftID records will be archived immediately and removed from Registry, Discover and Map. Existing CraftID numbers will remain resolvable as minimal historical records so products and documents already carrying the number do not become unverifiable.",
    closeAccountRetention: "Public contacts, profile images and active profile details will no longer be disclosed. The CraftID number is never reassigned. If you later return and recover this identity, the same CraftID is restored as a draft and must be reviewed before publication.",
    closeConfirm: 'Type "close" to confirm',
    closeKeyword: "close",
    closeButton: "Archive records and close account",
  },
  fr: {
    eyebrow: "Mon CraftID",
    signOut: "Se déconnecter",
    recordFallback: "Dossier CraftID",
    complete: "Ajoutez un titre professionnel ou un secteur artisanal pour décrire votre pratique.",
    current: "Votre dossier publié est en ligne. Maintenez à jour ses informations professionnelles et ses preuves.",
    addTitle: "Ajouter un titre professionnel ou un secteur artisanal",
    addLocation: "Ajouter une ville ou une région publique",
    addSkills: "Ajouter des compétences professionnelles",
    addExperience: "Ajouter une expérience ou des qualifications",
    addEvidence: "Associer des preuves",
    reviewPublish: "Vérifier la confidentialité et publier",
    maintain: "Vérifier votre dossier publié et le maintenir à jour",
    status: "Statut",
    location: "Localisation",
    notSet: "Non renseigné",
    next: "Étapes suivantes",
    profile: "Profil",
    profileText: "Gérez les informations qui vous décrivent, vous ou votre atelier.",
    skills: "Compétences et déclarations",
    skillsText: "Créez des déclarations structurées sur les compétences, l’expérience et les qualifications.",
    evidence: "Preuves",
    evidenceText: "Gérez les pièces justificatives privées liées à des déclarations individuelles.",
    privacy: "Confidentialité",
    privacyText: "Choisissez ce qui est visible publiquement et le niveau de précision de votre localisation.",
    public: "Profil public",
    publicText: "Prévisualisez le dossier avant publication ou consultez sa version publique en ligne.",
    requests: "Demandes de contact",
    requestsText: "Examinez les demandes contrôlées sans publier votre e-mail ou téléphone privé.",
    referrals: "Opportunités institutionnelles",
    referralsText: "Examinez les invitations à des projets, partenariats, formations et commandes transmises via CraftID.",
    support: "Opportunités et soutien",
    supportText: "Indiquez à CraftID les financements, conseils, formations, partenariats et autres formes de soutien qui vous intéressent.",
    certificate: "Certificat du dossier CraftID",
    certificateText: "Émettez et téléchargez un certificat versionné de ce dossier CraftID avec un Certificate No. public et une vérification QR.",
    mark: "Marque CraftID",
    markText: "Utilisez votre CraftID sur les sites web, fiches produits, enseignes d’atelier et imprimés. La marque identifie un dossier CraftID ; ce n’est ni une certification ni un label de qualité.",
    open: "Ouvrir",
    typeProfessional: "Professional",
    typeWorkshop: "Workshop",
    draft: "Brouillon",
    published: "Publié",
    suspended: "Suspendu",
    archived: "Archivé",
    records: "Vos dossiers CraftID",
    switch: "Changer de dossier",
    createProfessional: "Créer un CraftID Professional",
    createWorkshop: "Créer un CraftID Workshop",
    professionalCreated: "Le CraftID Professional a été créé et relié à votre dossier Workshop.",
    workshopCreated: "Le CraftID Workshop a été créé et relié à votre dossier Professional.",
    professionalExists: "Vous avez déjà un CraftID Professional actif.",
    workshopExists: "Vous avez déjà un CraftID Workshop actif.",
    relationshipNote: "Les dossiers personnels et d’atelier restent des CraftID distincts. Leur relation peut être gérée sans fusionner les preuves professionnelles.",
    account: "Compte",
    closeAccount: "Fermer le compte CraftID",
    closeAccountText: "Vos dossiers CraftID actifs seront immédiatement archivés et retirés du Registre, de Discover et de la carte. Les numéros CraftID existants resteront résolvables sous forme de dossiers historiques minimaux afin que les produits et documents qui les portent restent vérifiables.",
    closeAccountRetention: "Les contacts publics, images de profil et détails actifs du profil ne seront plus divulgués. Le numéro CraftID n’est jamais réattribué. Si vous revenez ultérieurement et récupérez cette identité, le même CraftID sera restauré comme brouillon et devra être vérifié avant publication.",
    closeConfirm: 'Tapez "fermer" pour confirmer',
    closeKeyword: "fermer",
    closeButton: "Archiver les dossiers et fermer le compte",
  },
  de: {
    eyebrow: "Meine CraftID",
    signOut: "Abmelden",
    recordFallback: "CraftID-Datensatz",
    complete: "Fügen Sie eine Berufsbezeichnung oder einen Handwerksbereich hinzu, um Ihre Tätigkeit zu beschreiben.",
    current: "Ihr veröffentlichter Datensatz ist online. Halten Sie berufliche Angaben und Nachweise aktuell.",
    addTitle: "Berufsbezeichnung oder Handwerksbereich hinzufügen",
    addLocation: "Öffentliche Stadt oder Region hinzufügen",
    addSkills: "Berufliche Kompetenzen hinzufügen",
    addExperience: "Erfahrung oder Qualifikationen hinzufügen",
    addEvidence: "Unterstützende Nachweise verknüpfen",
    reviewPublish: "Datenschutz prüfen und veröffentlichen",
    maintain: "Veröffentlichten Datensatz prüfen und aktuell halten",
    status: "Status",
    location: "Standort",
    notSet: "Nicht angegeben",
    next: "Nächste Schritte",
    profile: "Profil",
    profileText: "Verwalten Sie die Angaben, die Sie oder Ihre Werkstatt beschreiben.",
    skills: "Kompetenzen & Angaben",
    skillsText: "Erstellen Sie strukturierte Angaben zu Kompetenzen, Erfahrung und Qualifikationen.",
    evidence: "Nachweise",
    evidenceText: "Verwalten Sie private Belege, die einzelnen Angaben zugeordnet sind.",
    privacy: "Datenschutz",
    privacyText: "Bestimmen Sie, was öffentlich sichtbar ist und wie genau Ihr Standort angezeigt wird.",
    public: "Öffentliches Profil",
    publicText: "Sehen Sie den Datensatz vor der Veröffentlichung in der Vorschau oder prüfen Sie die öffentliche Live-Version.",
    requests: "Kontaktanfragen",
    requestsText: "Prüfen Sie kontrollierte Anfragen, ohne Ihre private E-Mail-Adresse oder Telefonnummer zu veröffentlichen.",
    referrals: "Institutionelle Möglichkeiten",
    referralsText: "Prüfen Sie Einladungen zu Projekten, Partnerschaften, Schulungen und Aufträgen, die über CraftID vermittelt werden.",
    support: "Möglichkeiten & Unterstützung",
    supportText: "Teilen Sie CraftID mit, welche Finanzierung, Beratung, Schulung, Partnerschaften und weitere Unterstützung für Sie relevant sind.",
    certificate: "CraftID-Datensatzzertifikat",
    certificateText: "Stellen Sie ein versioniertes Zertifikat dieses CraftID-Datensatzes mit öffentlicher Certificate No. und QR-Prüfung aus und laden Sie es herunter.",
    mark: "CraftID Mark",
    markText: "Verwenden Sie Ihre CraftID auf Websites, Produktkarten, Werkstattschildern und Drucksachen. Die Marke identifiziert einen CraftID-Datensatz; sie ist keine Zertifizierung und kein Qualitätssiegel.",
    open: "Öffnen",
    typeProfessional: "Professional",
    typeWorkshop: "Workshop",
    draft: "Entwurf",
    published: "Veröffentlicht",
    suspended: "Ausgesetzt",
    archived: "Archiviert",
    records: "Ihre CraftID-Datensätze",
    switch: "Datensatz wechseln",
    createProfessional: "Professional CraftID erstellen",
    createWorkshop: "Workshop CraftID erstellen",
    professionalCreated: "Professional CraftID wurde erstellt und mit Ihrem Workshop-Datensatz verknüpft.",
    workshopCreated: "Workshop CraftID wurde erstellt und mit Ihrem Professional-Datensatz verknüpft.",
    professionalExists: "Sie haben bereits eine aktive Professional CraftID.",
    workshopExists: "Sie haben bereits eine aktive Workshop CraftID.",
    relationshipNote: "Persönliche und Werkstatt-Datensätze bleiben getrennte CraftIDs. Ihre Beziehung kann verwaltet werden, ohne berufliche Nachweise zusammenzuführen.",
    account: "Konto",
    closeAccount: "CraftID-Konto schließen",
    closeAccountText: "Ihre aktiven CraftID-Datensätze werden sofort archiviert und aus Register, Discover und Karte entfernt. Bestehende CraftID-Nummern bleiben als minimale historische Datensätze auflösbar, damit Produkte und Dokumente mit dieser Nummer weiterhin überprüfbar bleiben.",
    closeAccountRetention: "Öffentliche Kontakte, Profilbilder und aktive Profildetails werden nicht mehr offengelegt. Die CraftID-Nummer wird niemals neu vergeben. Wenn Sie später zurückkehren und diese Identität wiederherstellen, wird dieselbe CraftID als Entwurf reaktiviert und muss vor der Veröffentlichung geprüft werden.",
    closeConfirm: 'Geben Sie "schließen" zur Bestätigung ein',
    closeKeyword: "schließen",
    closeButton: "Datensätze archivieren und Konto schließen",
  },
  nl: {
    eyebrow: "Mijn CraftID",
    signOut: "Uitloggen",
    recordFallback: "CraftID-dossier",
    complete: "Voeg een professionele titel of ambachtssector toe om uw praktijk te beschrijven.",
    current: "Uw gepubliceerde dossier staat online. Houd professionele informatie en bewijs actueel.",
    addTitle: "Professionele titel of ambachtssector toevoegen",
    addLocation: "Openbare stad of regio toevoegen",
    addSkills: "Professionele vaardigheden toevoegen",
    addExperience: "Ervaring of kwalificaties toevoegen",
    addEvidence: "Ondersteunend bewijs koppelen",
    reviewPublish: "Privacy controleren en publiceren",
    maintain: "Gepubliceerd dossier controleren en actueel houden",
    status: "Status",
    location: "Locatie",
    notSet: "Niet ingesteld",
    next: "Volgende stappen",
    profile: "Profiel",
    profileText: "Beheer de informatie die u of uw werkplaats beschrijft.",
    skills: "Vaardigheden & verklaringen",
    skillsText: "Bouw gestructureerde verklaringen op rond vaardigheden, ervaring en kwalificaties.",
    evidence: "Bewijs",
    evidenceText: "Beheer privé ondersteunend materiaal dat aan afzonderlijke verklaringen is gekoppeld.",
    privacy: "Privacy",
    privacyText: "Kies wat publiek zichtbaar is en hoe nauwkeurig uw locatie mag worden weergegeven.",
    public: "Openbaar profiel",
    publicText: "Bekijk het dossier vóór publicatie of controleer de live openbare versie.",
    requests: "Contactverzoeken",
    requestsText: "Beoordeel gecontroleerde vragen zonder uw privé-e-mail of telefoonnummer openbaar te maken.",
    referrals: "Institutionele kansen",
    referralsText: "Beoordeel uitnodigingen voor projecten, partnerschappen, training en opdrachten die via CraftID worden doorgestuurd.",
    support: "Kansen & ondersteuning",
    supportText: "Laat CraftID weten welke financiering, advies, training, partnerschappen en andere ondersteuning voor u relevant zijn.",
    certificate: "CraftID Record Certificate",
    certificateText: "Geef een versiecertificaat van dit CraftID-dossier uit en download het met een openbare Certificate No. en QR-verificatie.",
    mark: "CraftID Mark",
    markText: "Gebruik uw CraftID op websites, productkaarten, werkplaatsborden en drukwerk. De markering identificeert een CraftID-dossier; het is geen certificering of kwaliteitslabel.",
    open: "Openen",
    typeProfessional: "Professional",
    typeWorkshop: "Workshop",
    draft: "Concept",
    published: "Gepubliceerd",
    suspended: "Opgeschort",
    archived: "Gearchiveerd",
    records: "Uw CraftID-dossiers",
    switch: "Dossier wisselen",
    createProfessional: "Professional CraftID aanmaken",
    createWorkshop: "Workshop CraftID aanmaken",
    professionalCreated: "Professional CraftID is aangemaakt en gekoppeld aan uw Workshop-dossier.",
    workshopCreated: "Workshop CraftID is aangemaakt en gekoppeld aan uw Professional-dossier.",
    professionalExists: "U hebt al een actieve Professional CraftID.",
    workshopExists: "U hebt al een actieve Workshop CraftID.",
    relationshipNote: "Persoonlijke en werkplaatsdossiers blijven afzonderlijke CraftIDs. Hun relatie kan worden beheerd zonder professioneel bewijs samen te voegen.",
    account: "Account",
    closeAccount: "CraftID-account sluiten",
    closeAccountText: "Uw actieve CraftID-dossiers worden onmiddellijk gearchiveerd en verwijderd uit Registry, Discover en Map. Bestaande CraftID-nummers blijven als minimale historische dossiers opvraagbaar, zodat producten en documenten waarop het nummer al staat controleerbaar blijven.",
    closeAccountRetention: "Openbare contacten, profielafbeeldingen en actieve profielgegevens worden niet langer getoond. Het CraftID-nummer wordt nooit opnieuw toegewezen. Als u later terugkeert en deze identiteit herstelt, wordt dezelfde CraftID als concept hersteld en moet die vóór publicatie worden beoordeeld.",
    closeConfirm: 'Typ "sluiten" om te bevestigen',
    closeKeyword: "sluiten",
    closeButton: "Dossiers archiveren en account sluiten",
  },
  pl: {
    eyebrow: "Mój CraftID",
    signOut: "Wyloguj się",
    recordFallback: "Zapis CraftID",
    complete: "Dodaj tytuł zawodowy lub sektor rzemiosła, aby opisać swoją praktykę.",
    current: "Twój opublikowany zapis jest aktywny. Dbaj o aktualność informacji zawodowych i dowodów.",
    addTitle: "Dodaj tytuł zawodowy lub sektor rzemiosła",
    addLocation: "Dodaj publiczne miasto lub region",
    addSkills: "Dodaj umiejętności zawodowe",
    addExperience: "Dodaj doświadczenie lub kwalifikacje",
    addEvidence: "Powiąż dowody",
    reviewPublish: "Sprawdź prywatność i opublikuj",
    maintain: "Sprawdź opublikowany zapis i dbaj o jego aktualność",
    status: "Status",
    location: "Lokalizacja",
    notSet: "Nie ustawiono",
    next: "Następne kroki",
    profile: "Profil",
    profileText: "Zarządzaj informacjami opisującymi Ciebie lub Twoją pracownię.",
    skills: "Umiejętności i deklaracje",
    skillsText: "Twórz uporządkowane deklaracje dotyczące umiejętności, doświadczenia i kwalifikacji.",
    evidence: "Dowody",
    evidenceText: "Zarządzaj prywatnymi materiałami potwierdzającymi powiązanymi z poszczególnymi deklaracjami.",
    privacy: "Prywatność",
    privacyText: "Wybierz, co jest widoczne publicznie i jak dokładnie może być pokazana Twoja lokalizacja.",
    public: "Profil publiczny",
    publicText: "Podejrzyj zapis przed publikacją lub sprawdź jego aktualną wersję publiczną.",
    requests: "Prośby o kontakt",
    requestsText: "Przeglądaj kontrolowane zapytania bez publikowania prywatnego adresu e-mail ani numeru telefonu.",
    referrals: "Możliwości instytucjonalne",
    referralsText: "Przeglądaj zaproszenia do projektów, partnerstw, szkoleń i zleceń przekazywane przez CraftID.",
    support: "Możliwości i wsparcie",
    supportText: "Wskaż CraftID, jakie finansowanie, doradztwo, szkolenia, partnerstwa i inne formy wsparcia są dla Ciebie istotne.",
    certificate: "Certyfikat zapisu CraftID",
    certificateText: "Wydaj i pobierz wersjonowany certyfikat tego zapisu CraftID z publicznym Certificate No. i weryfikacją QR.",
    mark: "CraftID Mark",
    markText: "Używaj CraftID na stronach internetowych, kartach produktów, oznakowaniu pracowni i materiałach drukowanych. Znak identyfikuje zapis CraftID; nie jest certyfikatem ani znakiem jakości.",
    open: "Otwórz",
    typeProfessional: "Professional",
    typeWorkshop: "Workshop",
    draft: "Wersja robocza",
    published: "Opublikowany",
    suspended: "Zawieszony",
    archived: "Zarchiwizowany",
    records: "Twoje zapisy CraftID",
    switch: "Zmień zapis",
    createProfessional: "Utwórz Professional CraftID",
    createWorkshop: "Utwórz Workshop CraftID",
    professionalCreated: "Professional CraftID został utworzony i powiązany z zapisem Workshop.",
    workshopCreated: "Workshop CraftID został utworzony i powiązany z zapisem Professional.",
    professionalExists: "Masz już aktywny Professional CraftID.",
    workshopExists: "Masz już aktywny Workshop CraftID.",
    relationshipNote: "Osobisty zapis i zapis pracowni pozostają oddzielnymi CraftID. Ich relacją można zarządzać bez łączenia dowodów zawodowych.",
    account: "Konto",
    closeAccount: "Zamknij konto CraftID",
    closeAccountText: "Aktywne zapisy CraftID zostaną natychmiast zarchiwizowane i usunięte z Registry, Discover i Map. Istniejące numery CraftID pozostaną dostępne jako minimalne zapisy historyczne, aby produkty i dokumenty już oznaczone numerem nadal można było zweryfikować.",
    closeAccountRetention: "Publiczne dane kontaktowe, zdjęcia profilu i aktywne szczegóły profilu nie będą już ujawniane. Numer CraftID nigdy nie jest ponownie przydzielany. Jeśli później wrócisz i odzyskasz tę tożsamość, ten sam CraftID zostanie przywrócony jako wersja robocza i będzie wymagał przeglądu przed publikacją.",
    closeConfirm: 'Wpisz "zamknij", aby potwierdzić',
    closeKeyword: "zamknij",
    closeButton: "Zarchiwizuj zapisy i zamknij konto",
  },
  it: {
    eyebrow: "Il mio CraftID",
    signOut: "Esci",
    recordFallback: "Record CraftID",
    complete: "Aggiungi un titolo professionale o un settore artigianale per descrivere la tua attività.",
    current: "Il tuo record pubblicato è online. Mantieni aggiornate le informazioni professionali e le evidenze.",
    addTitle: "Aggiungi un titolo professionale o un settore artigianale",
    addLocation: "Aggiungi una città o regione pubblica",
    addSkills: "Aggiungi competenze professionali",
    addExperience: "Aggiungi esperienza o qualifiche",
    addEvidence: "Collega evidenze di supporto",
    reviewPublish: "Controlla privacy e pubblica",
    maintain: "Controlla il record pubblicato e mantienilo aggiornato",
    status: "Stato",
    location: "Località",
    notSet: "Non impostato",
    next: "Passaggi successivi",
    profile: "Profilo",
    profileText: "Gestisci le informazioni che descrivono te o il tuo laboratorio.",
    skills: "Competenze e dichiarazioni",
    skillsText: "Crea dichiarazioni strutturate su competenze, esperienza e qualifiche.",
    evidence: "Evidenze",
    evidenceText: "Gestisci materiali di supporto privati collegati a singole dichiarazioni.",
    privacy: "Privacy",
    privacyText: "Scegli cosa è visibile pubblicamente e quanto precisa può essere la tua posizione.",
    public: "Profilo pubblico",
    publicText: "Visualizza un’anteprima prima della pubblicazione o controlla la versione pubblica attiva.",
    requests: "Richieste di contatto",
    requestsText: "Esamina richieste controllate senza pubblicare e-mail o telefono privati.",
    referrals: "Opportunità istituzionali",
    referralsText: "Esamina inviti a progetti, partnership, formazione e incarichi inoltrati tramite CraftID.",
    support: "Opportunità e supporto",
    supportText: "Indica a CraftID quali finanziamenti, consulenze, formazioni, partnership e altre forme di supporto sono rilevanti per te.",
    certificate: "Certificato del record CraftID",
    certificateText: "Emetti e scarica un certificato versionato di questo record CraftID con Certificate No. pubblico e verifica QR.",
    mark: "CraftID Mark",
    markText: "Usa il tuo CraftID su siti web, schede prodotto, insegne del laboratorio e materiali stampati. Il marchio identifica un record CraftID; non è una certificazione né un marchio di qualità.",
    open: "Apri",
    typeProfessional: "Professional",
    typeWorkshop: "Workshop",
    draft: "Bozza",
    published: "Pubblicato",
    suspended: "Sospeso",
    archived: "Archiviato",
    records: "I tuoi record CraftID",
    switch: "Cambia record",
    createProfessional: "Crea Professional CraftID",
    createWorkshop: "Crea Workshop CraftID",
    professionalCreated: "Professional CraftID creato e collegato al tuo record Workshop.",
    workshopCreated: "Workshop CraftID creato e collegato al tuo record Professional.",
    professionalExists: "Hai già un Professional CraftID attivo.",
    workshopExists: "Hai già un Workshop CraftID attivo.",
    relationshipNote: "I record personali e del laboratorio restano CraftID separati. La loro relazione può essere gestita senza unire le evidenze professionali.",
    account: "Account",
    closeAccount: "Chiudi account CraftID",
    closeAccountText: "I record CraftID attivi saranno archiviati immediatamente e rimossi da Registry, Discover e Map. I numeri CraftID esistenti resteranno risolvibili come record storici minimi, così i prodotti e documenti che li riportano continueranno a essere verificabili.",
    closeAccountRetention: "Contatti pubblici, immagini del profilo e dettagli attivi non saranno più divulgati. Il numero CraftID non viene mai riassegnato. Se in futuro torni e recuperi questa identità, lo stesso CraftID sarà ripristinato come bozza e dovrà essere riesaminato prima della pubblicazione.",
    closeConfirm: 'Digita "chiudi" per confermare',
    closeKeyword: "chiudi",
    closeButton: "Archivia i record e chiudi l’account",
  },
  es: {
    eyebrow: "Mi CraftID",
    signOut: "Cerrar sesión",
    recordFallback: "Registro CraftID",
    complete: "Añade un título profesional o sector artesanal para describir tu práctica.",
    current: "Tu registro publicado está activo. Mantén actualizadas la información profesional y las evidencias.",
    addTitle: "Añadir título profesional o sector artesanal",
    addLocation: "Añadir ciudad o región pública",
    addSkills: "Añadir competencias profesionales",
    addExperience: "Añadir experiencia o cualificaciones",
    addEvidence: "Vincular evidencias de apoyo",
    reviewPublish: "Revisar privacidad y publicar",
    maintain: "Revisar el registro publicado y mantenerlo actualizado",
    status: "Estado",
    location: "Ubicación",
    notSet: "No establecido",
    next: "Próximos pasos",
    profile: "Perfil",
    profileText: "Gestiona la información que te describe a ti o a tu taller.",
    skills: "Competencias y declaraciones",
    skillsText: "Crea declaraciones estructuradas sobre competencias, experiencia y cualificaciones.",
    evidence: "Evidencias",
    evidenceText: "Gestiona material de apoyo privado vinculado a declaraciones individuales.",
    privacy: "Privacidad",
    privacyText: "Elige qué es visible públicamente y con qué precisión puede mostrarse tu ubicación.",
    public: "Perfil público",
    publicText: "Previsualiza el registro antes de publicarlo o revisa la versión pública activa.",
    requests: "Solicitudes de contacto",
    requestsText: "Revisa consultas controladas sin publicar tu correo electrónico o teléfono privado.",
    referrals: "Oportunidades institucionales",
    referralsText: "Revisa invitaciones a proyectos, alianzas, formación y encargos canalizadas a través de CraftID.",
    support: "Oportunidades y apoyo",
    supportText: "Indica a CraftID qué financiación, asesoramiento, formación, alianzas y otras formas de apoyo son relevantes para ti.",
    certificate: "Certificado del registro CraftID",
    certificateText: "Emite y descarga un certificado versionado de este registro CraftID con Certificate No. público y verificación QR.",
    mark: "CraftID Mark",
    markText: "Usa tu CraftID en sitios web, fichas de producto, señalización del taller y materiales impresos. La marca identifica un registro CraftID; no es una certificación ni un sello de calidad.",
    open: "Abrir",
    typeProfessional: "Professional",
    typeWorkshop: "Workshop",
    draft: "Borrador",
    published: "Publicado",
    suspended: "Suspendido",
    archived: "Archivado",
    records: "Tus registros CraftID",
    switch: "Cambiar registro",
    createProfessional: "Crear Professional CraftID",
    createWorkshop: "Crear Workshop CraftID",
    professionalCreated: "Professional CraftID creado y vinculado a tu registro Workshop.",
    workshopCreated: "Workshop CraftID creado y vinculado a tu registro Professional.",
    professionalExists: "Ya tienes un Professional CraftID activo.",
    workshopExists: "Ya tienes un Workshop CraftID activo.",
    relationshipNote: "Los registros personales y del taller siguen siendo CraftID separados. Su relación puede gestionarse sin fusionar evidencias profesionales.",
    account: "Cuenta",
    closeAccount: "Cerrar cuenta CraftID",
    closeAccountText: "Tus registros CraftID activos se archivarán inmediatamente y se eliminarán de Registry, Discover y Map. Los números CraftID existentes seguirán siendo resolubles como registros históricos mínimos para que los productos y documentos que ya los llevan sigan siendo verificables.",
    closeAccountRetention: "Los contactos públicos, imágenes de perfil y detalles activos dejarán de mostrarse. El número CraftID nunca se reasigna. Si vuelves más adelante y recuperas esta identidad, el mismo CraftID se restaurará como borrador y deberá revisarse antes de volver a publicarse.",
    closeConfirm: 'Escribe "cerrar" para confirmar',
    closeKeyword: "cerrar",
    closeButton: "Archivar registros y cerrar cuenta",
  },
  uk: {
    eyebrow: "Мій CraftID",
    signOut: "Вийти",
    recordFallback: "Запис CraftID",
    complete: "Додайте професійну назву або ремісничий напрям, щоб описати свою практику.",
    current: "Ваш опублікований запис доступний публічно. Підтримуйте професійну інформацію та докази актуальними.",
    addTitle: "Додайте професійну назву або ремісничий напрям",
    addLocation: "Додайте публічне місто або регіон",
    addSkills: "Додайте професійні навички",
    addExperience: "Додайте досвід або кваліфікації",
    addEvidence: "Пов’яжіть підтвердні матеріали",
    reviewPublish: "Перевірте приватність і опублікуйте",
    maintain: "Перегляньте опублікований запис і підтримуйте його актуальним",
    status: "Статус",
    location: "Місце",
    notSet: "Не вказано",
    next: "Наступні кроки",
    profile: "Профіль",
    profileText: "Керуйте інформацією, що описує вас або вашу майстерню.",
    skills: "Навички та твердження",
    skillsText: "Формуйте структуровані твердження про навички, досвід і кваліфікації.",
    evidence: "Докази",
    evidenceText: "Керуйте приватними підтвердними матеріалами, пов’язаними з окремими твердженнями.",
    privacy: "Приватність",
    privacyText: "Оберіть, що буде публічним і наскільки точно може відображатися ваше місцезнаходження.",
    public: "Публічний профіль",
    publicText: "Перегляньте запис до публікації або перевірте його актуальну публічну версію.",
    requests: "Запити на контакт",
    requestsText: "Переглядайте контрольовані звернення без публікації вашого приватного email або телефону.",
    referrals: "Інституційні можливості",
    referralsText: "Переглядайте запрошення до проєктів, партнерств, навчання та замовлень, передані через CraftID.",
    support: "Можливості та підтримка",
    supportText: "Вкажіть, які види фінансування, консультацій, навчання, партнерств та іншої підтримки для вас актуальні.",
    certificate: "Сертифікат запису CraftID",
    certificateText: "Випускайте та завантажуйте версійний сертифікат цього запису CraftID із публічним номером сертифіката та QR-перевіркою.",
    mark: "CraftID Mark",
    markText: "Використовуйте CraftID на вебсайті, картках виробів, вивісці майстерні та у друці. CraftID Mark ідентифікує запис CraftID, але не є сертифікацією або знаком якості.",
    open: "Відкрити",
    typeProfessional: "Професіонал",
    typeWorkshop: "Майстерня",
    draft: "Чернетка",
    published: "Опубліковано",
    suspended: "Призупинено",
    archived: "Архів",
    records: "Ваші записи CraftID",
    switch: "Перемкнути запис",
    createProfessional: "Створити CraftID професіонала",
    createWorkshop: "Створити CraftID майстерні",
    professionalCreated: "CraftID професіонала створено та пов’язано з записом майстерні.",
    workshopCreated: "CraftID майстерні створено та пов’язано з вашим професійним записом.",
    professionalExists: "У вас уже є активний CraftID професіонала.",
    workshopExists: "У вас уже є активний CraftID майстерні.",
    relationshipNote: "Персональний запис і майстерня залишаються окремими CraftID. Їхній зв’язок можна керувати без об’єднання професійних доказів.",
    account: "Обліковий запис",
    closeAccount: "Закрити обліковий запис CraftID",
    closeAccountText: "Ваші активні записи CraftID будуть негайно перенесені в архів і зникнуть з Registry, Discover та Map. Уже видані номери CraftID залишаться доступними як мінімальні історичні записи, щоб вироби й документи з цим номером можна було перевірити.",
    closeAccountRetention: "Публічні контакти, фото профілю та активні дані профілю більше не розкриватимуться. Номер CraftID ніколи не буде виданий іншій сутності. Якщо ви повернетеся та відновите цю ідентичність, буде відновлено той самий CraftID як чернетку, яку потрібно перевірити перед повторною публікацією.",
    closeConfirm: "Введіть «закрити» для підтвердження",
    closeKeyword: "закрити",
    closeButton: "Архівувати записи та закрити обліковий запис",
  },
} as const;

export default async function MyCraftIdPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];

  const { supabase, userId, entity, entities } = await getOwnedCraftId(sp.entity);
  if (!userId) redirect(`/login${localeQuery(locale)}`);
  if (sp.entity && !entity) redirect(`/my-craftid${localeQuery(locale)}`);
  if (!entity) redirect(`/onboarding${localeQuery(locale)}`);

  const entityIds = entities.map((item) => item.id);
  const [{ data: professionalProfiles }, { data: workshopProfiles }] = await Promise.all([
    entityIds.length
      ? supabase.from("professional_profiles").select("entity_id, display_name, professional_title, country_code, region, city").in("entity_id", entityIds)
      : Promise.resolve({ data: [] }),
    entityIds.length
      ? supabase.from("workshop_profiles").select("entity_id, display_name, craft_sector, country_code, region, city").in("entity_id", entityIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profiles = new Map<string, {
    display_name: string;
    professional_title?: string | null;
    craft_sector?: string | null;
    country_code?: string | null;
    region?: string | null;
    city?: string | null;
  }>();

  for (const profile of professionalProfiles ?? []) profiles.set(profile.entity_id, profile);
  for (const profile of workshopProfiles ?? []) profiles.set(profile.entity_id, profile);

  const record = profiles.get(entity.id) ?? null;
  const typeLabel = entity.entity_type === "professional" ? t.typeProfessional : t.typeWorkshop;

  const [{ count: skillCount }, { count: experienceCount }, { count: evidenceCount }] =
    await Promise.all([
      supabase.from("claims").select("id", { count: "exact", head: true }).eq("entity_id", entity.id).eq("claim_type", "skill"),
      supabase.from("claims").select("id", { count: "exact", head: true }).eq("entity_id", entity.id).in("claim_type", ["experience", "qualification"]),
      supabase.from("evidence_items").select("id", { count: "exact", head: true }).eq("owner_entity_id", entity.id),
    ]);

  const hasTitle = Boolean(record?.professional_title ?? record?.craft_sector);
  const hasLocation = Boolean(record?.city ?? record?.region ?? record?.country_code);
  const nextSteps: string[] = [];

  if (!hasTitle) nextSteps.push(t.addTitle);
  if (!hasLocation) nextSteps.push(t.addLocation);
  if (!skillCount) nextSteps.push(t.addSkills);
  if (!experienceCount) nextSteps.push(t.addExperience);
  if (!evidenceCount) nextSteps.push(t.addEvidence);
  if (entity.public_status !== "published") nextSteps.push(t.reviewPublish);
  if (!nextSteps.length && entity.public_status === "published") nextSteps.push(t.maintain);

  const selectedQuery = ownerWorkspaceQuery(locale, entity.id);
  const hasProfessional = entities.some((item) => item.entity_type === "professional");
  const hasWorkshop = entities.some((item) => item.entity_type === "workshop");

  return (
    <main className="recordPage dashboardPage">
      <div className="container">
        <div className="dashboardHeader">
          <div>
            <Link href={withLocale("/", locale)} className="brand">CraftID</Link>
            <div className="eyebrow dashboardEyebrow">{t.eyebrow}</div>
          </div>
          <div className="dashboardActions">
            <LanguageMenu
              locale={locale}
              pathname={`/my-craftid?entity=${entity.id}`}
            />
            <form action={logout}>
              <input type="hidden" name="lang" value={locale} />
              <button className="button" type="submit">{t.signOut}</button>
            </form>
          </div>
        </div>

        <section className="entitySwitcher">
          <div>
            <div className="eyebrow">{t.records}</div>
            <p>{t.relationshipNote}</p>
          </div>
          <div className="entitySwitcherRecords" aria-label={t.switch}>
            {entities.map((item) => {
              const itemProfile = profiles.get(item.id);
              const active = item.id === entity.id;
              return (
                <Link
                  className={active ? "entitySwitchCard active" : "entitySwitchCard"}
                  href={`/my-craftid${ownerWorkspaceQuery(locale, item.id)}`}
                  key={item.id}
                >
                  <span>{item.entity_type === "professional" ? t.typeProfessional : t.typeWorkshop}</span>
                  <strong>{itemProfile?.display_name ?? t.recordFallback}</strong>
                  <small>CraftID #{formatCraftId(item.craftid_number, item.craftid_check_digits)}</small>
                </Link>
              );
            })}
            {!hasProfessional ? (
              <form action={createAdditionalCraftId}>
                <input type="hidden" name="lang" value={locale} />
                <input type="hidden" name="entityType" value="professional" />
                <button className="entitySwitchCard entitySwitchCreate" type="submit">
                  <span>+</span>
                  <strong>{t.createProfessional}</strong>
                </button>
              </form>
            ) : null}
            {!hasWorkshop ? (
              <form action={createAdditionalCraftId}>
                <input type="hidden" name="lang" value={locale} />
                <input type="hidden" name="entityType" value="workshop" />
                <button className="entitySwitchCard entitySwitchCreate" type="submit">
                  <span>+</span>
                  <strong>{t.createWorkshop}</strong>
                </button>
              </form>
            ) : null}
          </div>
        </section>

        {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
        {sp.message === "professional_created" ? <p className="formMessage">{t.professionalCreated}</p> : null}
        {sp.message === "workshop_created" ? <p className="formMessage">{t.workshopCreated}</p> : null}
        {sp.message === "professional_exists" ? <p className="formMessage">{t.professionalExists}</p> : null}
        {sp.message === "workshop_exists" ? <p className="formMessage">{t.workshopExists}</p> : null}

        <div className="recordTopbar">
          <div>
            <span className="recordType">{typeLabel}</span>
            <h1 className="craftIdNumberHeading">
              <span className="craftIdNumberLabel">CraftID</span>
              <span className="craftIdNumberValue">
                #{formatCraftId(entity.craftid_number, entity.craftid_check_digits)}
              </span>
            </h1>
          </div>
          <div className="dashboardStatus">
            <span>{t.status}</span>
            <strong>{t[entity.public_status as keyof typeof t] ?? entity.public_status}</strong>
          </div>
        </div>

        <div className="recordGrid">
          <section className="recordPrimary">
            <h2>{record?.display_name ?? t.recordFallback}</h2>
            <p>
              {record?.professional_title ??
                record?.craft_sector ??
                (entity.public_status === "published" ? t.current : t.complete)}
            </p>
            <div className="recordMeta">
              <span>{t.location}: {[record?.city, record?.region, record?.country_code].filter(Boolean).join(", ") || t.notSet}</span>
            </div>
          </section>
          <aside className="recordAside">
            <div className="eyebrow">{t.next}</div>
            <ol>{nextSteps.map((step) => <li key={step}>{step}</li>)}</ol>
          </aside>
        </div>

        <section className="dashboardModules">
          {[
            [t.profile, t.profileText, "/my-craftid/profile"],
            [t.skills, t.skillsText, "/my-craftid/claims"],
            [t.evidence, t.evidenceText, "/my-craftid/evidence"],
            [t.privacy, t.privacyText, "/my-craftid/privacy"],
            [t.public, t.publicText, "/my-craftid/preview"],
            [t.requests, t.requestsText, "/my-craftid/requests"],
            [t.referrals, t.referralsText, "/my-craftid/referrals"],
            [t.support, t.supportText, "/my-craftid/support"],
            [t.certificate, t.certificateText, "/my-craftid/certificate"],
            [t.mark, t.markText, "/my-craftid/mark"],
          ].map(([title, text, href], index) => (
            <article className="dashboardModule" key={title}>
              <span className="choiceIndex">{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <Link href={`${href}${selectedQuery}`}>{t.open} →</Link>
            </article>
          ))}
        </section>

        <section className="accountClosureSection">
          <div>
            <div className="eyebrow">{t.account}</div>
            <h2>{t.closeAccount}</h2>
            <p>{t.closeAccountText}</p>
            <p className="privacyNote">{t.closeAccountRetention}</p>
          </div>
          <form className="accountClosureForm" action={closeCraftIdAccount}>
            <input type="hidden" name="lang" value={locale} />
            <label>
              {t.closeConfirm}
              <input
                name="confirmation"
                autoComplete="off"
                placeholder={t.closeKeyword}
                required
              />
            </label>
            <button className="button dangerButton" type="submit">{t.closeButton}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
