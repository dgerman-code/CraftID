"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom, localeQuery } from "@/lib/i18n";

function dateOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}


export type OpportunityFormState = {
  error: string | null;
};

export const initialOpportunityFormState: OpportunityFormState = {
  error: null,
};

function opportunityPayload(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim() || null,
    partnerId: String(formData.get("partnerId") ?? "").trim(),
    selectedCountries: formData
      .getAll("eligibleCountries")
      .map((item) => String(item).trim().toUpperCase())
      .filter(Boolean),
  };
}

function opportunityErrorMessage(message: string, lang: ReturnType<typeof localeFrom>) {
  if (message.includes("permission denied for function partner_save_opportunity_impl")) {
    return lang === "uk"
      ? "Не вдалося зберегти можливість через помилку доступу. Оновіть сторінку та повторіть спробу."
      : "The opportunity could not be saved because of an access error. Refresh the page and try again.";
  }

  return message;
}

export async function saveOpportunityWithState(
  _previousState: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const q = localeQuery(lang);
  const { id, partnerId, selectedCountries } = opportunityPayload(formData);

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    redirect(`/partner/login${q}`);
  }

  const { data, error } = await supabase.rpc("partner_save_opportunity", {
    p_id: id,
    p_partner_organisation_id: partnerId,
    p_title: String(formData.get("title") ?? "").trim(),
    p_summary: String(formData.get("summary") ?? "").trim(),
    p_opportunity_type: String(formData.get("opportunityType") ?? "").trim(),
    p_content_language: String(formData.get("contentLanguage") ?? "en").trim().toLowerCase(),
    p_target_entity: String(formData.get("targetEntity") ?? "both").trim(),
    p_location_mode: String(formData.get("locationMode") ?? "online").trim(),
    p_location_country_code: String(formData.get("locationCountryCode") ?? "").trim() || null,
    p_location_city: String(formData.get("locationCity") ?? "").trim() || null,
    p_eligibility_scope: String(formData.get("eligibilityScope") ?? "partner_country").trim(),
    p_eligible_countries: selectedCountries,
    p_starts_on: dateOrNull(formData.get("startsOn")),
    p_ends_on: dateOrNull(formData.get("endsOn")),
    p_deadline_date: dateOrNull(formData.get("deadlineDate")),
    p_external_apply_url: String(formData.get("externalApplyUrl") ?? "").trim() || null,
    p_public_contact_name: String(formData.get("publicContactName") ?? "").trim() || null,
    p_public_contact_email: String(formData.get("publicContactEmail") ?? "").trim() || null,
    p_allow_interest: formData.get("allowInterest") === "on",
    p_is_published: formData.get("isPublished") === "on",
  });

  if (error) {
    return {
      error: opportunityErrorMessage(error.message, lang),
    };
  }

  revalidatePath("/partner/opportunities");
  revalidatePath("/opportunities");
  revalidatePath("/network");
  redirect(
    `/partner/opportunities${q ? `${q}&` : "?"}message=saved&edit=${encodeURIComponent(
      String(data),
    )}`,
  );
}

export async function saveOpportunity(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const q = localeQuery(lang);
  const id = String(formData.get("id") ?? "").trim() || null;
  const partnerId = String(formData.get("partnerId") ?? "").trim();
  const selectedCountries = formData
    .getAll("eligibleCountries")
    .map((item) => String(item).trim().toUpperCase())
    .filter(Boolean);

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    redirect(`/partner/login${q}`);
  }

  const { data, error } = await supabase.rpc("partner_save_opportunity", {
    p_id: id,
    p_partner_organisation_id: partnerId,
    p_title: String(formData.get("title") ?? "").trim(),
    p_summary: String(formData.get("summary") ?? "").trim(),
    p_opportunity_type: String(formData.get("opportunityType") ?? "").trim(),
    p_content_language: String(formData.get("contentLanguage") ?? "en").trim().toLowerCase(),
    p_target_entity: String(formData.get("targetEntity") ?? "both").trim(),
    p_location_mode: String(formData.get("locationMode") ?? "online").trim(),
    p_location_country_code: String(formData.get("locationCountryCode") ?? "").trim() || null,
    p_location_city: String(formData.get("locationCity") ?? "").trim() || null,
    p_eligibility_scope: String(formData.get("eligibilityScope") ?? "partner_country").trim(),
    p_eligible_countries: selectedCountries,
    p_starts_on: dateOrNull(formData.get("startsOn")),
    p_ends_on: dateOrNull(formData.get("endsOn")),
    p_deadline_date: dateOrNull(formData.get("deadlineDate")),
    p_external_apply_url: String(formData.get("externalApplyUrl") ?? "").trim() || null,
    p_public_contact_name: String(formData.get("publicContactName") ?? "").trim() || null,
    p_public_contact_email: String(formData.get("publicContactEmail") ?? "").trim() || null,
    p_allow_interest: formData.get("allowInterest") === "on",
    p_is_published: formData.get("isPublished") === "on",
  });

  if (error) {
    redirect(`/partner/opportunities${q ? `${q}&` : "?"}error=${encodeURIComponent(error.message)}${id ? `&edit=${id}` : ""}`);
  }

  revalidatePath("/partner/opportunities");
  revalidatePath("/opportunities");
  revalidatePath("/network");
  redirect(`/partner/opportunities${q ? `${q}&` : "?"}message=saved&edit=${encodeURIComponent(String(data))}`);
}

export async function respondToInterest(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const q = localeQuery(lang);
  const requestId = String(formData.get("requestId") ?? "").trim();

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    redirect(`/partner/login${q}`);
  }

  const { error } = await supabase.rpc("partner_respond_to_interest", {
    p_request_id: requestId,
    p_response_message: String(formData.get("responseMessage") ?? "").trim(),
    p_response_contact_email: String(formData.get("responseContactEmail") ?? "").trim() || null,
    p_response_contact_url: String(formData.get("responseContactUrl") ?? "").trim() || null,
  });

  if (error) {
    redirect(`/partner/interests${q ? `${q}&` : "?"}error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/partner/interests");
  revalidatePath("/my-craftid/opportunities");
  redirect(`/partner/interests${q ? `${q}&` : "?"}message=responded`);
}
