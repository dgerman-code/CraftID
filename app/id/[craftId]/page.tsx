import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LanguageMenu, localeFrom } from "@/components/site-shell";
import { localeMeta } from "@/lib/i18n";
import { formatCraftId, parseCraftId } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ craftId: string }>;
  searchParams: Promise<{ lang?: string }>;
};

const copy = {
  en: {
    identity: "Professional identity record",
    about: "About",
    skills: "Skills",
    location: "Location",
    exactAddress: "Workshop address",
    links: "External presence",
    contact: "Contact through CraftID",
    notice: "CraftID is an independent professional identity and evidence infrastructure. This profile is not a quality certification or EU recognition.",
    unavailable: "Not available",
    website: "Website",
    linkedin: "LinkedIn",
    portfolio: "Portfolio",
    archivedIdentity: "Archived CraftID record",
    archivedTitle: "Historical CraftID",
    archivedText: "This CraftID is no longer active. A minimal historical record remains available so products and documents already carrying this identifier can still be traced to the registered professional or workshop.",
    archivedStatus: "Archived",
    archivedSince: "Archived",
    historicalCountry: "Country at archive",
    historicalNotice: "This archived record is retained for provenance and record-integrity purposes. It does not indicate current activity, certification or quality approval.",
  },
  fr: {
    identity: "Dossier d’identité professionnelle", about: "À propos", skills: "Compétences", location: "Localisation", exactAddress: "Adresse de l’atelier",
    links: "Présence externe", contact: "Contacter via CraftID",
    notice: "CraftID est une infrastructure indépendante d’identité professionnelle et de preuves. Ce profil n’est ni une certification de qualité ni une reconnaissance de l’UE.",
    unavailable: "Non disponible", website: "Site web", linkedin: "LinkedIn", portfolio: "Portfolio",
    archivedIdentity: "Dossier CraftID archivé", archivedTitle: "CraftID historique",
    archivedText: "Ce CraftID n’est plus actif. Un dossier historique minimal reste disponible afin que les produits et documents portant déjà cet identifiant puissent toujours être rattachés au professionnel ou à l’atelier enregistré.",
    archivedStatus: "Archivé", archivedSince: "Archivé le", historicalCountry: "Pays lors de l’archivage",
    historicalNotice: "Ce dossier archivé est conservé à des fins de provenance et d’intégrité du registre. Il n’indique aucune activité actuelle, certification ou approbation de qualité.",
  },
  de: {
    identity: "Datensatz zur beruflichen Identität", about: "Über die Praxis", skills: "Kompetenzen", location: "Standort", exactAddress: "Werkstattadresse",
    links: "Externe Präsenz", contact: "Über CraftID kontaktieren",
    notice: "CraftID ist eine unabhängige Infrastruktur für berufliche Identität und Nachweise. Dieses Profil ist weder Qualitätszertifizierung noch EU-Anerkennung.",
    unavailable: "Nicht verfügbar", website: "Website", linkedin: "LinkedIn", portfolio: "Portfolio",
    archivedIdentity: "Archivierter CraftID-Datensatz", archivedTitle: "Historische CraftID",
    archivedText: "Diese CraftID ist nicht mehr aktiv. Ein minimaler historischer Datensatz bleibt verfügbar, damit Produkte und Dokumente mit dieser Kennung weiterhin der registrierten Person oder Werkstatt zugeordnet werden können.",
    archivedStatus: "Archiviert", archivedSince: "Archiviert", historicalCountry: "Land bei Archivierung",
    historicalNotice: "Dieser archivierte Datensatz wird für Provenienz und Registerintegrität aufbewahrt. Er weist nicht auf aktuelle Tätigkeit, Zertifizierung oder Qualitätsfreigabe hin.",
  },
  nl: {
    identity: "Dossier professionele identiteit", about: "Over", skills: "Vaardigheden", location: "Locatie", exactAddress: "Werkplaatsadres",
    links: "Externe aanwezigheid", contact: "Contact via CraftID",
    notice: "CraftID is een onafhankelijke infrastructuur voor professionele identiteit en bewijs. Dit profiel is geen kwaliteitscertificering of EU-erkenning.",
    unavailable: "Niet beschikbaar", website: "Website", linkedin: "LinkedIn", portfolio: "Portfolio",
    archivedIdentity: "Gearchiveerd CraftID-dossier", archivedTitle: "Historische CraftID",
    archivedText: "Deze CraftID is niet langer actief. Een minimaal historisch dossier blijft beschikbaar zodat producten en documenten die deze identifier al dragen nog aan de geregistreerde professional of werkplaats kunnen worden gekoppeld.",
    archivedStatus: "Gearchiveerd", archivedSince: "Gearchiveerd", historicalCountry: "Land bij archivering",
    historicalNotice: "Dit gearchiveerde dossier wordt bewaard voor provenance en registerintegriteit. Het duidt niet op huidige activiteit, certificering of kwaliteitsgoedkeuring.",
  },
  pl: {
    identity: "Zapis tożsamości zawodowej", about: "O praktyce", skills: "Umiejętności", location: "Lokalizacja", exactAddress: "Adres pracowni",
    links: "Obecność zewnętrzna", contact: "Kontakt przez CraftID",
    notice: "CraftID jest niezależną infrastrukturą tożsamości zawodowej i dowodów. Ten profil nie jest certyfikatem jakości ani uznaniem UE.",
    unavailable: "Brak danych", website: "Strona internetowa", linkedin: "LinkedIn", portfolio: "Portfolio",
    archivedIdentity: "Zarchiwizowany zapis CraftID", archivedTitle: "Historyczny CraftID",
    archivedText: "Ten CraftID nie jest już aktywny. Minimalny zapis historyczny pozostaje dostępny, aby produkty i dokumenty zawierające ten identyfikator nadal można było powiązać z zarejestrowanym profesjonalistą lub pracownią.",
    archivedStatus: "Zarchiwizowany", archivedSince: "Zarchiwizowano", historicalCountry: "Kraj w chwili archiwizacji",
    historicalNotice: "Ten zarchiwizowany zapis jest przechowywany dla celów pochodzenia i integralności rejestru. Nie oznacza bieżącej działalności, certyfikacji ani zatwierdzenia jakości.",
  },
  it: {
    identity: "Record di identità professionale", about: "Informazioni", skills: "Competenze", location: "Località", exactAddress: "Indirizzo del laboratorio",
    links: "Presenza esterna", contact: "Contatta tramite CraftID",
    notice: "CraftID è un’infrastruttura indipendente per identità professionale ed evidenze. Questo profilo non è una certificazione di qualità né un riconoscimento dell’UE.",
    unavailable: "Non disponibile", website: "Sito web", linkedin: "LinkedIn", portfolio: "Portfolio",
    archivedIdentity: "Record CraftID archiviato", archivedTitle: "CraftID storico",
    archivedText: "Questo CraftID non è più attivo. Un record storico minimo resta disponibile affinché prodotti e documenti che riportano già questo identificativo possano ancora essere ricondotti al professionista o laboratorio registrato.",
    archivedStatus: "Archiviato", archivedSince: "Archiviato", historicalCountry: "Paese al momento dell’archiviazione",
    historicalNotice: "Questo record archiviato è conservato per finalità di provenienza e integrità del registro. Non indica attività attuale, certificazione o approvazione della qualità.",
  },
  es: {
    identity: "Registro de identidad profesional", about: "Acerca de", skills: "Competencias", location: "Ubicación", exactAddress: "Dirección del taller",
    links: "Presencia externa", contact: "Contactar a través de CraftID",
    notice: "CraftID es una infraestructura independiente de identidad profesional y evidencias. Este perfil no es una certificación de calidad ni un reconocimiento de la UE.",
    unavailable: "No disponible", website: "Sitio web", linkedin: "LinkedIn", portfolio: "Portfolio",
    archivedIdentity: "Registro CraftID archivado", archivedTitle: "CraftID histórico",
    archivedText: "Este CraftID ya no está activo. Se mantiene un registro histórico mínimo para que los productos y documentos que ya llevan este identificador puedan seguir vinculándose al profesional o taller registrado.",
    archivedStatus: "Archivado", archivedSince: "Archivado", historicalCountry: "País al archivar",
    historicalNotice: "Este registro archivado se conserva por motivos de procedencia e integridad del registro. No indica actividad actual, certificación ni aprobación de calidad.",
  },
  uk: {
    identity: "Запис професійної ідентичності",
    about: "Про практику",
    skills: "Навички",
    location: "Місце",
    exactAddress: "Адреса майстерні",
    links: "Зовнішні профілі",
    contact: "Зв’язатися через CraftID",
    notice: "CraftID — незалежна інфраструктура професійної ідентичності та доказів. Цей профіль не є сертифікацією якості або визнанням ЄС.",
    unavailable: "Не вказано",
    website: "Вебсайт",
    linkedin: "LinkedIn",
    portfolio: "Портфоліо",
    archivedIdentity: "Архівний запис CraftID",
    archivedTitle: "Історичний CraftID",
    archivedText: "Цей CraftID більше не є активним. Мінімальний історичний запис зберігається, щоб вироби та документи з цим ідентифікатором можна було й надалі пов’язати із зареєстрованим професіоналом або майстернею.",
    archivedStatus: "Архів",
    archivedSince: "Архівовано",
    historicalCountry: "Країна на момент архівації",
    historicalNotice: "Цей архівний запис зберігається для provenance та цілісності реєстру. Він не означає поточну діяльність, сертифікацію чи підтвердження якості.",
  },
} as const;

