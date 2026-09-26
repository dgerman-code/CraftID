import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { respondToInstitutionalReferral } from "./actions";
import { localeQuery } from "@/lib/i18n";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; entity?: string; error?: string; message?: string }> };

const copy = {
  en: {
    eyebrow: "Institutional opportunities", title: "Review invitations routed through CraftID.",
    intro: "These invitations are facilitated through CraftID. Accepting an invitation does not automatically disclose private contact details beyond the sharing preferences you have set.",
    back: "Back to My CraftID", empty: "No institutional invitations yet.", organisation: "Organisation", type: "Opportunity", deadline: "Response deadline", status: "Status",
    note: "Optional response note", accept: "Accept invitation", decline: "Decline", updated: "Response recorded.",
    shareable: "Contacts you have allowed for institutional sharing", noShareable: "You have not enabled any contact for institutional sharing.",
  },
  fr: {
    eyebrow: "Opportunités institutionnelles", title: "Examinez les invitations transmises via CraftID.",
    intro: "Ces invitations sont facilitées par CraftID. Leur acceptation ne divulgue pas automatiquement de coordonnées privées au-delà des préférences de partage que vous avez définies.",
    back: "Retour à Mon CraftID", empty: "Aucune invitation institutionnelle pour le moment.", organisation: "Organisation", type: "Opportunité", deadline: "Date limite de réponse", status: "Statut",
    note: "Note de réponse facultative", accept: "Accepter l’invitation", decline: "Refuser", updated: "Réponse enregistrée.",
    shareable: "Contacts autorisés pour le partage institutionnel", noShareable: "Vous n’avez autorisé aucun contact pour le partage institutionnel.",
  },
  de: {
    eyebrow: "Institutionelle Möglichkeiten", title: "Prüfen Sie Einladungen, die über CraftID vermittelt wurden.",
    intro: "Diese Einladungen werden über CraftID vermittelt. Das Annehmen einer Einladung gibt private Kontaktdaten nicht automatisch über Ihre festgelegten Freigabeeinstellungen hinaus weiter.",
    back: "Zurück zu Meine CraftID", empty: "Noch keine institutionellen Einladungen.", organisation: "Organisation", type: "Möglichkeit", deadline: "Antwortfrist", status: "Status",
    note: "Optionale Antwortnotiz", accept: "Einladung annehmen", decline: "Ablehnen", updated: "Antwort gespeichert.",
    shareable: "Kontakte, die Sie für institutionelle Weitergabe freigegeben haben", noShareable: "Sie haben noch keinen Kontakt für institutionelle Weitergabe freigegeben.",
  },
  nl: {
    eyebrow: "Institutionele kansen", title: "Bekijk uitnodigingen die via CraftID zijn doorgestuurd.",
    intro: "Deze uitnodigingen worden via CraftID gefaciliteerd. Een uitnodiging accepteren maakt privécontactgegevens niet automatisch bekend buiten de deelvoorkeuren die u hebt ingesteld.",
    back: "Terug naar Mijn CraftID", empty: "Nog geen institutionele uitnodigingen.", organisation: "Organisatie", type: "Kans", deadline: "Reactietermijn", status: "Status",
    note: "Optionele reactienotitie", accept: "Uitnodiging accepteren", decline: "Afwijzen", updated: "Reactie opgeslagen.",
    shareable: "Contacten die u voor institutioneel delen hebt toegestaan", noShareable: "U hebt nog geen contact voor institutioneel delen ingeschakeld.",
  },
  pl: {
    eyebrow: "Możliwości instytucjonalne", title: "Przeglądaj zaproszenia przekazywane przez CraftID.",
    intro: "Zaproszenia są obsługiwane przez CraftID. Przyjęcie zaproszenia nie ujawnia automatycznie prywatnych danych kontaktowych poza ustawionymi przez Ciebie preferencjami udostępniania.",
    back: "Wróć do Mój CraftID", empty: "Nie ma jeszcze zaproszeń instytucjonalnych.", organisation: "Organizacja", type: "Możliwość", deadline: "Termin odpowiedzi", status: "Status",
    note: "Opcjonalna notatka do odpowiedzi", accept: "Przyjmij zaproszenie", decline: "Odrzuć", updated: "Odpowiedź zapisana.",
    shareable: "Kontakty dopuszczone przez Ciebie do udostępniania instytucjonalnego", noShareable: "Nie włączono żadnego kontaktu do udostępniania instytucjonalnego.",
  },
  it: {
    eyebrow: "Opportunità istituzionali", title: "Esamina gli inviti inoltrati tramite CraftID.",
    intro: "Questi inviti sono facilitati tramite CraftID. Accettare un invito non divulga automaticamente contatti privati oltre le preferenze di condivisione impostate.",
    back: "Torna a Il mio CraftID", empty: "Nessun invito istituzionale.", organisation: "Organizzazione", type: "Opportunità", deadline: "Scadenza risposta", status: "Stato",
    note: "Nota di risposta facoltativa", accept: "Accetta invito", decline: "Rifiuta", updated: "Risposta registrata.",
    shareable: "Contatti che hai autorizzato alla condivisione istituzionale", noShareable: "Non hai abilitato alcun contatto per la condivisione istituzionale.",
  },
  es: {
    eyebrow: "Oportunidades institucionales", title: "Revisa invitaciones canalizadas mediante CraftID.",
    intro: "Estas invitaciones se facilitan a través de CraftID. Aceptar una invitación no divulga automáticamente datos de contacto privados más allá de las preferencias de uso compartido que hayas establecido.",
    back: "Volver a Mi CraftID", empty: "Aún no hay invitaciones institucionales.", organisation: "Organización", type: "Oportunidad", deadline: "Fecha límite de respuesta", status: "Estado",
    note: "Nota de respuesta opcional", accept: "Aceptar invitación", decline: "Rechazar", updated: "Respuesta registrada.",
    shareable: "Contactos autorizados para compartir con instituciones", noShareable: "No has habilitado ningún contacto para compartir con instituciones.",
  },
  uk: {
    eyebrow: "Інституційні можливості", title: "Переглядайте запрошення, передані через CraftID.",
    intro: "Ці запрошення передаються через CraftID. Прийняття запрошення не розкриває автоматично приватні контакти понад ті налаштування, які ви дозволили для інституційного обміну.",
    back: "Назад до Мій CraftID", empty: "Інституційних запрошень ще немає.", organisation: "Організація", type: "Можливість", deadline: "Строк відповіді", status: "Статус",
    note: "Коментар до відповіді (за бажанням)", accept: "Прийняти запрошення", decline: "Відхилити", updated: "Відповідь зафіксовано.",
    shareable: "Контакти, які ви дозволили передавати інституційним партнерам", noShareable: "Ви ще не дозволили передавати жоден контакт інституційним партнерам.",
  },
} as const;

