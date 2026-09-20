import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom } from "@/components/site-shell";
import { updateContactRequestStatus } from "./actions";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; error?: string; message?: string }> };

const copy = {
  en: {
    eyebrow: "Contact requests",
    title: "Controlled enquiries to your CraftID record.",
    intro: "Requests arrive here without exposing your private email or phone publicly. You decide what to accept and how to respond.",
    back: "Back to My CraftID",
    empty: "No contact requests yet.",
    organisation: "Organisation",
    role: "Role",
    purpose: "Purpose",
    submitted: "Submitted",
    status: "Status",
    accept: "Accept",
    decline: "Decline",
    close: "Close",
    spam: "Mark as spam",
    updated: "Request updated.",
  },
  uk: {
    eyebrow: "Запити на контакт",
    title: "Контрольовані звернення до вашого запису CraftID.",
    intro: "Запити надходять сюди без публічного розкриття вашого email або телефону. Ви самі вирішуєте, що прийняти і як відповідати.",
    back: "Назад до Мій CraftID",
    empty: "Запитів на контакт ще немає.",
    organisation: "Організація",
    role: "Роль",
    purpose: "Мета",
    submitted: "Надіслано",
    status: "Статус",
    accept: "Прийняти",
    decline: "Відхилити",
    close: "Закрити",
    spam: "Позначити як спам",
    updated: "Запит оновлено.",
  },
} as const;

export default async function ContactRequestsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const q = locale === "uk" ? "?lang=uk" : "";

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect(`/login${q}`);

  const { data: entity } = await supabase
    .from("craftid_entities")
    .select("id")
    .eq("owner_user_id", userId)
    .limit(1)
    .single();

  if (!entity) redirect(`/onboarding${q}`);

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
                <span>{t.submitted}: {new Date(request.submitted_at).toLocaleDateString(locale === "uk" ? "uk-UA" : "en-GB")}</span>
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
