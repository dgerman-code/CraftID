import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { respondToInstitutionalReferral } from "./actions";
import { localeQuery, contentLocale, withLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; entity?: string; error?: string; message?: string }> };

const copy = {
  en: {
    eyebrow: "Institutional opportunities",
    title: "Review invitations routed through CraftID.",
    intro: "These invitations are facilitated through CraftID. Accepting an invitation does not automatically disclose private contact details beyond the sharing preferences you have set.",
    back: "Back to My CraftID",
    empty: "No institutional invitations yet.",
    organisation: "Organisation",
    type: "Opportunity",
    deadline: "Response deadline",
    status: "Status",
    note: "Optional response note",
    accept: "Accept invitation",
    decline: "Decline",
    updated: "Response recorded.",
    shareable: "Contacts you have allowed for institutional sharing",
    noShareable: "You have not enabled any contact for institutional sharing.",
  },
  uk: {
    eyebrow: "Інституційні можливості",
    title: "Переглядайте запрошення, передані через CraftID.",
    intro: "Ці запрошення передаються через CraftID. Прийняття запрошення не розкриває автоматично приватні контакти понад ті налаштування, які ви дозволили для інституційного обміну.",
    back: "Назад до Мій CraftID",
    empty: "Інституційних запрошень ще немає.",
    organisation: "Організація",
    type: "Можливість",
    deadline: "Строк відповіді",
    status: "Статус",
    note: "Коментар до відповіді (за бажанням)",
    accept: "Прийняти запрошення",
    decline: "Відхилити",
    updated: "Відповідь зафіксовано.",
    shareable: "Контакти, які ви дозволили передавати інституційним партнерам",
    noShareable: "Ви ще не дозволили передавати жоден контакт інституційним партнерам.",
  },
} as const;

export default async function ReferralsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[contentLocale(locale)];
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
