import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom, localeQuery, supportedLocales } from "@/lib/i18n";
import {
  europeanCountryOptions,
  opportunityTypes,
  opportunityTypeLabel,
} from "@/lib/opportunities";
import { saveOpportunity } from "../actions";

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
  updated_at: string;
};

const languageLabels: Record<string, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  nl: "Nederlands",
  pl: "Polski",
  it: "Italiano",
  es: "Español",
  uk: "Українська",
};

export default async function PartnerOpportunitiesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const q = localeQuery(locale);
  const ua = locale === "uk";
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    redirect(`/login${q ? `${q}&` : "?"}next=${encodeURIComponent(`/partner/opportunities${q}`)}`);
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
  if (!organisations.length) redirect(`/my-craftid${q}`);

  const opportunities = (opportunityData ?? []) as Opportunity[];
  const edit = sp.edit
    ? opportunities.find((item) => item.id === sp.edit) ?? null
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
              {opportunities.map((item) => (
                <article className="partnerOpportunityRow" key={item.id}>
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
              ))}
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

            <form className="adminStatusForm" action={saveOpportunity}>
              <input type="hidden" name="lang" value={locale} />
              <input type="hidden" name="id" value={edit?.id ?? ""} />

              <label>
                {ua ? "Організація" : "Organisation"}
                <select
                  name="partnerId"
                  required
                  defaultValue={
                    edit?.partner_organisation_id ?? organisations[0]?.id ?? ""
                  }
                >
                  {organisations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.country_code} ·{" "}
                      {ua
                        ? org.short_name_uk ||
                          org.legal_name_uk ||
                          org.short_name_en ||
                          org.legal_name_en
                        : org.short_name_en || org.legal_name_en}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {ua ? "Назва" : "Title"}
                <input
                  name="title"
                  required
                  minLength={3}
                  defaultValue={edit?.title ?? ""}
                />
              </label>

              <label>
                {ua ? "Короткий опис" : "Short description"}
                <textarea
                  name="summary"
                  required
                  minLength={10}
                  rows={5}
                  defaultValue={edit?.summary ?? ""}
                />
              </label>

              <div className="adminFormSplit">
                <label>
                  {ua ? "Тип" : "Type"}
                  <select
                    name="opportunityType"
                    defaultValue={edit?.opportunity_type ?? "open_call"}
                  >
                    {opportunityTypes.map((type) => (
                      <option value={type} key={type}>
                        {opportunityTypeLabel(locale, type)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  {ua ? "Мова контенту" : "Content language"}
                  <select
                    name="contentLanguage"
                    defaultValue={edit?.content_language ?? "en"}
                  >
                    {supportedLocales.map((code) => (
                      <option key={code} value={code}>
                        {languageLabels[code] ?? code}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                {ua ? "Для кого" : "Eligible CraftID entity"}
                <select
                  name="targetEntity"
                  defaultValue={edit?.target_entity ?? "both"}
                >
                  <option value="both">{ua ? "Professional і Workshop" : "Professional and Workshop"}</option>
                  <option value="professional">Professional</option>
                  <option value="workshop">Workshop</option>
                </select>
              </label>

              <div className="adminFormDivider" />
              <div>
                <div className="eyebrow">{ua ? "Де відбувається" : "Where it takes place"}</div>
                <p className="fieldHelp">
                  {ua
                    ? "Місце проведення не визначає країни, для яких доступна можливість."
                    : "Event location is separate from the countries whose CraftID holders are eligible."}
                </p>
              </div>

              <label>
                {ua ? "Формат" : "Location mode"}
                <select
                  name="locationMode"
                  defaultValue={edit?.location_mode ?? "online"}
                >
                  <option value="online">{ua ? "Онлайн" : "Online"}</option>
                  <option value="onsite">{ua ? "Офлайн" : "On-site"}</option>
                  <option value="hybrid">{ua ? "Гібрид" : "Hybrid"}</option>
                </select>
              </label>

              <div className="adminFormSplit">
                <label>
                  {ua ? "Країна проведення" : "Location country"}
                  <select
                    name="locationCountryCode"
                    defaultValue={edit?.location_country_code ?? ""}
                  >
                    <option value="">—</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  {ua ? "Місто" : "City"}
                  <input
                    name="locationCity"
                    defaultValue={edit?.location_city ?? ""}
                  />
                </label>
              </div>

              <div className="adminFormDivider" />
              <div>
                <div className="eyebrow">{ua ? "Географія доступності" : "Geographic eligibility"}</div>
                <p className="fieldHelp">
                  {ua
                    ? "Вкажіть, власникам CraftID з яких країн ця пропозиція релевантна."
                    : "Choose which countries' CraftID holders can use this opportunity."}
                </p>
              </div>

              <label>
                {ua ? "Доступно для" : "Available to"}
                <select
                  name="eligibilityScope"
                  defaultValue={edit?.eligibility_scope ?? "partner_country"}
                >
                  <option value="partner_country">
                    {ua ? "Лише країна партнера" : "Partner country only"}
                  </option>
                  <option value="selected_countries">
                    {ua ? "Вибрані країни" : "Selected countries"}
                  </option>
                  <option value="all_europe">
                    {ua ? "Вся Європа" : "All Europe"}
                  </option>
                  <option value="international">
                    {ua ? "Міжнародно / без обмежень" : "International / no country restriction"}
                  </option>
                </select>
              </label>

              <fieldset className="opportunityCountryPicker">
                <legend>{ua ? "Вибрані країни" : "Selected countries"}</legend>
                <p className="fieldHelp">
                  {ua
                    ? "Використовується лише для режиму «Вибрані країни». Просто відмітьте будь-які потрібні країни — вони не повинні бути поруч у списку."
                    : "Used only for Selected countries. Tick any countries independently; they do not need to be adjacent in the list."}
                </p>
                <div className="opportunityCountryGrid">
                  {countries.map((country) => (
                    <label className="opportunityCountryOption" key={country.code}>
                      <input
                        type="checkbox"
                        name="eligibleCountries"
                        value={country.code}
                        defaultChecked={edit?.eligible_countries?.includes(country.code) ?? false}
                      />
                      <span>{country.label}</span>
                      <small>{country.code}</small>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="adminFormSplit">
                <label>
                  {ua ? "Початок" : "Starts"}
                  <input
                    type="date"
                    name="startsOn"
                    defaultValue={edit?.starts_on ?? ""}
                  />
                </label>
                <label>
                  {ua ? "Завершення" : "Ends"}
                  <input
                    type="date"
                    name="endsOn"
                    defaultValue={edit?.ends_on ?? ""}
                  />
                </label>
              </div>

              <label>
                {ua ? "Дедлайн подачі" : "Application deadline"}
                <input
                  type="date"
                  name="deadlineDate"
                  defaultValue={edit?.deadline_date ?? ""}
                />
              </label>

              <div className="adminFormDivider" />
              <div>
                <div className="eyebrow">{ua ? "Як взаємодіяти" : "Interaction"}</div>
                <p className="fieldHelp">
                  {ua
                    ? "Можна одночасно використовувати зовнішню заявку, прямий контакт і CraftID Interest Request."
                    : "You may combine an external application, direct organisation contact and the CraftID interest request."}
                </p>
              </div>

              <label>
                {ua ? "Зовнішнє посилання Apply" : "External Apply URL"}
                <input
                  name="externalApplyUrl"
                  type="url"
                  placeholder="https://"
                  defaultValue={edit?.external_apply_url ?? ""}
                />
              </label>

              <div className="adminFormSplit">
                <label>
                  {ua ? "Контактна особа для можливості" : "Opportunity contact name"}
                  <input
                    name="publicContactName"
                    defaultValue={edit?.public_contact_name ?? ""}
                  />
                </label>
                <label>
                  {ua ? "Публічний контактний email" : "Public contact email"}
                  <input
                    name="publicContactEmail"
                    type="email"
                    defaultValue={edit?.public_contact_email ?? ""}
                  />
                </label>
              </div>

              <label className="adminCheckbox">
                <input
                  name="allowInterest"
                  type="checkbox"
                  defaultChecked={edit?.allow_interest ?? true}
                />
                {ua
                  ? "Дозволити «Я зацікавлений» через CraftID"
                  : 'Allow "I’m interested" through CraftID'}
              </label>

              <label className="adminCheckbox">
                <input
                  name="isPublished"
                  type="checkbox"
                  defaultChecked={edit?.is_published ?? false}
                />
                {ua ? "Опублікувати" : "Publish publicly"}
              </label>

              <button className="button buttonPrimary" type="submit">
                {edit ? (ua ? "Зберегти" : "Save changes") : (ua ? "Створити" : "Create opportunity")}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}
