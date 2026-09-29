/* eslint-disable @next/next/no-img-element */
"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { supportedLocales } from "@/lib/i18n";
import {
  opportunityTypes,
  opportunityTypeLabel,
} from "@/lib/opportunities";
import { saveOpportunityWithState } from "../actions";

type PartnerOrg = {
  id: string;
  legal_name_en: string;
  legal_name_uk: string | null;
  short_name_en: string | null;
  short_name_uk: string | null;
  country_code: string;
};

export type OpportunityFormRecord = {
  id: string;
  partner_organisation_id: string;
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
};

type Props = {
  locale: Locale;
  organisations: PartnerOrg[];
  edit: OpportunityFormRecord | null;
  countries: { code: string; label: string }[];
  editImageUrl?: string | null;
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

export function OpportunityEditor({
  locale,
  organisations,
  edit,
  countries,
  editImageUrl,
}: Props) {
  const ua = locale === "uk";
  const [state, formAction, pending] = useActionState(
    saveOpportunityWithState,
    { error: null as string | null },
  );

  const [values, setValues] = useState(() => ({
    partnerId: edit?.partner_organisation_id ?? organisations[0]?.id ?? "",
    title: edit?.title ?? "",
    summary: edit?.summary ?? "",
    opportunityType: edit?.opportunity_type ?? "open_call",
    contentLanguage: edit?.content_language ?? "en",
    targetEntity: edit?.target_entity ?? "both",
    locationMode: edit?.location_mode ?? "online",
    locationCountryCode: edit?.location_country_code ?? "",
    locationCity: edit?.location_city ?? "",
    eligibilityScope: edit?.eligibility_scope ?? "partner_country",
    eligibleCountries: edit?.eligible_countries ?? [],
    startsOn: edit?.starts_on ?? "",
    endsOn: edit?.ends_on ?? "",
    deadlineDate: edit?.deadline_date ?? "",
    externalApplyUrl: edit?.external_apply_url ?? "",
    publicContactName: edit?.public_contact_name ?? "",
    publicContactEmail: edit?.public_contact_email ?? "",
    allowInterest: edit?.allow_interest ?? true,
    isPublished: edit?.is_published ?? false,
  }));

  const setField = (name: string, value: string | boolean) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  const toggleCountry = (code: string, checked: boolean) => {
    setValues((current) => ({
      ...current,
      eligibleCountries: checked
        ? Array.from(new Set([...current.eligibleCountries, code]))
        : current.eligibleCountries.filter((item) => item !== code),
    }));
  };

  return (
    <form className="adminStatusForm" action={formAction}>
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="id" value={edit?.id ?? ""} />

      {state.error ? (
        <p className="formMessage error opportunityFormError" role="alert">
          {state.error}
        </p>
      ) : null}

      <label>
        {ua ? "Організація" : "Organisation"}
        <select
          name="partnerId"
          required
          value={values.partnerId}
          onChange={(event) => setField("partnerId", event.target.value)}
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
          value={values.title}
          onChange={(event) => setField("title", event.target.value)}
        />
      </label>

      <label>
        {ua ? "Короткий опис" : "Short description"}
        <textarea
          name="summary"
          required
          minLength={10}
          rows={5}
          value={values.summary}
          onChange={(event) => setField("summary", event.target.value)}
        />
      </label>

      <div className="adminFormSplit">
        <label>
          {ua ? "Тип" : "Type"}
          <select
            name="opportunityType"
            value={values.opportunityType}
            onChange={(event) => setField("opportunityType", event.target.value)}
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
            value={values.contentLanguage}
            onChange={(event) => setField("contentLanguage", event.target.value)}
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
          value={values.targetEntity}
          onChange={(event) => setField("targetEntity", event.target.value)}
        >
          <option value="both">
            {ua ? "Professional і Workshop" : "Professional and Workshop"}
          </option>
          <option value="professional">Professional</option>
          <option value="workshop">Workshop</option>
        </select>
      </label>

      <div className="opportunityImageField">
        <div>
          <div className="eyebrow">{ua ? "Зображення" : "Opportunity image"}</div>
          <p className="fieldHelp">
            {ua
              ? "Необов’язкове зображення для картки та сторінки можливості. Якщо його немає, CraftID використає логотип партнерської організації."
              : "Optional cover image for the opportunity card and detail page. If none is provided, CraftID falls back to the partner organisation logo."}
          </p>
        </div>
        {editImageUrl ? (
          <div className="opportunityImagePreview">
            <img src={editImageUrl} alt="" />
          </div>
        ) : null}
        <input
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
        />
        <small className="fieldHelp">PNG, JPG or WebP · max 5 MB</small>
        {edit?.image_path ? (
          <label className="adminCheckbox">
            <input name="removeImage" type="checkbox" />
            {ua ? "Видалити поточне зображення" : "Remove current image"}
          </label>
        ) : null}
      </div>

      <div className="adminFormDivider" />
      <div>
        <div className="eyebrow">
          {ua ? "Де відбувається" : "Where it takes place"}
        </div>
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
          value={values.locationMode}
          onChange={(event) => setField("locationMode", event.target.value)}
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
            value={values.locationCountryCode}
            onChange={(event) =>
              setField("locationCountryCode", event.target.value)
            }
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
            value={values.locationCity}
            onChange={(event) => setField("locationCity", event.target.value)}
          />
        </label>
      </div>

      <div className="adminFormDivider" />
      <div>
        <div className="eyebrow">
          {ua ? "Географія доступності" : "Geographic eligibility"}
        </div>
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
          value={values.eligibilityScope}
          onChange={(event) =>
            setField("eligibilityScope", event.target.value)
          }
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
            {ua
              ? "Міжнародно / без обмежень"
              : "International / no country restriction"}
          </option>
        </select>
      </label>

      <fieldset className="opportunityCountryPicker">
        <legend>{ua ? "Вибрані країни" : "Selected countries"}</legend>
        <p className="fieldHelp">
          {ua
            ? "Використовується лише для режиму «Вибрані країни». Просто відмітьте будь-які потрібні країни."
            : "Used only for Selected countries. Tick any countries independently."}
        </p>
        <div className="opportunityCountryGrid">
          {countries.map((country) => (
            <label className="opportunityCountryOption" key={country.code}>
              <input
                type="checkbox"
                name="eligibleCountries"
                value={country.code}
                checked={values.eligibleCountries.includes(country.code)}
                onChange={(event) =>
                  toggleCountry(country.code, event.target.checked)
                }
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
            value={values.startsOn}
            onChange={(event) => setField("startsOn", event.target.value)}
          />
        </label>
        <label>
          {ua ? "Завершення" : "Ends"}
          <input
            type="date"
            name="endsOn"
            value={values.endsOn}
            onChange={(event) => setField("endsOn", event.target.value)}
          />
        </label>
      </div>

      <label>
        {ua ? "Дедлайн подачі" : "Application deadline"}
        <input
          type="date"
          name="deadlineDate"
          value={values.deadlineDate}
          onChange={(event) => setField("deadlineDate", event.target.value)}
        />
      </label>

      <div className="adminFormDivider" />
      <div>
        <div className="eyebrow">
          {ua ? "Як взаємодіяти" : "Interaction"}
        </div>
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
          value={values.externalApplyUrl}
          onChange={(event) =>
            setField("externalApplyUrl", event.target.value)
          }
        />
      </label>

      <div className="adminFormSplit">
        <label>
          {ua
            ? "Контактна особа для можливості"
            : "Opportunity contact name"}
          <input
            name="publicContactName"
            value={values.publicContactName}
            onChange={(event) =>
              setField("publicContactName", event.target.value)
            }
          />
        </label>
        <label>
          {ua ? "Публічний контактний email" : "Public contact email"}
          <input
            name="publicContactEmail"
            type="email"
            value={values.publicContactEmail}
            onChange={(event) =>
              setField("publicContactEmail", event.target.value)
            }
          />
        </label>
      </div>

      <label className="adminCheckbox">
        <input
          name="allowInterest"
          type="checkbox"
          checked={values.allowInterest}
          onChange={(event) => setField("allowInterest", event.target.checked)}
        />
        {ua
          ? "Дозволити «Я зацікавлений» через CraftID"
          : 'Allow "I’m interested" through CraftID'}
      </label>

      <label className="adminCheckbox">
        <input
          name="isPublished"
          type="checkbox"
          checked={values.isPublished}
          onChange={(event) => setField("isPublished", event.target.checked)}
        />
        {ua ? "Опублікувати" : "Publish publicly"}
      </label>

      <button className="button buttonPrimary" type="submit" disabled={pending}>
        {pending
          ? ua
            ? "Збереження…"
            : "Saving…"
          : edit
            ? ua
              ? "Зберегти"
              : "Save changes"
            : ua
              ? "Створити"
              : "Create opportunity"}
      </button>
    </form>
  );
}
