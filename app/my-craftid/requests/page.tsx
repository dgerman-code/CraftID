import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { updateContactRequestStatus } from "./actions";
import { localeMeta, localeQuery } from "@/lib/i18n";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; entity?: string; error?: string; message?: string }> };

const copy = {
  en: {
    eyebrow: "Contact requests", title: "Controlled enquiries to your CraftID record.",
    intro: "Requests arrive here without exposing your private email or phone publicly. You decide what to accept and how to respond.",
    back: "Back to My CraftID", empty: "No contact requests yet.", organisation: "Organisation", role: "Role", purpose: "Purpose", submitted: "Submitted", status: "Status",
    accept: "Accept", decline: "Decline", close: "Close", spam: "Mark as spam", updated: "Request updated.",
  },
  fr: {
    eyebrow: "Demandes de contact", title: "Demandes contrôlées adressées à votre dossier CraftID.",
    intro: "Les demandes arrivent ici sans exposer publiquement votre e-mail ou téléphone privé. Vous décidez lesquelles accepter et comment répondre.",
    back: "Retour à Mon CraftID", empty: "Aucune demande de contact.", organisation: "Organisation", role: "Rôle", purpose: "Objet", submitted: "Envoyée", status: "Statut",
    accept: "Accepter", decline: "Refuser", close: "Clore", spam: "Marquer comme spam", updated: "Demande mise à jour.",
  },
  de: {
    eyebrow: "Kontaktanfragen", title: "Kontrollierte Anfragen an Ihren CraftID-Datensatz.",
    intro: "Anfragen kommen hier an, ohne Ihre private E-Mail-Adresse oder Telefonnummer öffentlich anzuzeigen. Sie entscheiden, was Sie annehmen und wie Sie antworten.",
    back: "Zurück zu Meine CraftID", empty: "Noch keine Kontaktanfragen.", organisation: "Organisation", role: "Rolle", purpose: "Zweck", submitted: "Eingereicht", status: "Status",
    accept: "Annehmen", decline: "Ablehnen", close: "Schließen", spam: "Als Spam markieren", updated: "Anfrage aktualisiert.",
  },
  nl: {
    eyebrow: "Contactverzoeken", title: "Gecontroleerde vragen aan uw CraftID-dossier.",
    intro: "Verzoeken komen hier binnen zonder uw privé-e-mail of telefoonnummer publiek te maken. U bepaalt wat u accepteert en hoe u reageert.",
    back: "Terug naar Mijn CraftID", empty: "Nog geen contactverzoeken.", organisation: "Organisatie", role: "Rol", purpose: "Doel", submitted: "Ingediend", status: "Status",
    accept: "Accepteren", decline: "Afwijzen", close: "Sluiten", spam: "Als spam markeren", updated: "Verzoek bijgewerkt.",
  },
  pl: {
    eyebrow: "Prośby o kontakt", title: "Kontrolowane zapytania do Twojego zapisu CraftID.",
    intro: "Zapytania trafiają tutaj bez publicznego ujawniania prywatnego adresu e-mail ani numeru telefonu. Ty decydujesz, co przyjąć i jak odpowiedzieć.",
    back: "Wróć do Mój CraftID", empty: "Nie ma jeszcze próśb o kontakt.", organisation: "Organizacja", role: "Rola", purpose: "Cel", submitted: "Wysłano", status: "Status",
    accept: "Przyjmij", decline: "Odrzuć", close: "Zamknij", spam: "Oznacz jako spam", updated: "Prośba zaktualizowana.",
  },
  it: {
    eyebrow: "Richieste di contatto", title: "Richieste controllate al tuo record CraftID.",
    intro: "Le richieste arrivano qui senza esporre pubblicamente e-mail o telefono privati. Decidi tu cosa accettare e come rispondere.",
    back: "Torna a Il mio CraftID", empty: "Nessuna richiesta di contatto.", organisation: "Organizzazione", role: "Ruolo", purpose: "Finalità", submitted: "Inviata", status: "Stato",
    accept: "Accetta", decline: "Rifiuta", close: "Chiudi", spam: "Segna come spam", updated: "Richiesta aggiornata.",
  },
  es: {
    eyebrow: "Solicitudes de contacto", title: "Consultas controladas a tu registro CraftID.",
    intro: "Las solicitudes llegan aquí sin exponer públicamente tu correo electrónico o teléfono privado. Tú decides qué aceptar y cómo responder.",
    back: "Volver a Mi CraftID", empty: "Aún no hay solicitudes de contacto.", organisation: "Organización", role: "Función", purpose: "Finalidad", submitted: "Enviada", status: "Estado",
    accept: "Aceptar", decline: "Rechazar", close: "Cerrar", spam: "Marcar como spam", updated: "Solicitud actualizada.",
  },
  uk: {
    eyebrow: "Запити на контакт", title: "Контрольовані звернення до вашого запису CraftID.",
    intro: "Запити надходять сюди без публічного розкриття вашого email або телефону. Ви самі вирішуєте, що прийняти і як відповідати.",
    back: "Назад до Мій CraftID", empty: "Запитів на контакт ще немає.", organisation: "Організація", role: "Роль", purpose: "Мета", submitted: "Надіслано", status: "Статус",
    accept: "Прийняти", decline: "Відхилити", close: "Закрити", spam: "Позначити як спам", updated: "Запит оновлено.",
  },
} as const;

