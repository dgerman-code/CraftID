import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { uploadEvidence } from "./actions";
import { localeQuery } from "@/lib/i18n";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; entity?: string; error?: string; message?: string }> };

const copy = {
  en: {
    eyebrow: "Evidence", title: "Support individual claims with private evidence.",
    intro: "Evidence is stored privately by default. Uploading a document does not verify a claim automatically; it creates material that may later be linked to a claim and reviewed.",
    titleLabel: "Evidence title", type: "Evidence type", issuer: "Issuer / source", claim: "Link to claim", noClaim: "Do not link yet", file: "File", upload: "Upload evidence",
    list: "Evidence library", empty: "No evidence has been uploaded yet.", back: "Back to My CraftID", uploaded: "Evidence uploaded.",
    note: "Accepted formats: PDF, JPEG, PNG and WebP. Maximum file size: 10 MB.",
    privacy: "Raw evidence files are not public. Public profiles show review status or source information rather than exposing sensitive documents.",
  },
  fr: {
    eyebrow: "Preuves", title: "Étayer des déclarations individuelles avec des preuves privées.",
    intro: "Les preuves sont privées par défaut. Le téléversement d’un document ne vérifie pas automatiquement une déclaration ; il crée un élément qui pourra ensuite être relié à une déclaration et examiné.",
    titleLabel: "Titre de la preuve", type: "Type de preuve", issuer: "Émetteur / source", claim: "Lier à une déclaration", noClaim: "Ne pas lier pour le moment", file: "Fichier", upload: "Téléverser la preuve",
    list: "Bibliothèque de preuves", empty: "Aucune preuve n’a encore été téléversée.", back: "Retour à Mon CraftID", uploaded: "Preuve téléversée.",
    note: "Formats acceptés : PDF, JPEG, PNG et WebP. Taille maximale : 10 Mo.",
    privacy: "Les fichiers de preuve bruts ne sont pas publics. Les profils publics affichent le statut d’examen ou des informations de source plutôt que des documents sensibles.",
  },
  de: {
    eyebrow: "Nachweise", title: "Stützen Sie einzelne Angaben mit privaten Nachweisen.",
    intro: "Nachweise werden standardmäßig privat gespeichert. Das Hochladen eines Dokuments bestätigt eine Angabe nicht automatisch; es schafft Material, das später mit einer Angabe verknüpft und geprüft werden kann.",
    titleLabel: "Titel des Nachweises", type: "Nachweisart", issuer: "Aussteller / Quelle", claim: "Mit Angabe verknüpfen", noClaim: "Noch nicht verknüpfen", file: "Datei", upload: "Nachweis hochladen",
    list: "Nachweisbibliothek", empty: "Noch keine Nachweise hochgeladen.", back: "Zurück zu Meine CraftID", uploaded: "Nachweis hochgeladen.",
    note: "Akzeptierte Formate: PDF, JPEG, PNG und WebP. Maximale Dateigröße: 10 MB.",
    privacy: "Original-Nachweisdateien sind nicht öffentlich. Öffentliche Profile zeigen Prüfstatus oder Quelleninformationen statt sensibler Dokumente.",
  },
  nl: {
    eyebrow: "Bewijs", title: "Onderbouw afzonderlijke verklaringen met privébewijs.",
    intro: "Bewijs wordt standaard privé opgeslagen. Het uploaden van een document verifieert een verklaring niet automatisch; het creëert materiaal dat later aan een verklaring kan worden gekoppeld en beoordeeld.",
    titleLabel: "Titel van bewijs", type: "Type bewijs", issuer: "Uitgever / bron", claim: "Koppelen aan verklaring", noClaim: "Nog niet koppelen", file: "Bestand", upload: "Bewijs uploaden",
    list: "Bewijsbibliotheek", empty: "Er is nog geen bewijs geüpload.", back: "Terug naar Mijn CraftID", uploaded: "Bewijs geüpload.",
    note: "Geaccepteerde formaten: PDF, JPEG, PNG en WebP. Maximale bestandsgrootte: 10 MB.",
    privacy: "Ruwe bewijsbestanden zijn niet openbaar. Openbare profielen tonen beoordelingsstatus of broninformatie in plaats van gevoelige documenten.",
  },
  pl: {
    eyebrow: "Dowody", title: "Wspieraj poszczególne deklaracje prywatnymi dowodami.",
    intro: "Dowody są domyślnie przechowywane prywatnie. Przesłanie dokumentu nie weryfikuje deklaracji automatycznie; tworzy materiał, który można później powiązać z deklaracją i poddać przeglądowi.",
    titleLabel: "Tytuł dowodu", type: "Typ dowodu", issuer: "Wystawca / źródło", claim: "Powiąż z deklaracją", noClaim: "Na razie nie wiąż", file: "Plik", upload: "Prześlij dowód",
    list: "Biblioteka dowodów", empty: "Nie przesłano jeszcze żadnych dowodów.", back: "Wróć do Mój CraftID", uploaded: "Dowód przesłany.",
    note: "Akceptowane formaty: PDF, JPEG, PNG i WebP. Maksymalny rozmiar pliku: 10 MB.",
    privacy: "Surowe pliki dowodowe nie są publiczne. Profile publiczne pokazują status przeglądu lub informacje o źródle zamiast ujawniać wrażliwe dokumenty.",
  },
  it: {
    eyebrow: "Evidenze", title: "Supporta singole dichiarazioni con evidenze private.",
    intro: "Le evidenze sono private per impostazione predefinita. Caricare un documento non verifica automaticamente una dichiarazione; crea materiale che potrà essere collegato e sottoposto a revisione in seguito.",
    titleLabel: "Titolo dell’evidenza", type: "Tipo di evidenza", issuer: "Emittente / fonte", claim: "Collega a dichiarazione", noClaim: "Non collegare ancora", file: "File", upload: "Carica evidenza",
    list: "Archivio evidenze", empty: "Non sono ancora state caricate evidenze.", back: "Torna a Il mio CraftID", uploaded: "Evidenza caricata.",
    note: "Formati accettati: PDF, JPEG, PNG e WebP. Dimensione massima: 10 MB.",
    privacy: "I file originali delle evidenze non sono pubblici. I profili pubblici mostrano lo stato di revisione o informazioni sulla fonte invece di esporre documenti sensibili.",
  },
  es: {
    eyebrow: "Evidencias", title: "Respalda declaraciones individuales con evidencias privadas.",
    intro: "Las evidencias se almacenan de forma privada por defecto. Subir un documento no verifica automáticamente una declaración; crea material que después puede vincularse y revisarse.",
    titleLabel: "Título de la evidencia", type: "Tipo de evidencia", issuer: "Emisor / fuente", claim: "Vincular a declaración", noClaim: "No vincular todavía", file: "Archivo", upload: "Subir evidencia",
    list: "Biblioteca de evidencias", empty: "Aún no se ha subido ninguna evidencia.", back: "Volver a Mi CraftID", uploaded: "Evidencia subida.",
    note: "Formatos aceptados: PDF, JPEG, PNG y WebP. Tamaño máximo del archivo: 10 MB.",
    privacy: "Los archivos de evidencia originales no son públicos. Los perfiles públicos muestran el estado de revisión o información de la fuente en lugar de exponer documentos sensibles.",
  },
  uk: {
    eyebrow: "Докази", title: "Підтверджуйте окремі твердження приватними доказами.",
    intro: "Докази за замовчуванням зберігаються приватно. Завантаження документа не підтверджує твердження автоматично; воно створює матеріал, який згодом можна пов’язати з твердженням і передати на перевірку.",
    titleLabel: "Назва доказу", type: "Тип доказу", issuer: "Видавець / джерело", claim: "Пов’язати з твердженням", noClaim: "Поки не пов’язувати", file: "Файл", upload: "Завантажити доказ",
    list: "Бібліотека доказів", empty: "Доказів ще не завантажено.", back: "Назад до Мій CraftID", uploaded: "Доказ завантажено.",
    note: "Дозволені формати: PDF, JPEG, PNG і WebP. Максимальний розмір файла — 10 МБ.",
    privacy: "Первинні файли доказів не є публічними. Публічні профілі показують статус перевірки або інформацію про джерело, а не відкривають чутливі документи.",
  },
} as const;

