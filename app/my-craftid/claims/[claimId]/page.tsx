import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { saveSkillProfile } from "./actions";
import { localeQuery } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ claimId: string }>;
  searchParams: Promise<{ lang?: string; entity?: string; error?: string; message?: string }>;
};

const optionLabels = {
  en: {
    rarely: "Rarely", regularly: "Regularly", core: "Core part of my practice", main_activity: "Main professional activity",
    active: "Currently practising", occasional: "Practised occasionally", temporarily_inactive: "Temporarily inactive", no_longer_active: "No longer practising",
    lt_1: "Less than 1 year", "1_3": "1–3 years", "4_7": "4–7 years", "8_15": "8–15 years", "15_plus": "15+ years",
    fully_handmade: "Entirely handmade", hand_tools: "Handmade using hand tools", machine_assisted_hand_defined: "Machine-assisted, but hand work determines the result",
    mostly_mechanised_with_hand_finishing: "Mostly mechanised/digital with hand finishing", digital_design_handmade: "Digital design with manual production",
    none: "Do not use", regular: "Regularly",
    non_commercial: "Non-commercial", occasional_paid: "Occasional paid work", regular_paid: "Regular paid work", main_income: "Main source of income",
    no: "No", yes: "Yes", with_support: "Yes, with support", not_applicable: "Not applicable",
    informal: "Informally", mentor: "As a mentor", apprenticeship: "Through apprenticeship", structured_training: "Through structured training",
  },
  fr: {
    rarely: "Rarement", regularly: "Régulièrement", core: "Élément central de ma pratique", main_activity: "Activité professionnelle principale",
    active: "Pratiquée actuellement", occasional: "Pratiquée occasionnellement", temporarily_inactive: "Temporairement inactive", no_longer_active: "Plus pratiquée",
    lt_1: "Moins d’un an", "1_3": "1–3 ans", "4_7": "4–7 ans", "8_15": "8–15 ans", "15_plus": "15 ans et plus",
    fully_handmade: "Entièrement fait main", hand_tools: "Fait main avec des outils manuels", machine_assisted_hand_defined: "Assisté par machine, mais le travail manuel détermine le résultat",
    mostly_mechanised_with_hand_finishing: "Principalement mécanisé/numérique avec finition manuelle", digital_design_handmade: "Conception numérique avec production manuelle",
    none: "Je n’utilise pas", regular: "Régulièrement",
    non_commercial: "Non commercial", occasional_paid: "Travail rémunéré occasionnel", regular_paid: "Travail rémunéré régulier", main_income: "Source principale de revenus",
    no: "Non", yes: "Oui", with_support: "Oui, avec soutien", not_applicable: "Non applicable",
    informal: "De manière informelle", mentor: "Comme mentor", apprenticeship: "Par apprentissage", structured_training: "Par formation structurée",
  },
  de: {
    rarely: "Selten", regularly: "Regelmäßig", core: "Kernbestandteil meiner Tätigkeit", main_activity: "Hauptberufliche Tätigkeit",
    active: "Derzeit aktiv ausgeübt", occasional: "Gelegentlich ausgeübt", temporarily_inactive: "Vorübergehend inaktiv", no_longer_active: "Nicht mehr ausgeübt",
    lt_1: "Weniger als 1 Jahr", "1_3": "1–3 Jahre", "4_7": "4–7 Jahre", "8_15": "8–15 Jahre", "15_plus": "15+ Jahre",
    fully_handmade: "Vollständig handgefertigt", hand_tools: "Handgefertigt mit Handwerkzeugen", machine_assisted_hand_defined: "Maschinenunterstützt, aber Handarbeit bestimmt das Ergebnis",
    mostly_mechanised_with_hand_finishing: "Überwiegend mechanisiert/digital mit manueller Endbearbeitung", digital_design_handmade: "Digitales Design mit manueller Herstellung",
    none: "Nutze ich nicht", regular: "Regelmäßig",
    non_commercial: "Nicht kommerziell", occasional_paid: "Gelegentliche bezahlte Arbeit", regular_paid: "Regelmäßige bezahlte Arbeit", main_income: "Haupteinnahmequelle",
    no: "Nein", yes: "Ja", with_support: "Ja, mit Unterstützung", not_applicable: "Nicht zutreffend",
    informal: "Informell", mentor: "Als Mentor/in", apprenticeship: "Durch Ausbildung/Lehre", structured_training: "Durch strukturierte Schulung",
  },
  nl: {
    rarely: "Zelden", regularly: "Regelmatig", core: "Kernonderdeel van mijn praktijk", main_activity: "Belangrijkste professionele activiteit",
    active: "Momenteel actief beoefend", occasional: "Af en toe beoefend", temporarily_inactive: "Tijdelijk inactief", no_longer_active: "Niet meer beoefend",
    lt_1: "Minder dan 1 jaar", "1_3": "1–3 jaar", "4_7": "4–7 jaar", "8_15": "8–15 jaar", "15_plus": "15+ jaar",
    fully_handmade: "Volledig handgemaakt", hand_tools: "Handgemaakt met handgereedschap", machine_assisted_hand_defined: "Machineondersteund, maar handwerk bepaalt het resultaat",
    mostly_mechanised_with_hand_finishing: "Voornamelijk gemechaniseerd/digitaal met handmatige afwerking", digital_design_handmade: "Digitaal ontwerp met handmatige productie",
    none: "Gebruik ik niet", regular: "Regelmatig",
    non_commercial: "Niet-commercieel", occasional_paid: "Incidenteel betaald werk", regular_paid: "Regelmatig betaald werk", main_income: "Belangrijkste inkomstenbron",
    no: "Nee", yes: "Ja", with_support: "Ja, met ondersteuning", not_applicable: "Niet van toepassing",
    informal: "Informeel", mentor: "Als mentor", apprenticeship: "Via leertijd", structured_training: "Via gestructureerde opleiding",
  },
  pl: {
    rarely: "Rzadko", regularly: "Regularnie", core: "Kluczowa część mojej praktyki", main_activity: "Główna działalność zawodowa",
    active: "Obecnie praktykuję", occasional: "Praktykuję okazjonalnie", temporarily_inactive: "Tymczasowo nieaktywna", no_longer_active: "Już nie praktykuję",
    lt_1: "Mniej niż 1 rok", "1_3": "1–3 lata", "4_7": "4–7 lat", "8_15": "8–15 lat", "15_plus": "15+ lat",
    fully_handmade: "W całości wykonane ręcznie", hand_tools: "Wykonywane ręcznie z użyciem narzędzi ręcznych", machine_assisted_hand_defined: "Wspomagane maszynowo, ale praca ręczna decyduje o rezultacie",
    mostly_mechanised_with_hand_finishing: "Głównie zmechanizowane/cyfrowe z ręcznym wykończeniem", digital_design_handmade: "Projektowanie cyfrowe z ręczną produkcją",
    none: "Nie używam", regular: "Regularnie",
    non_commercial: "Niekomercyjne", occasional_paid: "Okazjonalna praca płatna", regular_paid: "Regularna praca płatna", main_income: "Główne źródło dochodu",
    no: "Nie", yes: "Tak", with_support: "Tak, przy wsparciu", not_applicable: "Nie dotyczy",
    informal: "Nieformalnie", mentor: "Jako mentor", apprenticeship: "Poprzez praktykę/terminowanie", structured_training: "Poprzez zorganizowane szkolenie",
  },
  it: {
    rarely: "Raramente", regularly: "Regolarmente", core: "Parte centrale della mia pratica", main_activity: "Attività professionale principale",
    active: "Praticata attualmente", occasional: "Praticata occasionalmente", temporarily_inactive: "Temporaneamente inattiva", no_longer_active: "Non più praticata",
    lt_1: "Meno di 1 anno", "1_3": "1–3 anni", "4_7": "4–7 anni", "8_15": "8–15 anni", "15_plus": "15+ anni",
    fully_handmade: "Interamente fatto a mano", hand_tools: "Fatto a mano con utensili manuali", machine_assisted_hand_defined: "Assistito da macchine, ma il lavoro manuale determina il risultato",
    mostly_mechanised_with_hand_finishing: "Prevalentemente meccanizzato/digitale con finitura manuale", digital_design_handmade: "Progettazione digitale con produzione manuale",
    none: "Non utilizzo", regular: "Regolarmente",
    non_commercial: "Non commerciale", occasional_paid: "Lavoro retribuito occasionale", regular_paid: "Lavoro retribuito regolare", main_income: "Principale fonte di reddito",
    no: "No", yes: "Sì", with_support: "Sì, con supporto", not_applicable: "Non applicabile",
    informal: "Informalmente", mentor: "Come mentor", apprenticeship: "Tramite apprendistato", structured_training: "Tramite formazione strutturata",
  },
  es: {
    rarely: "Raramente", regularly: "Regularmente", core: "Parte central de mi práctica", main_activity: "Actividad profesional principal",
    active: "La practico actualmente", occasional: "La practico ocasionalmente", temporarily_inactive: "Temporalmente inactiva", no_longer_active: "Ya no la practico",
    lt_1: "Menos de 1 año", "1_3": "1–3 años", "4_7": "4–7 años", "8_15": "8–15 años", "15_plus": "15+ años",
    fully_handmade: "Totalmente hecho a mano", hand_tools: "Hecho a mano con herramientas manuales", machine_assisted_hand_defined: "Asistido por máquina, pero el trabajo manual determina el resultado",
    mostly_mechanised_with_hand_finishing: "Principalmente mecanizado/digital con acabado manual", digital_design_handmade: "Diseño digital con producción manual",
    none: "No utilizo", regular: "Regularmente",
    non_commercial: "No comercial", occasional_paid: "Trabajo remunerado ocasional", regular_paid: "Trabajo remunerado regular", main_income: "Principal fuente de ingresos",
    no: "No", yes: "Sí", with_support: "Sí, con apoyo", not_applicable: "No aplicable",
    informal: "De forma informal", mentor: "Como mentor", apprenticeship: "Mediante aprendizaje", structured_training: "Mediante formación estructurada",
  },
  uk: {
    rarely: "Рідко", regularly: "Регулярно", core: "Основна частина моєї практики", main_activity: "Головна професійна діяльність",
    active: "Практикую зараз", occasional: "Практикую час від часу", temporarily_inactive: "Тимчасово не практикую", no_longer_active: "Більше не практикую",
    lt_1: "Менше 1 року", "1_3": "1–3 роки", "4_7": "4–7 років", "8_15": "8–15 років", "15_plus": "15+ років",
    fully_handmade: "Повністю ручне виготовлення", hand_tools: "Ручне виготовлення з ручним інструментом", machine_assisted_hand_defined: "З використанням станків, але ручна робота визначає результат",
    mostly_mechanised_with_hand_finishing: "Переважно механізоване/цифрове виготовлення з ручною доводкою", digital_design_handmade: "Цифрове проєктування + ручне виготовлення",
    none: "Не використовую", regular: "Регулярно",
    non_commercial: "Некомерційне використання", occasional_paid: "Епізодична оплачувана робота", regular_paid: "Регулярна оплачувана робота", main_income: "Основне джерело доходу",
    no: "Ні", yes: "Так", with_support: "Так, за наявності підтримки", not_applicable: "Не застосовується",
    informal: "Неформально", mentor: "Як ментор", apprenticeship: "Через учнівство", structured_training: "Через структуроване навчання",
  },
} as const;