export default async function ContactRequestsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const { supabase, userId, entity } = await getOwnedCraftId(sp.entity);
  const q = entity ? ownerWorkspaceQuery(locale, entity.id) : localeQuery(locale);
  if (!userId) redirect(`/login${localeQuery(locale)}`);
  if (sp.entity && !entity) redirect(`/my-craftid${localeQuery(locale)}`);
  if (!entity) redirect(`/onboarding${localeQuery(locale)}`);

  const { data: requests } = await supabase
    .from("contact_requests")
    .select("id, requester_name, requester_email, requester_organisation, requester_role, purpose, message, status, submitted_at")
    .eq("target_entity_id", entity.id)
    .order("submitted_at", { ascending: false })
    .limit(100);

  return (
    <main className="workspacePage">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={`/my-craftid${q}`}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="workspaceIntro">{t.intro}</p>

        {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
        {sp.message ? <p className="formMessage">{t.updated}</p> : null}

        <section className="requestList">
          {!requests?.length ? <p className="emptyState">{t.empty}</p> : requests.map((request) => (
            <article className="requestCard" key={request.id}>
              <div className="requestCardHeader">
                <div>
                  <h2>{request.requester_name}</h2>
                  <a href={`mailto:${request.requester_email}`}>{request.requester_email}</a>
                </div>
                <span className="provenanceBadge">{t.status}: {request.status}</span>
              </div>

              <div className="requestMeta">
                {request.requester_organisation ? <span>{t.organisation}: {request.requester_organisation}</span> : null}
                {request.requester_role ? <span>{t.role}: {request.requester_role}</span> : null}
                <span>{t.purpose}: {request.purpose.replaceAll("_", " ")}</span>
                <span>{t.submitted}: {new Date(request.submitted_at).toLocaleDateString(localeMeta[locale].intl)}</span>
              </div>

              <p>{request.message}</p>

              <div className="requestActions">
                {[
                  ["accepted", t.accept],
                  ["declined", t.decline],
                  ["closed", t.close],
                  ["spam", t.spam],
                ].map(([status, label]) => (
                  <form action={updateContactRequestStatus} key={status}>
                    <input type="hidden" name="lang" value={locale} />
                    <input type="hidden" name="entityId" value={entity.id} />
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="status" value={status} />
                    <button className="button" type="submit">{label}</button>
                  </form>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