export default async function ReferralsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const { supabase, userId, entity } = await getOwnedCraftId(sp.entity);
  const q = entity ? ownerWorkspaceQuery(locale, entity.id) : localeQuery(locale);
  if (!userId) redirect(`/login${localeQuery(locale)}`);
  if (sp.entity && !entity) redirect(`/my-craftid${localeQuery(locale)}`);
  if (!entity) redirect(`/onboarding${localeQuery(locale)}`);

  const [{ data: referrals }, { data: contacts }] = await Promise.all([
    supabase
      .from("institutional_referrals")
      .select("id, requester_organisation, opportunity_type, title, message, response_deadline, status, owner_response_note, created_at")
      .eq("target_entity_id", entity.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("institutional_shareable_contacts")
      .select("contact_type, value, verification_level")
      .eq("entity_id", entity.id),
  ]);

  return (
    <main className="workspacePage">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={`/my-craftid${q}`}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="workspaceIntro">{t.intro}</p>

        {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
        {sp.message ? <p className="formMessage">{t.updated}</p> : null}

        <section className="shareableContactsPanel">
          <div className="eyebrow">{t.shareable}</div>
          {!contacts?.length ? <p className="emptyState">{t.noShareable}</p> : (
            <div className="tagRow">
              {contacts.map((c) => <span className="tag" key={c.contact_type}>{c.contact_type}</span>)}
            </div>
          )}
        </section>

        <section className="requestList">
          {!referrals?.length ? <p className="emptyState">{t.empty}</p> : referrals.map((r) => (
            <article className="requestCard" key={r.id}>
              <div className="requestCardHeader">
                <div>
                  <span className="recordId">{r.requester_organisation}</span>
                  <h2>{r.title}</h2>
                </div>
                <span className="provenanceBadge">{t.status}: {r.status}</span>
              </div>

              <div className="requestMeta">
                <span>{t.organisation}: {r.requester_organisation}</span>
                <span>{t.type}: {r.opportunity_type}</span>
                {r.response_deadline ? <span>{t.deadline}: {r.response_deadline}</span> : null}
              </div>

              <p>{r.message}</p>

              {r.status === "invited" ? (
                <form className="workspaceForm compactForm" action={respondToInstitutionalReferral}>
                  <input type="hidden" name="lang" value={locale} />
                  <input type="hidden" name="entityId" value={entity.id} />
                  <input type="hidden" name="referralId" value={r.id} />
                  <label>{t.note}<textarea name="note" rows={3} /></label>
                  <div className="requestActions">
                    <button className="button buttonPrimary" type="submit" name="status" value="accepted">{t.accept}</button>
                    <button className="button" type="submit" name="status" value="declined">{t.decline}</button>
                  </div>
                </form>
              ) : r.owner_response_note ? <p className="privacyNote">{r.owner_response_note}</p> : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