export default async function EvidencePage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale];
  const { supabase, userId, entity } = await getOwnedCraftId(params.entity);
  const q = entity ? ownerWorkspaceQuery(locale, entity.id) : localeQuery(locale);
  if (!userId) redirect(`/login${localeQuery(locale)}`);
  if (params.entity && !entity) redirect(`/my-craftid${localeQuery(locale)}`);
  if (!entity) redirect(`/onboarding${localeQuery(locale)}`);

  const [{ data: evidence }, { data: claims }] = await Promise.all([
    supabase.from("evidence_items")
      .select("id, evidence_type, title, issuer, review_status, uploaded_at")
      .eq("owner_entity_id", entity.id)
      .order("uploaded_at", { ascending: false }),
    supabase.from("claims")
      .select("id, title, claim_type, status")
      .eq("entity_id", entity.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="workspacePage">
      <div className="container">
        <Link className="backLink" href={`/my-craftid${q}`}>← {t.back}</Link>
        <div className="workspaceGrid">
          <section>
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
            <p className="workspaceIntro">{t.intro}</p>
            <p className="privacyNote">{t.privacy}</p>

            {params.error ? <p className="formMessage error">{params.error}</p> : null}
            {params.message ? <p className="formMessage">{t.uploaded}</p> : null}

            <form className="workspaceForm compactForm" action={uploadEvidence}>
              <input type="hidden" name="lang" value={locale} />
              <input type="hidden" name="entityId" value={entity.id} />
              <label>{t.titleLabel}<input name="title" required /></label>
              <label>{t.type}
                <select name="evidenceType" required defaultValue="qualification_document">
                  <option value="qualification_document">{locale === "uk" ? "Документ про кваліфікацію" : "Qualification document"}</option>
                  <option value="experience_document">{locale === "uk" ? "Документ про досвід" : "Experience document"}</option>
                  <option value="identity_document">{locale === "uk" ? "Документ для підтвердження особи" : "Identity document"}</option>
                  <option value="business_registration">{locale === "uk" ? "Реєстрація бізнесу" : "Business registration"}</option>
                  <option value="portfolio_evidence">{locale === "uk" ? "Матеріал портфоліо" : "Portfolio evidence"}</option>
                  <option value="external_reference">{locale === "uk" ? "Зовнішнє джерело" : "External reference"}</option>
                  <option value="other">{locale === "uk" ? "Інше" : "Other"}</option>
                </select>
              </label>
              <label>{t.issuer}<input name="issuer" /></label>
              <label>{t.claim}
                <select name="claimId" defaultValue="">
                  <option value="">{t.noClaim}</option>
                  {claims?.map((claim) => (
                    <option value={claim.id} key={claim.id}>
                      {claim.title} · {claim.claim_type.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label>{t.file}<input name="file" type="file" accept=".pdf,image/jpeg,image/png,image/webp" required /></label>
              <p className="fieldHelp">{t.note}</p>
              <button className="button buttonPrimary" type="submit">{t.upload}</button>
            </form>
          </section>

          <aside className="workspaceList">
            <div className="eyebrow">{t.list}</div>
            {!evidence?.length ? <p className="emptyState">{t.empty}</p> : evidence.map((item) => (
              <article className="claimItem" key={item.id}>
                <span className="recordId">{item.evidence_type.replaceAll("_", " ")}</span>
                <h3>{item.title}</h3>
                {item.issuer ? <p>{item.issuer}</p> : null}
                <div className="claimMeta"><span>{item.review_status.replaceAll("_", " ")}</span></div>
              </article>
            ))}
          </aside>
        </div>
      </div>
    </main>
  );
}