const copy = {
  en: {
    eyebrow: "Skill profile", back: "Back to Skills & Claims", title: "Describe how this skill is practised.",
    intro: "These answers strengthen CraftID intelligence while remaining clearly marked as self-declared unless later supported by evidence or review.",
    provenance: "Current provenance: self-declared", save: "Save answers", saved: "Skill profile saved.", chooseAnswer: "Choose an answer",
    questions: {
      "skill.usage_intensity": "How central is this skill to your current practice?",
      "skill.practice_status": "Do you currently practise this skill?",
      "skill.years_band": "How long have you practised this skill?",
      "skill.production_archetype": "How is work using this skill mainly performed?",
      "skill.digital_design_intensity": "How much do you use digital design with this skill?",
      "skill.digital_fabrication_intensity": "How much do you use digital fabrication with this skill?",
      "skill.repair_restoration_role": "What role does repair or restoration play?",
      "skill.commercial_relevance": "How commercially important is this skill?",
      "skill.apprenticeship_capacity": "Could you take an apprentice for this skill?",
      "skill.successor_status": "Is there an identified successor for this skill?",
      "skill.teaching_capacity": "Can you teach or transfer this skill?",
    },
  },
  fr: {
    eyebrow: "Profil de compétence", back: "Retour à Compétences et déclarations", title: "Décrivez comment cette compétence est pratiquée.",
    intro: "Ces réponses renforcent l’intelligence CraftID tout en restant clairement identifiées comme autodéclarées tant qu’elles ne sont pas étayées par des preuves ou un examen.",
    provenance: "Provenance actuelle : autodéclarée", save: "Enregistrer les réponses", saved: "Profil de compétence enregistré.", chooseAnswer: "Choisissez une réponse",
    questions: {
      "skill.usage_intensity": "Quelle place cette compétence occupe-t-elle dans votre pratique actuelle ?",
      "skill.practice_status": "Pratiquez-vous actuellement cette compétence ?",
      "skill.years_band": "Depuis combien de temps pratiquez-vous cette compétence ?",
      "skill.production_archetype": "Comment le travail utilisant cette compétence est-il principalement réalisé ?",
      "skill.digital_design_intensity": "Dans quelle mesure utilisez-vous la conception numérique avec cette compétence ?",
      "skill.digital_fabrication_intensity": "Dans quelle mesure utilisez-vous la fabrication numérique avec cette compétence ?",
      "skill.repair_restoration_role": "Quel rôle jouent la réparation ou la restauration ?",
      "skill.commercial_relevance": "Quelle est l’importance commerciale de cette compétence ?",
      "skill.apprenticeship_capacity": "Pourriez-vous accueillir un apprenti pour cette compétence ?",
      "skill.successor_status": "Un successeur est-il identifié pour cette compétence ?",
      "skill.teaching_capacity": "Pouvez-vous enseigner ou transmettre cette compétence ?",
    },
  },
  de: {
    eyebrow: "Kompetenzprofil", back: "Zurück zu Kompetenzen & Angaben", title: "Beschreiben Sie, wie Sie diese Kompetenz ausüben.",
    intro: "Diese Antworten stärken die CraftID-Intelligence und bleiben klar als Selbstauskunft gekennzeichnet, solange sie nicht später durch Nachweise oder Prüfung gestützt werden.",
    provenance: "Aktuelle Herkunft: Selbstauskunft", save: "Antworten speichern", saved: "Kompetenzprofil gespeichert.", chooseAnswer: "Antwort auswählen",
    questions: {
      "skill.usage_intensity": "Wie zentral ist diese Kompetenz für Ihre aktuelle Tätigkeit?",
      "skill.practice_status": "Üben Sie diese Kompetenz derzeit aus?",
      "skill.years_band": "Wie lange üben Sie diese Kompetenz bereits aus?",
      "skill.production_archetype": "Wie wird Arbeit mit dieser Kompetenz hauptsächlich ausgeführt?",
      "skill.digital_design_intensity": "Wie stark nutzen Sie digitales Design bei dieser Kompetenz?",
      "skill.digital_fabrication_intensity": "Wie stark nutzen Sie digitale Fertigung bei dieser Kompetenz?",
      "skill.repair_restoration_role": "Welche Rolle spielen Reparatur oder Restaurierung?",
      "skill.commercial_relevance": "Wie wichtig ist diese Kompetenz wirtschaftlich?",
      "skill.apprenticeship_capacity": "Könnten Sie für diese Kompetenz eine/n Auszubildende/n aufnehmen?",
      "skill.successor_status": "Gibt es eine identifizierte Nachfolge für diese Kompetenz?",
      "skill.teaching_capacity": "Können Sie diese Kompetenz lehren oder weitergeben?",
    },
  },
  nl: {
    eyebrow: "Vaardigheidsprofiel", back: "Terug naar Vaardigheden & verklaringen", title: "Beschrijf hoe u deze vaardigheid beoefent.",
    intro: "Deze antwoorden versterken CraftID Intelligence en blijven duidelijk als zelfverklaard gemarkeerd totdat ze later met bewijs of beoordeling worden ondersteund.",
    provenance: "Huidige herkomst: zelfverklaard", save: "Antwoorden opslaan", saved: "Vaardigheidsprofiel opgeslagen.", chooseAnswer: "Kies een antwoord",
    questions: {
      "skill.usage_intensity": "Hoe centraal staat deze vaardigheid in uw huidige praktijk?",
      "skill.practice_status": "Beoefent u deze vaardigheid momenteel?",
      "skill.years_band": "Hoe lang beoefent u deze vaardigheid al?",
      "skill.production_archetype": "Hoe wordt werk met deze vaardigheid voornamelijk uitgevoerd?",
      "skill.digital_design_intensity": "In welke mate gebruikt u digitaal ontwerp bij deze vaardigheid?",
      "skill.digital_fabrication_intensity": "In welke mate gebruikt u digitale fabricage bij deze vaardigheid?",
      "skill.repair_restoration_role": "Welke rol spelen reparatie of restauratie?",
      "skill.commercial_relevance": "Hoe commercieel belangrijk is deze vaardigheid?",
      "skill.apprenticeship_capacity": "Zou u voor deze vaardigheid een leerling kunnen begeleiden?",
      "skill.successor_status": "Is er een opvolger voor deze vaardigheid geïdentificeerd?",
      "skill.teaching_capacity": "Kunt u deze vaardigheid onderwijzen of overdragen?",
    },
  },
  pl: {
    eyebrow: "Profil umiejętności", back: "Wróć do Umiejętności i deklaracje", title: "Opisz, jak praktykujesz tę umiejętność.",
    intro: "Te odpowiedzi wzmacniają CraftID Intelligence, pozostając wyraźnie oznaczone jako deklaracje własne, dopóki nie zostaną później poparte dowodami lub przeglądem.",
    provenance: "Aktualne pochodzenie danych: deklaracja własna", save: "Zapisz odpowiedzi", saved: "Profil umiejętności zapisany.", chooseAnswer: "Wybierz odpowiedź",
    questions: {
      "skill.usage_intensity": "Jak ważna jest ta umiejętność w Twojej obecnej praktyce?",
      "skill.practice_status": "Czy obecnie praktykujesz tę umiejętność?",
      "skill.years_band": "Jak długo praktykujesz tę umiejętność?",
      "skill.production_archetype": "Jak głównie wykonywana jest praca z wykorzystaniem tej umiejętności?",
      "skill.digital_design_intensity": "W jakim stopniu korzystasz z projektowania cyfrowego przy tej umiejętności?",
      "skill.digital_fabrication_intensity": "W jakim stopniu korzystasz z wytwarzania cyfrowego przy tej umiejętności?",
      "skill.repair_restoration_role": "Jaką rolę odgrywa naprawa lub restauracja?",
      "skill.commercial_relevance": "Jak ważna komercyjnie jest ta umiejętność?",
      "skill.apprenticeship_capacity": "Czy możesz przyjąć ucznia w zakresie tej umiejętności?",
      "skill.successor_status": "Czy zidentyfikowano następcę dla tej umiejętności?",
      "skill.teaching_capacity": "Czy możesz uczyć lub przekazywać tę umiejętność?",
    },
  },
  it: {
    eyebrow: "Profilo della competenza", back: "Torna a Competenze e dichiarazioni", title: "Descrivi come pratichi questa competenza.",
    intro: "Queste risposte rafforzano CraftID Intelligence restando chiaramente indicate come autodichiarate finché non saranno supportate da evidenze o revisione.",
    provenance: "Provenienza attuale: autodichiarata", save: "Salva risposte", saved: "Profilo della competenza salvato.", chooseAnswer: "Scegli una risposta",
    questions: {
      "skill.usage_intensity": "Quanto è centrale questa competenza nella tua pratica attuale?",
      "skill.practice_status": "Pratichi attualmente questa competenza?",
      "skill.years_band": "Da quanto tempo pratichi questa competenza?",
      "skill.production_archetype": "Come viene svolto principalmente il lavoro che utilizza questa competenza?",
      "skill.digital_design_intensity": "Quanto utilizzi la progettazione digitale con questa competenza?",
      "skill.digital_fabrication_intensity": "Quanto utilizzi la fabbricazione digitale con questa competenza?",
      "skill.repair_restoration_role": "Che ruolo hanno riparazione o restauro?",
      "skill.commercial_relevance": "Quanto è importante commercialmente questa competenza?",
      "skill.apprenticeship_capacity": "Potresti accogliere un apprendista per questa competenza?",
      "skill.successor_status": "È stato identificato un successore per questa competenza?",
      "skill.teaching_capacity": "Puoi insegnare o trasferire questa competenza?",
    },
  },
  es: {
    eyebrow: "Perfil de competencia", back: "Volver a Competencias y declaraciones", title: "Describe cómo practicas esta competencia.",
    intro: "Estas respuestas refuerzan CraftID Intelligence y permanecen claramente marcadas como autodeclaradas hasta que posteriormente se respalden con evidencias o revisión.",
    provenance: "Procedencia actual: autodeclarada", save: "Guardar respuestas", saved: "Perfil de competencia guardado.", chooseAnswer: "Elige una respuesta",
    questions: {
      "skill.usage_intensity": "¿Qué importancia tiene esta competencia en tu práctica actual?",
      "skill.practice_status": "¿Practicas actualmente esta competencia?",
      "skill.years_band": "¿Durante cuánto tiempo has practicado esta competencia?",
      "skill.production_archetype": "¿Cómo se realiza principalmente el trabajo que utiliza esta competencia?",
      "skill.digital_design_intensity": "¿En qué medida utilizas diseño digital con esta competencia?",
      "skill.digital_fabrication_intensity": "¿En qué medida utilizas fabricación digital con esta competencia?",
      "skill.repair_restoration_role": "¿Qué papel tienen la reparación o la restauración?",
      "skill.commercial_relevance": "¿Qué importancia comercial tiene esta competencia?",
      "skill.apprenticeship_capacity": "¿Podrías acoger a un aprendiz para esta competencia?",
      "skill.successor_status": "¿Hay un sucesor identificado para esta competencia?",
      "skill.teaching_capacity": "¿Puedes enseñar o transferir esta competencia?",
    },
  },
  uk: {
    eyebrow: "Профіль навички", back: "Назад до Навички та твердження", title: "Опишіть, як ви практикуєте цю навичку.",
    intro: "Ці відповіді підсилюють CraftID Intelligence, але залишаються чітко позначеними як самодекларовані, доки не будуть підтверджені доказами або перевіркою.",
    provenance: "Поточне походження даних: самодекларовано", save: "Зберегти відповіді", saved: "Профіль навички збережено.", chooseAnswer: "Оберіть відповідь",
    questions: {
      "skill.usage_intensity": "Наскільки ця навичка є центральною у вашій поточній практиці?",
      "skill.practice_status": "Чи практикуєте ви цю навичку зараз?",
      "skill.years_band": "Як довго ви практикуєте цю навичку?",
      "skill.production_archetype": "Як переважно виконується робота з цією навичкою?",
      "skill.digital_design_intensity": "Наскільки ви використовуєте цифрове проєктування?",
      "skill.digital_fabrication_intensity": "Наскільки ви використовуєте цифрове виготовлення?",
      "skill.repair_restoration_role": "Яку роль відіграє ремонт або реставрація?",
      "skill.commercial_relevance": "Яке комерційне значення має ця навичка?",
      "skill.apprenticeship_capacity": "Чи можете ви прийняти учня для цієї навички?",
      "skill.successor_status": "Чи є визначений наступник для цієї навички?",
      "skill.teaching_capacity": "Чи можете ви навчати або передавати цю навичку?",
    },
  },
} as const;

