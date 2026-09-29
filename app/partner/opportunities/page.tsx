/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom, localeQuery } from "@/lib/i18n";
import {
  europeanCountryOptions,
  opportunityTypeLabel,
} from "@/lib/opportunities";
import { OpportunityEditor } from "./opportunity-editor";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    lang?: string;
    edit?: string;
    error?: string;
    message?: string;
  }>;
};

type PartnerOrg = {
  id: string;
  legal_name_en: string;
  legal_name_uk: string | null;
  short_name_en: string | null;
  short_name_uk: string | null;
  country_code: string;
  partner_role: string;
};

type Opportunity = {
  id: string;
  partner_organisation_id: string;
  partner_name: string;
  partner_country_code: string;
  partner_role: string;
  partner_logo_path: string | null;
  title: string;
  summary: string;
  opportunity_type: string;
  content_language: string;
  target_entity: string;
  location_mode: string;
  location_country_code: string | null;
  location_city: string | null;
  eligibility_scope: string;
  eligible_countries: string[];
  starts_on: string | null;
  ends_on: string | null;
  deadline_date: string | null;
  external_apply_url: string | null;
  public_contact_name: string | null;
  public_contact_email: string | null;
  allow_interest: boolean;
  is_published: boolean;
  image_path: string | null;
  updated_at: string;
};


export default async function PartnerOpportunitiesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const q = localeQuery(locale);
  const ua = locale === "uk";
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    redirect(`/partner/login${q}`);
  }

  const [
    { data: orgData, error: orgError },
    { data: opportunityData, error: opportunityError },
  ] = await Promise.all([
    supabase.rpc("current_partner_organisations"),
    supabase.rpc("partner_opportunities"),
  ]);

  if (orgError) throw new Error(orgError.message);
  if (opportunityError) throw new Error(opportunityError.message);

  const organisations = (orgData ?? []) as PartnerOrg[];
  if (!organisations.length) {
    redirect(
      `/partner/login${q ? `${q}&` : "?"}error=${encodeURIComponent(
        ua
          ? "Цей обліковий запис не має призначеного партнерського доступу CraftID."
          : "This account does not have assigned CraftID partner access.",
      )}`,
    );
  }

  const { data: mustChangePassword } = await supabase.rpc(
    "current_partner_password_change_required",
  );
  if (mustChangePassword) redirect(`/partner/password${q}`);

  const opportunities = (opportunityData ?? []) as Opportunity[];
  const edit = sp.edit
    ? opportunities.find((item) => item.id === sp.edit) ?? null
    : null;
  const editImageUrl = edit?.image_path
    ? supabase.storage.from("opportunity-images").getPublicUrl(edit.image_path).data.publicUrl
    : null;
  const countries = europeanCountryOptions(locale);

  return (
    <main className="workspacePage">
      <div className="container">
        <Link className="backLink" href={`/partner${q}`}>
          ← {ua ? "Робочий простір партнера" : "Partner workspace"}
        </Link>

        <div className="partnerPortalTop">
          <div>
            <div className="eyebrow">{ua ? "Партнерський контент" : "Partner content"}</div>
            <h1>{ua ? "Можливості для ремісників і майстерень" : "Opportunities for craftspeople and workshops"}</h1>
            <p className="workspaceIntro">
              {ua
                ? "Додавайте гранти, відкриті конкурси, навчання, ярмарки, виставки, резиденції, програми підтримки та події."
                : "Publish grants, open calls, training, fairs, exhibitions, residencies, support programmes and events."}
            </p>
          </div>
          <Link className="button" href="/opportunities">
            {ua ? "Публічний каталог" : "Public directory"} →
          </Link>
        </div>

        {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
        {sp.message ? (
          <p className="formMessage">{ua ? "Збережено." : "Saved."}</p>
        ) : null}

        <div className="partnerOpportunityLayout">
          <section className="adminPanel">
            <div className="adminPanelHeader">
              <div>
                <div className="eyebrow">{ua ? "Опублікований контент" : "Organisation content"}</div>
                <h2>{ua ? "Ваші можливості" : "Your opportunities"}</h2>
              </div>
              <span>{opportunities.length}</span>
            </div>

            <div className="partnerOpportunityList">
              {opportunities.map((item) => {
                const visualUrl = item.image_path
                  ? supabase.storage.from("opportunity-images").getPublicUrl(item.image_path).data.publicUrl
                  : item.partner_logo_path
                    ? supabase.storage.from("partner-logos").getPublicUrl(item.partner_logo_path).data.publicUrl
                    : null;

                return (
                <article className="partnerOpportunityRow" key={item.id}>
                  {visualUrl ? (
                    <div className={item.image_path ? "partnerOpportunityThumb cover" : "partnerOpportunityThumb logo"}>
                      <img src={visualUrl} alt="" />
                    </div>
                  ) : null}
                  <div>
                    <span className="recordId">
                      {opportunityTypeLabel(locale, item.opportunity_type)} · {item.partner_country_code}
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <small>
                      {item.partner_name} ·{" "}
                      {item.is_published
                        ? ua
                          ? "Опубліковано"
                          : "Published"
                        : ua
                          ? "Чернетка"
                          : "Draft"}
                      {item.deadline_date
                        ? ` · ${ua ? "Дедлайн" : "Deadline"} ${item.deadline_date}`
                        : ""}
                    </small>
                  </div>
                  <Link
                    className="textButton"
                    href={`/partner/opportunities${q ? `${q}&` : "?"}edit=${item.id}`}
                  >
                    {ua ? "Редагувати" : "Edit"}
                  </Link>
                </article>
                );
              })}
              {!opportunities.length ? (
                <p className="emptyState">
                  {ua ? "Можливостей ще немає." : "No opportunities yet."}
                </p>
              ) : null}
            </div>
          </section>

          <aside className="adminPanel">
            <div className="eyebrow">
              {edit
                ? ua
                  ? "Редагувати"
                  : "Edit opportunity"
                : ua
                  ? "Нова можливість"
                  : "New opportunity"}
            </div>
            <h2>{edit?.title ?? (ua ? "Додати пропозицію" : "Add opportunity")}</h2>

            <OpportunityEditor
              key={edit?.id ?? "new-opportunity"}
              locale={locale}
              organisations={organisations}
              edit={edit}
              countries={countries}
              editImageUrl={editImageUrl}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
