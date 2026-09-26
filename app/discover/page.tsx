import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";
import { CraftSkillsMap } from "@/components/craft-skills-map";
import { resolvePublicMapCoordinate } from "@/lib/public-map";
import { formatCraftId, parseCraftId } from "@/lib/craftid-format";

type Props = {
  searchParams: Promise<{
    lang?: string;
    craftid?: string;
    q?: string;
    craft?: string;
    country?: string;
    type?: string;
    view?: string;
  }>;
};

type PublicClaim = {
  id: string;
  claim_type: string;
  title: string;
  status: string;
};

type PublicRecord = {
  craftid_number: number;
  craftid_check_digits: string;
  entity_type: "professional" | "workshop";
  display_name: string;
  professional_title: string | null;
  craft_sector: string | null;
  location: string | null;
  location_country_code: string | null;
  location_region: string | null;
  location_city: string | null;
  location_precision: "country" | "region" | "city" | null;
  about: string | null;
  has_public_photo: boolean;
  languages: string[];
  claims: PublicClaim[];
  links: { contact_type: string; value: string; verification_level: string }[];
};

function normalized(value?: string) {
  return (value ?? "").trim().toLocaleLowerCase();
}

async function loadAllPublishedEntityIdentifiers(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const pageSize = 500;
  const rows: { craftid_number: number; craftid_check_digits: string }[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("craftid_entities")
      .select("craftid_number, craftid_check_digits")
      .eq("public_status", "published")
      .order("craftid_number", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    const page = data ?? [];
    rows.push(...page);

    if (page.length < pageSize) break;
  }

  return rows;
}

const statusRank: Record<string, number> = {
  self_declared: 0,
  evidence_submitted: 1,
  document_reviewed: 2,
  evidence_reviewed: 3,
  external_source_confirmed: 4,
  identity_reviewed: 1,
};

function strongestClaimStatus(claims: PublicClaim[]) {
  const relevant = claims.filter((claim) => claim.claim_type !== "identity");
  if (!relevant.length) return null;
  return [...relevant].sort(
    (a, b) => (statusRank[b.status] ?? -1) - (statusRank[a.status] ?? -1),
  )[0]?.status ?? null;
}

const statusCopy = {
  en: {
    self_declared: "Self-declared",
    evidence_submitted: "Evidence submitted",
    document_reviewed: "Document reviewed",
    evidence_reviewed: "Evidence reviewed",
    external_source_confirmed: "External source confirmed",
    identity_reviewed: "Identity reviewed",
  },
  fr: { self_declared: "Autodéclaré", evidence_submitted: "Preuves soumises", document_reviewed: "Document examiné", evidence_reviewed: "Preuves examinées", external_source_confirmed: "Source externe confirmée", identity_reviewed: "Identité examinée" },
  de: { self_declared: "Selbst angegeben", evidence_submitted: "Nachweise eingereicht", document_reviewed: "Dokument geprüft", evidence_reviewed: "Nachweise geprüft", external_source_confirmed: "Externe Quelle bestätigt", identity_reviewed: "Identität geprüft" },
  nl: { self_declared: "Zelfverklaard", evidence_submitted: "Bewijs ingediend", document_reviewed: "Document beoordeeld", evidence_reviewed: "Bewijs beoordeeld", external_source_confirmed: "Externe bron bevestigd", identity_reviewed: "Identiteit beoordeeld" },
  pl: { self_declared: "Zadeklarowane samodzielnie", evidence_submitted: "Dowody złożone", document_reviewed: "Dokument przejrzany", evidence_reviewed: "Dowody przejrzane", external_source_confirmed: "Źródło zewnętrzne potwierdzone", identity_reviewed: "Tożsamość przejrzana" },
  it: { self_declared: "Autodichiarato", evidence_submitted: "Evidenze presentate", document_reviewed: "Documento revisionato", evidence_reviewed: "Evidenze revisionate", external_source_confirmed: "Fonte esterna confermata", identity_reviewed: "Identità revisionata" },
  es: { self_declared: "Autodeclarado", evidence_submitted: "Evidencias presentadas", document_reviewed: "Documento revisado", evidence_reviewed: "Evidencias revisadas", external_source_confirmed: "Fuente externa confirmada", identity_reviewed: "Identidad revisada" },
  uk: {
    self_declared: "Самодекларовано",
    evidence_submitted: "Докази подано",
    document_reviewed: "Документ переглянуто",
    evidence_reviewed: "Докази переглянуто",
    external_source_confirmed: "Зовнішнє джерело підтверджено",
    identity_reviewed: "Особу перевірено",
  },
} as const;

const copy = {
  en: {
    eyebrow: "Public registry",
    title: "Discover professional craft practice.",
    intro: "Find a specific CraftID record directly, or explore published professionals and workshops by craft, skill and location.",
    idEyebrow: "Direct CraftID lookup",
    idTitle: "Find a CraftID record",
    idText: "Use the permanent CraftID number to open a published professional or workshop record directly.",
    idLabel: "CraftID number",
    idPlaceholder: "#0000-0101-86",
    idButton: "Open record",
    idHint: "Enter the full CraftID number, including the two check digits.",
    idInvalid: "Enter a valid CraftID in the format #0000-0101-86.",
    idMissing: "No published CraftID record was found for that number.",
    browseEyebrow: "Browse registry",
    browseTitle: "Explore by professional context",
    note: "Public location is shown only at the level selected by the profile owner. Individual professionals default to city- or region-level visibility.",
    search: "Search registry",
    placeholder: "Name, craft or skill",
    craft: "Craft / skill",
    country: "Country",
    type: "Profile type",
    all: "All",
    professional: "Professional",
    workshop: "Workshop",
    results: "Published records",
    oneResult: "published record",
    manyResults: "published records",
    empty: "No published records match these filters.",
    clear: "Clear filters",
    open: "Open record",
    claimStatus: "Highest visible claim status",
    noClaimStatus: "No reviewed public claim",
    mapTitle: "Craft Skills Map",
    mapText: "Explore privacy-safe geographic aggregates of published CraftID records. Exact addresses are never shown, and small map groups are suppressed before data reaches the map client.",
    listView: "List",
    mapView: "Map",
    mapped: "map groups",
    mapPrivacy: "Map positions are approximate aggregates. The configured minimum disclosure threshold is enforced server-side.",
  },
  fr: {
    eyebrow: "Registre public", title: "Découvrez les pratiques artisanales professionnelles.",
    intro: "Trouvez directement un dossier CraftID précis ou explorez les professionnels et ateliers publiés par métier, compétence et localisation.",
    idEyebrow: "Recherche directe CraftID", idTitle: "Trouver un dossier CraftID",
    idText: "Utilisez le numéro CraftID permanent pour ouvrir directement un dossier Professional ou Workshop publié.",
    idLabel: "Numéro CraftID", idPlaceholder: "#0000-0101-86", idButton: "Ouvrir le dossier",
    idHint: "Saisissez le numéro CraftID complet, y compris les deux chiffres de contrôle.",
    idInvalid: "Saisissez un CraftID valide au format #0000-0101-86.", idMissing: "Aucun dossier CraftID publié n’a été trouvé pour ce numéro.",
    browseEyebrow: "Explorer le registre", browseTitle: "Explorer par contexte professionnel",
    note: "La localisation publique n’est affichée qu’au niveau choisi par le titulaire du profil. Pour les professionnels individuels, la visibilité est généralement limitée à la ville ou à la région.",
    search: "Rechercher dans le registre", placeholder: "Nom, métier ou compétence", craft: "Métier / compétence", country: "Pays", type: "Type de profil", all: "Tous",
    professional: "Professional", workshop: "Workshop", results: "Dossiers publiés", oneResult: "dossier publié", manyResults: "dossiers publiés",
    empty: "Aucun dossier publié ne correspond à ces filtres.", clear: "Effacer les filtres", open: "Ouvrir le dossier",
    claimStatus: "Statut le plus élevé d’une déclaration visible", noClaimStatus: "Aucune déclaration publique examinée",
    mapTitle: "Carte des compétences artisanales", mapText: "Explorez des agrégats géographiques respectueux de la confidentialité à partir des dossiers CraftID publiés. Les adresses exactes ne sont jamais affichées et les petits groupes sont supprimés avant que les données n’atteignent le client cartographique.",
    listView: "Liste", mapView: "Carte", mapped: "groupes cartographiques",
    mapPrivacy: "Les positions sont des agrégats approximatifs. Le seuil minimal de divulgation configuré est appliqué côté serveur.",
  },
  de: {
    eyebrow: "Öffentliches Register", title: "Entdecken Sie professionelle Handwerkspraxis.",
    intro: "Finden Sie einen bestimmten CraftID-Datensatz direkt oder durchsuchen Sie veröffentlichte Professionals und Werkstätten nach Handwerk, Kompetenz und Standort.",
    idEyebrow: "Direkte CraftID-Suche", idTitle: "CraftID-Datensatz finden",
    idText: "Verwenden Sie die dauerhafte CraftID-Nummer, um einen veröffentlichten Professional- oder Workshop-Datensatz direkt zu öffnen.",
    idLabel: "CraftID-Nummer", idPlaceholder: "#0000-0101-86", idButton: "Datensatz öffnen",
    idHint: "Geben Sie die vollständige CraftID-Nummer einschließlich der beiden Prüfziffern ein.",
    idInvalid: "Geben Sie eine gültige CraftID im Format #0000-0101-86 ein.", idMissing: "Für diese Nummer wurde kein veröffentlichter CraftID-Datensatz gefunden.",
    browseEyebrow: "Register durchsuchen", browseTitle: "Nach beruflichem Kontext erkunden",
    note: "Der öffentliche Standort wird nur mit der vom Profilinhaber gewählten Genauigkeit angezeigt. Bei einzelnen Professionals ist standardmäßig Stadt- oder Regionsebene vorgesehen.",
    search: "Register durchsuchen", placeholder: "Name, Handwerk oder Kompetenz", craft: "Handwerk / Kompetenz", country: "Land", type: "Profiltyp", all: "Alle",
    professional: "Professional", workshop: "Workshop", results: "Veröffentlichte Datensätze", oneResult: "veröffentlichter Datensatz", manyResults: "veröffentlichte Datensätze",
    empty: "Keine veröffentlichten Datensätze entsprechen diesen Filtern.", clear: "Filter löschen", open: "Datensatz öffnen",
    claimStatus: "Höchster sichtbarer Status einer Angabe", noClaimStatus: "Keine geprüfte öffentliche Angabe",
    mapTitle: "Karte der Handwerkskompetenzen", mapText: "Erkunden Sie datenschutzgerechte geografische Aggregate veröffentlichter CraftID-Datensätze. Genaue Adressen werden nie angezeigt; kleine Gruppen werden unterdrückt, bevor Daten den Kartenclient erreichen.",
    listView: "Liste", mapView: "Karte", mapped: "Kartengruppen",
    mapPrivacy: "Kartenpositionen sind ungefähre Aggregate. Der konfigurierte Mindestschwellenwert für Offenlegung wird serverseitig durchgesetzt.",
  },
  nl: {
    eyebrow: "Openbaar register", title: "Ontdek professionele ambachtelijke praktijk.",
    intro: "Vind een specifiek CraftID-dossier rechtstreeks of verken gepubliceerde professionals en werkplaatsen op ambacht, vaardigheid en locatie.",
    idEyebrow: "Direct CraftID zoeken", idTitle: "Vind een CraftID-dossier",
    idText: "Gebruik het permanente CraftID-nummer om rechtstreeks een gepubliceerd Professional- of Workshop-dossier te openen.",
    idLabel: "CraftID-nummer", idPlaceholder: "#0000-0101-86", idButton: "Dossier openen",
    idHint: "Voer het volledige CraftID-nummer in, inclusief de twee controlecijfers.",
    idInvalid: "Voer een geldige CraftID in volgens formaat #0000-0101-86.", idMissing: "Voor dit nummer is geen gepubliceerd CraftID-dossier gevonden.",
    browseEyebrow: "Register bekijken", browseTitle: "Verkennen op professionele context",
    note: "De openbare locatie wordt alleen getoond op het niveau dat de profieleigenaar kiest. Voor individuele professionals is standaard zichtbaarheid op stads- of regioniveau bedoeld.",
    search: "Register doorzoeken", placeholder: "Naam, ambacht of vaardigheid", craft: "Ambacht / vaardigheid", country: "Land", type: "Profieltype", all: "Alle",
    professional: "Professional", workshop: "Workshop", results: "Gepubliceerde dossiers", oneResult: "gepubliceerd dossier", manyResults: "gepubliceerde dossiers",
    empty: "Geen gepubliceerde dossiers voldoen aan deze filters.", clear: "Filters wissen", open: "Dossier openen",
    claimStatus: "Hoogste zichtbare claimstatus", noClaimStatus: "Geen beoordeelde openbare claim",
    mapTitle: "Kaart van ambachtelijke vaardigheden", mapText: "Verken privacyveilige geografische aggregaten van gepubliceerde CraftID-dossiers. Exacte adressen worden nooit getoond en kleine groepen worden onderdrukt voordat gegevens de kaartclient bereiken.",
    listView: "Lijst", mapView: "Kaart", mapped: "kaartgroepen",
    mapPrivacy: "Kaartposities zijn benaderde aggregaten. De ingestelde minimale openbaarmakingsdrempel wordt server-side afgedwongen.",
  },
  pl: {
    eyebrow: "Rejestr publiczny", title: "Odkrywaj profesjonalne praktyki rzemieślnicze.",
    intro: "Znajdź konkretny zapis CraftID bezpośrednio albo przeglądaj opublikowane profile profesjonalistów i pracowni według rzemiosła, umiejętności i lokalizacji.",
    idEyebrow: "Bezpośrednie wyszukiwanie CraftID", idTitle: "Znajdź zapis CraftID",
    idText: "Użyj stałego numeru CraftID, aby bezpośrednio otworzyć opublikowany zapis Professional lub Workshop.",
    idLabel: "Numer CraftID", idPlaceholder: "#0000-0101-86", idButton: "Otwórz zapis",
    idHint: "Wprowadź pełny numer CraftID wraz z dwiema cyframi kontrolnymi.",
    idInvalid: "Wprowadź prawidłowy CraftID w formacie #0000-0101-86.", idMissing: "Nie znaleziono opublikowanego zapisu CraftID o tym numerze.",
    browseEyebrow: "Przeglądaj rejestr", browseTitle: "Odkrywaj według kontekstu zawodowego",
    note: "Publiczna lokalizacja jest pokazywana tylko z dokładnością wybraną przez właściciela profilu. Dla indywidualnych profesjonalistów domyślny jest poziom miasta lub regionu.",
    search: "Szukaj w rejestrze", placeholder: "Imię, rzemiosło lub umiejętność", craft: "Rzemiosło / umiejętność", country: "Kraj", type: "Typ profilu", all: "Wszystkie",
    professional: "Professional", workshop: "Workshop", results: "Opublikowane zapisy", oneResult: "opublikowany zapis", manyResults: "opublikowane zapisy",
    empty: "Brak opublikowanych zapisów pasujących do tych filtrów.", clear: "Wyczyść filtry", open: "Otwórz zapis",
    claimStatus: "Najwyższy widoczny status deklaracji", noClaimStatus: "Brak przejrzanej publicznej deklaracji",
    mapTitle: "Mapa umiejętności rzemieślniczych", mapText: "Przeglądaj bezpieczne dla prywatności agregaty geograficzne opublikowanych zapisów CraftID. Dokładne adresy nigdy nie są pokazywane, a małe grupy są ukrywane zanim dane trafią do klienta mapy.",
    listView: "Lista", mapView: "Mapa", mapped: "grupy na mapie",
    mapPrivacy: "Pozycje na mapie są przybliżonymi agregatami. Skonfigurowany minimalny próg ujawnienia jest egzekwowany po stronie serwera.",
  },
  it: {
    eyebrow: "Registro pubblico", title: "Scopri la pratica artigianale professionale.",
    intro: "Trova direttamente uno specifico record CraftID oppure esplora professionisti e laboratori pubblicati per mestiere, competenza e località.",
    idEyebrow: "Ricerca diretta CraftID", idTitle: "Trova un record CraftID",
    idText: "Usa il numero CraftID permanente per aprire direttamente un record Professional o Workshop pubblicato.",
    idLabel: "Numero CraftID", idPlaceholder: "#0000-0101-86", idButton: "Apri record",
    idHint: "Inserisci il numero CraftID completo, comprese le due cifre di controllo.",
    idInvalid: "Inserisci un CraftID valido nel formato #0000-0101-86.", idMissing: "Non è stato trovato alcun record CraftID pubblicato per questo numero.",
    browseEyebrow: "Esplora il registro", browseTitle: "Esplora per contesto professionale",
    note: "La località pubblica viene mostrata solo al livello scelto dal titolare del profilo. Per i professionisti individuali la visibilità predefinita è a livello di città o regione.",
    search: "Cerca nel registro", placeholder: "Nome, mestiere o competenza", craft: "Mestiere / competenza", country: "Paese", type: "Tipo di profilo", all: "Tutti",
    professional: "Professional", workshop: "Workshop", results: "Record pubblicati", oneResult: "record pubblicato", manyResults: "record pubblicati",
    empty: "Nessun record pubblicato corrisponde a questi filtri.", clear: "Azzera filtri", open: "Apri record",
    claimStatus: "Stato più alto della dichiarazione visibile", noClaimStatus: "Nessuna dichiarazione pubblica revisionata",
    mapTitle: "Mappa delle competenze artigianali", mapText: "Esplora aggregati geografici rispettosi della privacy dei record CraftID pubblicati. Gli indirizzi esatti non vengono mai mostrati e i piccoli gruppi vengono soppressi prima che i dati raggiungano il client della mappa.",
    listView: "Elenco", mapView: "Mappa", mapped: "gruppi sulla mappa",
    mapPrivacy: "Le posizioni sono aggregati approssimativi. La soglia minima di divulgazione configurata viene applicata lato server.",
  },
  es: {
    eyebrow: "Registro público", title: "Descubre la práctica artesanal profesional.",
    intro: "Encuentra directamente un registro CraftID concreto o explora profesionales y talleres publicados por oficio, competencia y ubicación.",
    idEyebrow: "Búsqueda directa de CraftID", idTitle: "Encontrar un registro CraftID",
    idText: "Utiliza el número CraftID permanente para abrir directamente un registro Professional o Workshop publicado.",
    idLabel: "Número CraftID", idPlaceholder: "#0000-0101-86", idButton: "Abrir registro",
    idHint: "Introduce el número CraftID completo, incluidos los dos dígitos de control.",
    idInvalid: "Introduce un CraftID válido con el formato #0000-0101-86.", idMissing: "No se encontró ningún registro CraftID publicado para ese número.",
    browseEyebrow: "Explorar registro", browseTitle: "Explorar por contexto profesional",
    note: "La ubicación pública solo se muestra con el nivel elegido por el titular del perfil. Para profesionales individuales se utiliza por defecto visibilidad a nivel de ciudad o región.",
    search: "Buscar en el registro", placeholder: "Nombre, oficio o competencia", craft: "Oficio / competencia", country: "País", type: "Tipo de perfil", all: "Todos",
    professional: "Professional", workshop: "Workshop", results: "Registros publicados", oneResult: "registro publicado", manyResults: "registros publicados",
    empty: "Ningún registro publicado coincide con estos filtros.", clear: "Borrar filtros", open: "Abrir registro",
    claimStatus: "Estado más alto de una declaración visible", noClaimStatus: "No hay declaración pública revisada",
    mapTitle: "Mapa de competencias artesanales", mapText: "Explora agregados geográficos respetuosos con la privacidad de los registros CraftID publicados. Las direcciones exactas nunca se muestran y los grupos pequeños se suprimen antes de que los datos lleguen al cliente del mapa.",
    listView: "Lista", mapView: "Mapa", mapped: "grupos en el mapa",
    mapPrivacy: "Las posiciones del mapa son agregados aproximados. El umbral mínimo de divulgación configurado se aplica en el servidor.",
  },
  uk: {
    eyebrow: "Публічний реєстр",
    title: "Відкривайте професійну ремісничу практику.",
    intro: "Знайдіть конкретний запис CraftID за номером або переглядайте опубліковані профілі професіоналів і майстерень за ремеслом, навичками та місцем.",
    idEyebrow: "Прямий пошук CraftID",
    idTitle: "Знайти запис CraftID",
    idText: "Використовуйте постійний номер CraftID, щоб одразу відкрити опублікований запис професіонала або майстерні.",
    idLabel: "Номер CraftID",
    idPlaceholder: "#0000-0101-86",
    idButton: "Відкрити запис",
    idHint: "Введіть повний номер CraftID разом із двома контрольними цифрами.",
    idInvalid: "Введіть коректний CraftID у форматі #0000-0101-86.",
    idMissing: "Опублікований запис CraftID з таким номером не знайдено.",
    browseEyebrow: "Пошук у реєстрі",
    browseTitle: "Пошук за професійним контекстом",
    note: "Публічне місце відображається лише з точністю, обраною власником профілю. Для індивідуальних професіоналів типовим є рівень міста або регіону.",
    search: "Пошук у реєстрі",
    placeholder: "Ім’я, ремесло або навичка",
    craft: "Ремесло / навичка",
    country: "Країна",
    type: "Тип профілю",
    all: "Усі",
    professional: "Професіонал",
    workshop: "Майстерня",
    results: "Опубліковані записи",
    oneResult: "опублікований запис",
    manyResults: "опублікованих записів",
    empty: "За цими фільтрами опублікованих записів не знайдено.",
    clear: "Очистити фільтри",
    open: "Відкрити запис",
    claimStatus: "Найвищий статус видимого твердження",
    noClaimStatus: "Немає переглянутих публічних тверджень",
    mapTitle: "Карта ремісничих навичок",
    mapText: "Переглядайте приватно-безпечні географічні агрегати опублікованих записів CraftID. Точні адреси не показуються, а малі групи приховуються до передавання даних у клієнт карти.",
    listView: "Список",
    mapView: "Карта",
    mapped: "груп на карті",
    mapPrivacy: "Позиції на карті є приблизними агрегатами. Налаштований мінімальний поріг розкриття застосовується на сервері.",
  },
} as const;

export default async function DiscoverPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale];
  const q = locale === "en" ? "" : `?lang=${locale}`;
  const supabase = await createClient();
  let lookupError: string | null = null;

  if (params.craftid) {
    const parsed = parseCraftId(params.craftid);

    if (!parsed) {
      lookupError = t.idInvalid;
    } else {
      const { data: profile } = await supabase.rpc("public_craftid_profile", {
        p_craftid_number: parsed.number,
        p_check_digits: parsed.check,
      });

      if (profile) {
        redirect(`/id/${parsed.formatted}${q}`);
      }

      lookupError = t.idMissing;
    }
  }

  const [publishedEntities, { data: suppressionRule }] = await Promise.all([
    loadAllPublishedEntityIdentifiers(supabase),
    supabase
      .from("aggregation_suppression_rules")
      .select("minimum_distinct_entities")
      .eq("category", "general")
      .maybeSingle(),
  ]);

  const configuredThreshold = Number(suppressionRule?.minimum_distinct_entities);
  const generalSuppressionThreshold =
    Number.isInteger(configuredThreshold) && configuredThreshold >= 2
      ? configuredThreshold
      : 5;

  const resolved = await Promise.all(
    publishedEntities.map(async (entity) => {
      const { data } = await supabase.rpc("public_craftid_profile", {
        p_craftid_number: entity.craftid_number,
        p_check_digits: entity.craftid_check_digits,
      });
      return (data ?? null) as PublicRecord | null;
    }),
  );

  const publicRecords = resolved.filter((record): record is PublicRecord => Boolean(record));

  const craftOptions = Array.from(
    new Set(
      publicRecords.flatMap((record) => [
        ...(record.claims ?? [])
          .filter((claim) => claim.claim_type === "skill")
          .map((claim) => claim.title),
        record.professional_title ?? record.craft_sector ?? "",
      ]).filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const countryOptions = Array.from(
    new Set(
      publicRecords
        .map((record) => record.location_country_code)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const searchTerm = normalized(params.q);
  const craftFilter = normalized(params.craft);
  const countryFilter = normalized(params.country);
  const typeFilter = normalized(params.type);

  const filteredRecords = publicRecords.filter((record) => {
    const skills = (record.claims ?? [])
      .filter((claim) => claim.claim_type === "skill")
      .map((claim) => claim.title);
    const role = record.professional_title ?? record.craft_sector ?? "";
    const searchable = [
      record.display_name,
      role,
      record.location ?? "",
      ...skills,
    ].join(" ").toLocaleLowerCase();

    const matchesSearch = !searchTerm || searchable.includes(searchTerm);
    const matchesCraft =
      !craftFilter ||
      [role, ...skills].some((value) => normalized(value) === craftFilter);
    const matchesCountry =
      !countryFilter || normalized(record.location_country_code ?? "") === countryFilter;
    const matchesType = !typeFilter || normalized(record.entity_type) === typeFilter;

    return matchesSearch && matchesCraft && matchesCountry && matchesType;
  });

  const view = params.view === "map" ? "map" : "list";

  const mapCandidates = filteredRecords.flatMap((record) => {
    const coordinate = resolvePublicMapCoordinate({
      countryCode: record.location_country_code,
      city: record.location_city,
      precision: record.location_precision,
    });
    if (!coordinate) return [];

    const location =
      coordinate.precision === "city"
        ? record.location ?? record.location_city ?? record.location_country_code
        : record.location_country_code;

    if (!location) return [];

    return [{
      location,
      lat: coordinate.lat,
      lng: coordinate.lng,
      precision: coordinate.precision,
    }];
  });

  const mapGroups = new Map<string, {
    location: string;
    lat: number;
    lng: number;
    precision: "city" | "country";
    count: number;
  }>();

  for (const point of mapCandidates) {
    const key = `${point.precision}:${point.lat.toFixed(4)}:${point.lng.toFixed(4)}`;
    const current = mapGroups.get(key);
    if (current) {
      current.count += 1;
    } else {
      mapGroups.set(key, { ...point, count: 1 });
    }
  }

  const mapPoints = [...mapGroups.values()].filter(
    (point) => point.count >= generalSuppressionThreshold,
  );

  const filterQuery = new URLSearchParams();
  if (locale !== "en") filterQuery.set("lang", locale);
  if (params.q) filterQuery.set("q", params.q);
  if (params.craft) filterQuery.set("craft", params.craft);
  if (params.country) filterQuery.set("country", params.country);
  if (params.type) filterQuery.set("type", params.type);

  const listQuery = new URLSearchParams(filterQuery);
  listQuery.delete("view");
  const mapQuery = new URLSearchParams(filterQuery);
  mapQuery.set("view", "map");

  const clearQuery = new URLSearchParams();
  if (locale !== "en") clearQuery.set("lang", locale);

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
              {locale !== "en" ? <input type="hidden" name="lang" value={locale} /> : null}
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

            <form className="registryToolbar" method="get" action="/discover">
              {locale !== "en" ? <input type="hidden" name="lang" value={locale} /> : null}
              <label className="searchField">
                <span>{t.search}</span>
                <input name="q" placeholder={t.placeholder} defaultValue={params.q ?? ""} />
              </label>
              <label>
                <span>{t.craft}</span>
                <select name="craft" defaultValue={params.craft ?? ""}>
                  <option value="">{t.all}</option>
                  {craftOptions.map((craft) => <option value={craft} key={craft}>{craft}</option>)}
                </select>
              </label>
              <label>
                <span>{t.country}</span>
                <select name="country" defaultValue={params.country ?? ""}>
                  <option value="">{t.all}</option>
                  {countryOptions.map((country) => <option value={country} key={country}>{country}</option>)}
                </select>
              </label>
              <label>
                <span>{t.type}</span>
                <select name="type" defaultValue={params.type ?? ""}>
                  <option value="">{t.all}</option>
                  <option value="professional">{t.professional}</option>
                  <option value="workshop">{t.workshop}</option>
                </select>
              </label>
              <button className="button" type="submit">{{ en: "Apply", fr: "Appliquer", de: "Anwenden", nl: "Toepassen", pl: "Zastosuj", it: "Applica", es: "Aplicar", uk: "Застосувати" }[locale]}</button>
            </form>

            <div className="registrySummary">
              <span>
                {filteredRecords.length} {filteredRecords.length === 1 ? t.oneResult : t.manyResults}
              </span>
              {(params.q || params.craft || params.country || params.type) ? (
                <Link href={`/discover${clearQuery.size ? `?${clearQuery.toString()}` : ""}`}>
                  {t.clear}
                </Link>
              ) : null}
            </div>

            <p className="privacyNote">{t.note}</p>
          </div>
        </section>

        <section className="section registryResultsSection">
          <div className="container">
            <div className="registryViewHeader">
              <div>
                <div className="eyebrow">{view === "map" ? t.mapTitle : t.results}</div>
                {view === "map" ? <p>{t.mapText}</p> : null}
              </div>
              <nav className="registryViewSwitch" aria-label={{ en: "Registry view", fr: "Vue du registre", de: "Registeransicht", nl: "Registerweergave", pl: "Widok rejestru", it: "Vista registro", es: "Vista del registro", uk: "Режим реєстру" }[locale]}>
                <Link className={view === "list" ? "active" : ""} href={`/discover${listQuery.size ? `?${listQuery.toString()}` : ""}`}>{t.listView}</Link>
                <Link className={view === "map" ? "active" : ""} href={`/discover?${mapQuery.toString()}`}>{t.mapView}</Link>
              </nav>
            </div>

            {view === "map" ? (
              <>
                <CraftSkillsMap locale={locale} points={mapPoints} />
                <div className="mapMetaLine">
                  <span>{mapPoints.length} {t.mapped}</span>
                  <span>{t.mapPrivacy} k ≥ {generalSuppressionThreshold}.</span>
                </div>
              </>
            ) : filteredRecords.length ? (
              <div className="recordList">
                {filteredRecords.map((record, index) => {
                  const skills = (record.claims ?? [])
                    .filter((claim) => claim.claim_type === "skill")
                    .slice(0, 4);
                  const status = strongestClaimStatus(record.claims ?? []);
                  const formatted = "#" + formatCraftId(record.craftid_number, record.craftid_check_digits);
                  const route = formatted.replace("#", "");
                  const role = record.professional_title ?? record.craft_sector ?? "";
                  const statusLabel = status
                    ? statusCopy[locale][status as keyof (typeof statusCopy)[typeof locale]] ?? status
                    : t.noClaimStatus;

                  return (
                    <article className="publicRecord registryRecord" key={formatted}>
                      <div className="recordNumber">{String(index + 1).padStart(2, "0")}</div>
                      <div>
                        <div className="recordId">CraftID {formatted}</div>
                        <h2>{record.display_name}</h2>
                        <p className="recordRole">
                          {[role, record.location].filter(Boolean).join(" · ")}
                        </p>
                        {record.about ? <p>{record.about}</p> : null}
                        {skills.length ? (
                          <div className="tagRow">
                            {skills.map((skill) => <span className="tag" key={skill.id}>{skill.title}</span>)}
                          </div>
                        ) : null}
                      </div>
                      <div className="recordStatus">
                        <span className="recordStatusLabel">{t.claimStatus}</span>
                        <strong>{statusLabel}</strong>
                        <Link href={`/id/${route}${q}`}>{t.open} →</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="registryEmpty">
                <p>{t.empty}</p>
                <Link href={`/discover${clearQuery.size ? `?${clearQuery.toString()}` : ""}`}>{t.clear} →</Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
