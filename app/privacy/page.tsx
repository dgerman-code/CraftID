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
  fr: {
    eyebrow: "Confidentialité",
    title: "Visibilité professionnelle sans exposition inutile.",
    intro: "CraftID est conçu pour séparer le dossier professionnel public des preuves privées et des données de compte.",
    principles: [
      ["Minimisation des données", "Collecter uniquement les informations nécessaires au fonctionnement du dossier professionnel, à l’examen des preuves et aux fonctions pertinentes de la plateforme."],
      ["Preuves privées par défaut", "Les fichiers de preuve bruts sont conservés de manière privée et ne sont pas automatiquement exposés dans les profils publics."],
      ["Contrôle de la localisation", "Les professionnels peuvent choisir une visibilité au niveau du pays, de la région ou de la ville. Une localisation exacte n’est prévue que pour des locaux professionnels publics appropriés."],
      ["Limitation des finalités", "Les données ne doivent pas être réutilisées à des fins incompatibles sans base juridique et gouvernance transparente."],
      ["Contrôle du compte", "Les titulaires de profils gèrent les informations descriptives et les paramètres de visibilité, sous réserve des exigences d’intégrité, d’audit et d’examen de la plateforme."],
      ["Usage institutionnel", "Toute future analyse agrégée doit respecter la confidentialité, le traitement licite et une gouvernance claire, sans exposer les données privées individuelles."],
    ],
    note: "Cette page explique le modèle de confidentialité du produit et ne remplace pas la notice juridique définitive, qui devra être finalisée avant le lancement public.",
  },
  de: {
    eyebrow: "Datenschutz",
    title: "Berufliche Sichtbarkeit ohne unnötige Offenlegung.",
    intro: "CraftID ist so konzipiert, dass ein öffentlicher beruflicher Datensatz von privaten Nachweisen und Kontodaten getrennt bleibt.",
    principles: [
      ["Datenminimierung", "Nur Informationen erheben, die für den beruflichen Datensatz, die Prüfung von Nachweisen und relevante Plattformfunktionen erforderlich sind."],
      ["Nachweise standardmäßig privat", "Rohdateien mit Nachweisen werden privat gespeichert und nicht automatisch über öffentliche Profile veröffentlicht."],
      ["Kontrolle des Standorts", "Professionals können Sichtbarkeit auf Landes-, Regions- oder Stadtebene wählen. Ein genauer Standort ist nur für geeignete öffentlich zugängliche Geschäftsräume vorgesehen."],
      ["Zweckbindung", "Daten sollen ohne Rechtsgrundlage und transparente Governance nicht für unvereinbare Zwecke wiederverwendet werden."],
      ["Kontokontrolle", "Profilinhaber verwalten beschreibende Informationen und Sichtbarkeitseinstellungen unter Beachtung der Anforderungen an Integrität, Audit und Prüfung."],
      ["Institutionelle Nutzung", "Zukünftige aggregierte Analysen sollen Datenschutz, rechtmäßige Verarbeitung und klare Governance wahren, statt individuelle private Daten offenzulegen."],
    ],
    note: "Diese Seite erläutert das Datenschutzmodell des Produkts und ersetzt nicht die endgültige rechtliche Datenschutzerklärung, die vor dem öffentlichen Start fertiggestellt werden muss.",
  },
  nl: {
    eyebrow: "Privacy",
    title: "Professionele zichtbaarheid zonder onnodige blootstelling.",
    intro: "CraftID is ontworpen om een openbaar professioneel dossier te scheiden van privébewijs en accountgegevens.",
    principles: [
      ["Dataminimalisatie", "Verzamel alleen informatie die nodig is voor het professionele dossier, de beoordeling van bewijs en relevante platformfuncties."],
      ["Bewijs standaard privé", "Ruwe bewijsbestanden worden privé opgeslagen en niet automatisch via openbare profielen gedeeld."],
      ["Controle over locatie", "Professionals kunnen zichtbaarheid op land-, regio- of stadsniveau gebruiken. Een exacte locatie is alleen bedoeld voor passende openbare bedrijfsruimten."],
      ["Doelbinding", "Gegevens mogen niet voor onverenigbare doeleinden worden hergebruikt zonder rechtsgrond en transparante governance."],
      ["Accountcontrole", "Profieleigenaren beheren beschrijvende informatie en zichtbaarheidsinstellingen, binnen de vereisten voor platformintegriteit, audit en beoordeling."],
      ["Institutioneel gebruik", "Toekomstige geaggregeerde analyses moeten privacy, rechtmatige verwerking en duidelijke governance respecteren en geen individuele privégegevens blootleggen."],
    ],
    note: "Deze pagina legt het privacy-model van het product uit en vervangt niet de definitieve juridische privacyverklaring die vóór de publieke lancering moet worden afgerond.",
  },
  pl: {
    eyebrow: "Prywatność",
    title: "Widoczność zawodowa bez zbędnego ujawniania danych.",
    intro: "CraftID jest projektowany tak, aby oddzielać publiczny zapis zawodowy od prywatnych dowodów i danych konta.",
    principles: [
      ["Minimalizacja danych", "Zbieraj tylko informacje potrzebne do obsługi zapisu zawodowego, przeglądu dowodów i odpowiednich funkcji platformy."],
      ["Dowody domyślnie prywatne", "Surowe pliki dowodowe są przechowywane prywatnie i nie są automatycznie udostępniane w profilach publicznych."],
      ["Kontrola lokalizacji", "Profesjonaliści mogą wybrać widoczność na poziomie kraju, regionu lub miasta. Dokładna lokalizacja jest przeznaczona wyłącznie dla odpowiednich publicznych miejsc prowadzenia działalności."],
      ["Ograniczenie celu", "Dane nie powinny być wykorzystywane do niepowiązanych celów bez podstawy prawnej i przejrzystego zarządzania."],
      ["Kontrola konta", "Właściciele profili zarządzają informacjami opisowymi i ustawieniami widoczności z uwzględnieniem wymogów integralności, audytu i przeglądu."],
      ["Wykorzystanie instytucjonalne", "Przyszłe analizy zagregowane powinny respektować prywatność, legalne przetwarzanie i jasne zasady zarządzania, a nie ujawniać prywatne dane osób."],
    ],
    note: "Ta strona wyjaśnia model prywatności produktu i nie zastępuje ostatecznej prawnej informacji o prywatności, która musi zostać ukończona przed publicznym uruchomieniem.",
  },
  it: {
    eyebrow: "Privacy",
    title: "Visibilità professionale senza esposizione non necessaria.",
    intro: "CraftID è progettato per separare un record professionale pubblico dalle evidenze private e dai dati dell’account.",
    principles: [
      ["Minimizzazione dei dati", "Raccogliere solo le informazioni necessarie per gestire il record professionale, revisionare le evidenze e fornire le funzioni pertinenti della piattaforma."],
      ["Evidenze private per impostazione predefinita", "I file grezzi delle evidenze sono conservati in forma privata e non vengono esposti automaticamente attraverso i profili pubblici."],
      ["Controllo della posizione", "I professionisti possono scegliere visibilità a livello di paese, regione o città. La posizione esatta è prevista solo per sedi professionali pubbliche appropriate."],
      ["Limitazione della finalità", "I dati non devono essere riutilizzati per finalità non compatibili senza una base giuridica e una governance trasparente."],
      ["Controllo dell’account", "I titolari dei profili gestiscono informazioni descrittive e impostazioni di visibilità nel rispetto dei requisiti di integrità, audit e revisione della piattaforma."],
      ["Uso istituzionale", "Eventuali future analisi aggregate devono rispettare privacy, liceità del trattamento e governance chiara, senza esporre dati privati individuali."],
    ],
    note: "Questa pagina spiega il modello di privacy del prodotto e non sostituisce l’informativa legale definitiva, che dovrà essere completata prima del lancio pubblico.",
  },
  es: {
    eyebrow: "Privacidad",
    title: "Visibilidad profesional sin exposición innecesaria.",
    intro: "CraftID está diseñado para separar el registro profesional público de las evidencias privadas y los datos de la cuenta.",
    principles: [
      ["Minimización de datos", "Recopilar solo la información necesaria para operar el registro profesional, revisar evidencias y ofrecer funciones pertinentes de la plataforma."],
      ["Evidencias privadas por defecto", "Los archivos de evidencia originales se almacenan de forma privada y no se exponen automáticamente mediante perfiles públicos."],
      ["Control de ubicación", "Los profesionales pueden utilizar visibilidad a nivel de país, región o ciudad. La ubicación exacta se reserva para locales empresariales públicos cuando sea apropiado."],
      ["Limitación de finalidad", "Los datos no deben reutilizarse para fines incompatibles sin base jurídica y gobernanza transparente."],
      ["Control de la cuenta", "Los titulares del perfil gestionan la información descriptiva y los ajustes de visibilidad, sujetos a requisitos de integridad, auditoría y revisión de la plataforma."],
      ["Uso institucional", "Cualquier análisis agregado futuro debe respetar la privacidad, el tratamiento lícito y una gobernanza clara, sin exponer datos privados individuales."],
    ],
    note: "Esta página explica el modelo de privacidad del producto y no sustituye el aviso legal definitivo de privacidad, que deberá completarse antes del lanzamiento público.",
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
