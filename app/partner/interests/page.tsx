import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom, localeQuery } from "@/lib/i18n";
import { formatCraftId } from "@/lib/craftid-format";
import { respondToInterest } from "../actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ lang?: string; error?: string; message?: string }>;
};

type Interest = {
  request_id: string;
  opportunity_id: string;
  opportunity_title: string;
  partner_organisation_id: string;
  entity_id: string;
  craftid_number: number;
  craftid_check_digits: string;
  entity_type: string;
  display_name: string | null;
  public_status: string;
  message: string | null;
  shared_email: string | null;
  shared_phone: string | null;
  response_message: string | null;
  response_contact_email: string | null;
  response_contact_url: string | null;
  responded_at: string | null;
  created_at: string;
};

export default async function PartnerInterestsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const q = localeQuery(locale);
  const ua = locale === "uk";

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    redirect(`/partner/login${q}`);
  }

  const { data: orgs } = await supabase.rpc("current_partner_organisations");
  if (!Array.isArray(orgs) || !orgs.length) {
    redirect(
      `/partner/login${q ? `${q}&` : "?"}error=${encodeURIComponent(
        ua
          ? "Цей обліковий запис не має призначеного партнерського доступу CraftID."
          : "This account does not have assigned CraftID partner access.",
      )}`,
    );
  }

  const { data, error } = await supabase.rpc("partner_interest_requests");
  if (error) throw new Error(error.message);
  const requests = (data ?? []) as Interest[];

  return (
    <main className="workspacePage">
      <div className="container">
        <Link className="backLink" href={`/partner${q}`}>
          ← {ua ? "Робочий простір партнера" : "Partner workspace"}
        </Link>

        <div className="eyebrow">{ua ? "Controlled introductions" : "Controlled introductions"}</div>
        <h1>{ua ? "Запити зацікавлених власників CraftID" : "CraftID holder interest requests"}</h1>
        <p className="workspaceIntro">
          {ua
            ? "Ви бачите лише ті контактні дані, якими власник CraftID свідомо поділився під час надсилання запиту."
            : "You only see contact details that the CraftID holder explicitly chose to share when sending the request."}
        </p>

        {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
        {sp.message ? <p className="formMessage">{ua ? "Відповідь збережено." : "Response saved."}</p> : null}

        <section className="partnerInterestList">
          {requests.map((request) => {
            const craftId = formatCraftId(
              request.craftid_number,
              request.craftid_check_digits,
            );
            return (
              <article className="partnerInterestCard" key={request.request_id}>
                <div className="partnerInterestHeader">
                  <div>
                    <span className="recordId">{request.opportunity_title}</span>
                    <h2>{request.display_name || `CraftID #${craftId}`}</h2>
                    <p>
                      {request.entity_type} · CraftID #{craftId}
                    </p>
                  </div>
                  {request.public_status === "published" ? (
                    <Link
                      className="textButton"
                      href={`/id/${craftId}`}
                      target="_blank"
                    >
                      {ua ? "Відкрити профіль" : "View CraftID"} ↗
                    </Link>
                  ) : null}
                </div>

                {request.message ? (
                  <div className="partnerInterestMessage">
                    <div className="eyebrow">{ua ? "Повідомлення" : "Message"}</div>
                    <p>{request.message}</p>
                  </div>
                ) : null}

                <dl className="partnerInterestContact">
                  <div>
                    <dt>Email</dt>
                    <dd>{request.shared_email || (ua ? "Не надано" : "Not shared")}</dd>
                  </div>
                  <div>
                    <dt>{ua ? "Телефон" : "Phone"}</dt>
                    <dd>{request.shared_phone || (ua ? "Не надано" : "Not shared")}</dd>
                  </div>
                  <div>
                    <dt>{ua ? "Надіслано" : "Sent"}</dt>
                    <dd>{new Date(request.created_at).toLocaleDateString(ua ? "uk-UA" : "en-GB")}</dd>
                  </div>
                </dl>

                {request.response_message ? (
                  <div className="partnerResponseRecorded">
                    <div className="eyebrow">{ua ? "Ваша відповідь" : "Your response"}</div>
                    <p>{request.response_message}</p>
                    <small>
                      {request.responded_at
                        ? new Date(request.responded_at).toLocaleString(ua ? "uk-UA" : "en-GB")
                        : ""}
                    </small>
                  </div>
                ) : (
                  <form className="workspaceForm partnerResponseForm" action={respondToInterest}>
                    <input type="hidden" name="lang" value={locale} />
                    <input type="hidden" name="requestId" value={request.request_id} />

                    <label>
                      {ua ? "Відповідь" : "Response"}
                      <textarea
                        name="responseMessage"
                        rows={5}
                        minLength={2}
                        required
                        placeholder={
                          ua
                            ? "Наприклад: Дякуємо за інтерес. Будь ласка, заповніть форму за посиланням нижче..."
                            : "For example: Thank you for your interest. Please complete the form using the link below..."
                        }
                      />
                    </label>

                    <div className="formGrid">
                      <label>
                        {ua ? "Контактний email" : "Contact email"}
                        <input name="responseContactEmail" type="email" />
                      </label>
                      <label>
                        {ua ? "Посилання / форма / зустріч" : "Link / form / meeting"}
                        <input name="responseContactUrl" type="url" placeholder="https://" />
                      </label>
                    </div>

                    <button className="button buttonPrimary" type="submit">
                      {ua ? "Надіслати відповідь" : "Send response"}
                    </button>
                  </form>
                )}
              </article>
            );
          })}

          {!requests.length ? (
            <p className="emptyState">
              {ua
                ? "Запитів зацікавлених ще немає."
                : "No interest requests yet."}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