export default async function PublicCraftIdPage({ params, searchParams }: Props) {
  const { craftId } = await params;
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale];
  const q = locale === "en" ? "" : `?lang=${locale}`;

  const parsed = parseCraftId(craftId);
  if (!parsed) notFound();

  const supabase = await createClient();
  const { data: profile } = await supabase.rpc("public_craftid_profile", {
    p_craftid_number: parsed.number,
    p_check_digits: parsed.check,
  });

  const record = profile as {
    craftid_number: number;
    craftid_check_digits: string;
    entity_type: "professional" | "workshop";
    display_name: string;
    professional_title: string | null;
    craft_sector: string | null;
    location: string | null;
    exact_business_address: {
      address_line1: string | null;
      address_line2: string | null;
      postal_code: string | null;
      locality: string | null;
      country_code: string | null;
    } | null;
    about: string | null;
    has_public_photo: boolean;
    languages: string[];
    claims: { id: string; claim_type: string; title: string; status: string }[];
    links: { contact_type: string; value: string; verification_level: string }[];
  } | null;

  if (!record) {
    const { data: historicalData } = await supabase.rpc("historical_craftid_record", {
      p_craftid_number: parsed.number,
      p_check_digits: parsed.check,
    });

    const historical = historicalData as {
      craftid_number: number;
      craftid_check_digits: string;
      entity_type: "professional" | "workshop";
      display_name: string | null;
      country_code: string | null;
      created_at: string | null;
      archived_at: string | null;
      status: "archived";
    } | null;

    if (!historical) notFound();

    const historicalFormatted = "#" + formatCraftId(
      historical.craftid_number,
      historical.craftid_check_digits,
    );

    return (
      <main className="publicIdentityPage">
        <div className="container">
          <header className="publicIdentityHeader">
            <Link className="brand" href={`/${q}`}>CraftID</Link>
            <div className="publicIdentityHeaderActions">
              <div className="recordId">{t.archivedIdentity}</div>
              <LanguageMenu locale={locale} pathname={`/id/${parsed.formatted}`} />
            </div>
          </header>

          <section className="publicIdentityHero archivedIdentityHero">
            <div className="publicIdentityIntro">
              <div>
                <div className="recordId">CraftID {historicalFormatted}</div>
                <h1>{historical.display_name ?? t.archivedTitle}</h1>
                <p className="profileRole">
                  {historical.entity_type === "professional" ? "Professional" : "Workshop"} · {t.archivedStatus}
                </p>
              </div>
            </div>
            <div className="trustStamp archivedTrustStamp">
              <span>CraftID</span>
              <strong>{historicalFormatted}</strong>
            </div>
          </section>

          <section className="archivedRecordPanel">
            <p>{t.archivedText}</p>
            <dl className="archivedRecordFacts">
              {historical.country_code ? (
                <div>
                  <dt>{t.historicalCountry}</dt>
                  <dd>{historical.country_code}</dd>
                </div>
              ) : null}
              {historical.archived_at ? (
                <div>
                  <dt>{t.archivedSince}</dt>
                  <dd>{new Date(historical.archived_at).toLocaleDateString(localeMeta[locale].intl)}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <p className="publicIdentityNotice">{t.historicalNotice}</p>
        </div>
      </main>
    );
  }

  const claims = record.claims.filter((claim) => claim.claim_type === "skill");
  const links = record.links;
  const location = record.location ?? "";
  const exactAddress = record.exact_business_address
    ? [
        record.exact_business_address.address_line1,
        record.exact_business_address.address_line2,
        [
          record.exact_business_address.postal_code,
          record.exact_business_address.locality,
        ].filter(Boolean).join(" "),
        record.exact_business_address.country_code,
      ].filter(Boolean).join(", ")
    : "";

  const formatted = "#" + formatCraftId(record.craftid_number, record.craftid_check_digits);
  const routeId = formatted.replace("#", "");

  return (
    <main className="publicIdentityPage">
      <div className="container">
        <header className="publicIdentityHeader">
          <Link className="brand" href={`/${q}`}>CraftID</Link>
          <div className="publicIdentityHeaderActions">
            <div className="recordId">{t.identity}</div>
            <LanguageMenu locale={locale} pathname={`/id/${routeId}`} />
          </div>
        </header>

        <section className="publicIdentityHero">
          <div className="publicIdentityIntro">
            {record.has_public_photo ? (
              <Image
                className="publicProfilePhoto"
                src={`/api/public/profile-photo/${routeId}`}
                alt={record.display_name}
                width={112}
                height={112}
                unoptimized
              />
            ) : (
              <div className="publicProfilePhoto publicProfilePhotoFallback" aria-hidden="true" />
            )}
            <div>
              <div className="recordId">CraftID {formatted}</div>
              <h1>{record.display_name}</h1>
              <p className="profileRole">{record.professional_title ?? record.craft_sector ?? ""}</p>
            </div>
          </div>
          <div className="trustStamp">
            <span>CraftID</span>
            <strong>{formatted}</strong>
          </div>
        </section>

        <section className="publicIdentityGrid">
          <article>
            <div className="eyebrow">{t.about}</div>
            <p className="profileSummary">{record.about || t.unavailable}</p>

            <div className="profileBlock">
              <div className="eyebrow">{t.skills}</div>
              {claims?.length ? (
                <div className="tagRow">
                  {claims.map((claim) => <span className="tag" key={claim.id}>{claim.title}</span>)}
                </div>
              ) : <p>{t.unavailable}</p>}
            </div>
          </article>

          <aside>
            <div className="eyebrow">{t.location}</div>
            <p>{location || t.unavailable}</p>

            {exactAddress ? (
              <div className="profileMetaBlock">
                <div className="eyebrow">{t.exactAddress}</div>
                <p>{exactAddress}</p>
              </div>
            ) : null}

            {links?.length ? (
              <div className="profileMetaBlock">
                <div className="eyebrow">{t.links}</div>
                <div className="contactPreviewList">
                  {links.map((item) => (
                    <a
                      key={item.contact_type}
                      href={item.value}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                    >
                      {t[item.contact_type as "website" | "linkedin" | "portfolio"] ?? item.contact_type} →
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="profileMetaBlock">
              <Link className="button buttonPrimary" href={`/contact/${routeId}${q}`}>{t.contact}</Link>
            </div>
          </aside>
        </section>

        <p className="publicIdentityNotice">{t.notice}</p>
      </div>
    </main>
  );
}