export default async function SkillProfilePage({ params, searchParams }: Props) {
  const { claimId } = await params;
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const labels = optionLabels[locale];
  const { supabase, userId, entity } = await getOwnedCraftId(sp.entity);
  if (!userId) redirect(`/login${localeQuery(locale)}`);
  if (!entity) redirect(`/my-craftid${localeQuery(locale)}`);
  const q = ownerWorkspaceQuery(locale, entity.id);

  const { data: claim } = await supabase
    .from("claims")
    .select("id, entity_id, title, taxonomy_term_id, claim_type")
    .eq("id", claimId)
    .eq("claim_type", "skill")
    .single();

  if (!claim) redirect(`/my-craftid/claims${q}`);

  if (claim.entity_id !== entity.id) redirect(`/my-craftid/claims${q}`);

  const [{ data: definitions }, { data: observations }] = await Promise.all([
    supabase
      .from("indicator_definition_versions")
      .select("id, indicator_key, label_en, label_uk, options, version, is_current, indicator_definitions!inner(scope, sort_order, is_active)")
      .eq("is_current", true)
      .eq("indicator_definitions.scope", "skill")
      .eq("indicator_definitions.is_active", true)
      .order("indicator_definitions(sort_order)"),
    supabase
      .from("current_observations")
      .select("indicator_key, value, provenance_status, observed_at")
      .eq("claim_id", claim.id),
  ]);

  const current = new Map((observations ?? []).map((o) => [o.indicator_key, String(o.value)]));

  return (
    <main className="workspacePage">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={`/my-craftid/claims${q}`}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{claim.title}</h1>
        <p className="workspaceIntro">{t.title}</p>
        <p className="privacyNote">{t.intro}</p>
        <div className="provenanceBadge">{t.provenance}</div>

        {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
        {sp.message ? <p className="formMessage">{t.saved}</p> : null}

        <form className="indicatorForm" action={saveSkillProfile}>
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="claimId" value={claim.id} />
          <input type="hidden" name="entityId" value={entity.id} />

          {definitions?.map((definition) => {
            const options = Array.isArray(definition.options) ? definition.options as string[] : [];
            return (
              <label className="indicatorQuestion" key={definition.id}>
                <span>{t.questions[definition.indicator_key as keyof typeof t.questions] ?? (locale === "uk" ? definition.label_uk : definition.label_en)}</span>
                <select name={definition.indicator_key} defaultValue={current.get(definition.indicator_key) ?? ""}>
                  <option value="">{t.chooseAnswer}</option>
                  {options.map((option) => (
                    <option value={option} key={option}>
                      {labels[option as keyof typeof labels] ?? option.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}

          <button className="button buttonPrimary" type="submit">{t.save}</button>
        </form>
      </div>
    </main>
  );
}
