import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom, localeQuery, withLocale } from "@/lib/i18n";
import { formatCraftId } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ lang?: string; entity?: string; message?: string }>;
};

type Interest = {
  request_id: string;
  opportunity_id: string;
  opportunity_title: string;
  partner_name: string;
  message: string | null;
  response_message: string | null;
  response_contact_email: string | null;
  response_contact_url: string | null;
  responded_at: string | null;
  created_at: string;
};

export default async function MyOpportunitiesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const q = localeQuery(locale);
  const ua = locale === "uk";
  const owned = await getOwnedCraftId(sp.entity);

  if (!owned.userId) redirect(`/login${q}`);
  if (!owned.entity) redirect(`/my-craftid${q}`);

  const { data, error } = await owned.supabase.rpc("owner_opportunity_interests", {
    p_entity_id: owned.entity.id,
  });
  if (error) throw new Error(error.message);
  const interests = (data ?? []) as Interest[];

  return (
    <main className="workspacePage">
      <div className="container">
        <Link className="backLink" href={`/my-craftid${ownerWorkspaceQuery(locale, owned.entity.id)}`}>
          ← {ua ? "Мій CraftID" : "My CraftID"}
        </Link>

        <div className="eyebrow">{ua ? "Мої можливості" : "My opportunities"}</div>
        <h1>{ua ? "Запити зацікавленості та відповіді партнерів" : "Interest requests and partner responses"}</h1>
        <p className="workspaceIntro">
          {ua
            ? "Тут зберігаються ваші запити «Я зацікавлений» та відповіді партнерських організацій."
            : 'This page keeps your "I’m interested" requests and responses from partner organisations.'}
        </p>

        {owned.entities.length > 1 ? (
          <div className="entitySwitchRow">
            {owned.entities.map((entity) => (
              <Link
                key={entity.id}
                className={entity.id === owned.entity?.id ? "button buttonPrimary" : "button"}
                href={`/my-craftid/opportunities${ownerWorkspaceQuery(locale, entity.id)}`}
              >
                {entity.entity_type === "professional" ? "Professional" : "Workshop"} · #{formatCraftId(entity.craftid_number, entity.craftid_check_digits)}
              </Link>
            ))}
          </div>
        ) : null}

        {sp.message === "sent" ? (
          <p className="formMessage">
            {ua ? "Ваш інтерес надіслано партнеру." : "Your interest was sent to the partner."}
          </p>
        ) : null}

        <section className="myOpportunityList">
          {interests.map((item) => (
            <article className="myOpportunityCard" key={item.request_id}>
              <div className="recordId">{item.partner_name}</div>
              <h2>{item.opportunity_title}</h2>
              <small>
                {ua ? "Надіслано" : "Sent"} · {new Date(item.created_at).toLocaleDateString(ua ? "uk-UA" : "en-GB")}
              </small>

              {item.message ? <p>{item.message}</p> : null}

              {item.response_message ? (
                <div className="myOpportunityResponse">
                  <div className="eyebrow">{ua ? "Відповідь партнера" : "Partner response"}</div>
                  <p>{item.response_message}</p>
                  <div className="opportunityResponseLinks">
                    {item.response_contact_email ? (
                      <a className="textButton" href={`mailto:${item.response_contact_email}`}>
                        {item.response_contact_email}
                      </a>
                    ) : null}
                    {item.response_contact_url ? (
                      <a className="textButton" href={item.response_contact_url} target="_blank" rel="noopener noreferrer">
                        {ua ? "Відкрити посилання" : "Open link"} ↗
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="privacyNote">{ua ? "Очікується відповідь партнера." : "Awaiting partner response."}</p>
              )}

              <Link className="textButton" href={withLocale(`/opportunities/${item.opportunity_id}`, locale)}>
                {ua ? "Переглянути можливість" : "View opportunity"} →
              </Link>
            </article>
          ))}

          {!interests.length ? (
            <p className="emptyState">
              {ua
                ? "Ви ще не надсилали запитів зацікавленості."
                : "You have not sent any interest requests yet."}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
