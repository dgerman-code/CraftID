"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom, localeQuery } from "@/lib/i18n";

function dateOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}


type OpportunityFormState = {
  error: string | null;
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
  const image = formData.get("image");
  const removeImage = formData.get("removeImage") === "on";
  const imageFile = image instanceof File && image.size > 0 ? image : null;

  if (imageFile) {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(imageFile.type) || imageFile.size > 5 * 1024 * 1024) {
      return {
        error:
          lang === "uk"
            ? "Зображення має бути PNG, JPG або WebP розміром до 5 МБ."
            : "Use a PNG, JPG or WebP image up to 5 MB.",
      };
    }
  }

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    redirect(`/partner/login${q}`);
  }

  const { data: mustChangePassword } = await supabase.rpc(
    "current_partner_password_change_required",
  );
  if (mustChangePassword) redirect(`/partner/password${q}`);

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

  const opportunityId = String(data);

  if (imageFile) {
    const ext =
      imageFile.type === "image/png"
        ? "png"
        : imageFile.type === "image/webp"
          ? "webp"
          : "jpg";
    const imagePath = `${partnerId}/${opportunityId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("opportunity-images")
      .upload(imagePath, await imageFile.arrayBuffer(), {
        contentType: imageFile.type,
        upsert: false,
      });

    if (uploadError) {
      redirect(
        `/partner/opportunities${q ? `${q}&` : "?"}edit=${encodeURIComponent(
          opportunityId,
        )}&error=${encodeURIComponent(
          `Opportunity saved, but image upload failed: ${uploadError.message}`,
        )}`,
      );
    }

    const { data: oldImagePath, error: imageLinkError } = await supabase.rpc(
      "partner_set_opportunity_image",
      {
        p_opportunity_id: opportunityId,
        p_image_path: imagePath,
      },
    );

    if (imageLinkError) {
      await supabase.storage.from("opportunity-images").remove([imagePath]);
      redirect(
        `/partner/opportunities${q ? `${q}&` : "?"}edit=${encodeURIComponent(
          opportunityId,
        )}&error=${encodeURIComponent(
          `Opportunity saved, but image could not be linked: ${imageLinkError.message}`,
        )}`,
      );
    }

    if (oldImagePath && oldImagePath !== imagePath) {
      await supabase.storage
        .from("opportunity-images")
        .remove([String(oldImagePath)]);
    }
  } else if (removeImage) {
    const { data: oldImagePath, error: imageRemoveError } = await supabase.rpc(
      "partner_set_opportunity_image",
      {
        p_opportunity_id: opportunityId,
        p_image_path: null,
      },
    );

    if (imageRemoveError) {
      redirect(
        `/partner/opportunities${q ? `${q}&` : "?"}edit=${encodeURIComponent(
          opportunityId,
        )}&error=${encodeURIComponent(
          `Opportunity saved, but image could not be removed: ${imageRemoveError.message}`,
        )}`,
      );
    }

    if (oldImagePath) {
      await supabase.storage
        .from("opportunity-images")
        .remove([String(oldImagePath)]);
    }
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

  const { data: mustChangePassword } = await supabase.rpc(
    "current_partner_password_change_required",
  );
  if (mustChangePassword) redirect(`/partner/password${q}`);

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


async function requirePartnerActionSession(lang: ReturnType<typeof localeFrom>) {
  const q = localeQuery(lang);
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();

  if (!userResult.user) {
    redirect(`/partner/login${q}`);
  }

  const { data: mustChangePassword } = await supabase.rpc(
    "current_partner_password_change_required",
  );
  if (mustChangePassword) redirect(`/partner/password${q}`);

  return { supabase, q };
}

export async function archiveOpportunity(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const opportunityId = String(formData.get("opportunityId") ?? "").trim();
  const { supabase, q } = await requirePartnerActionSession(lang);

  const { error } = await supabase.rpc("partner_set_opportunity_archived", {
    p_opportunity_id: opportunityId,
    p_archived: true,
  });

  if (error) {
    redirect(
      `/partner/opportunities${q ? `${q}&` : "?"}edit=${encodeURIComponent(
        opportunityId,
      )}&error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/partner/opportunities");
  revalidatePath("/opportunities");
  redirect(
    `/partner/opportunities${q ? `${q}&` : "?"}edit=${encodeURIComponent(
      opportunityId,
    )}&message=archived`,
  );
}

export async function restoreOpportunity(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const opportunityId = String(formData.get("opportunityId") ?? "").trim();
  const { supabase, q } = await requirePartnerActionSession(lang);

  const { error } = await supabase.rpc("partner_set_opportunity_archived", {
    p_opportunity_id: opportunityId,
    p_archived: false,
  });

  if (error) {
    redirect(
      `/partner/opportunities${q ? `${q}&` : "?"}edit=${encodeURIComponent(
        opportunityId,
      )}&error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/partner/opportunities");
  revalidatePath("/opportunities");
  redirect(
    `/partner/opportunities${q ? `${q}&` : "?"}edit=${encodeURIComponent(
      opportunityId,
    )}&message=restored`,
  );
}

export async function deleteOpportunity(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const opportunityId = String(formData.get("opportunityId") ?? "").trim();
  const { supabase, q } = await requirePartnerActionSession(lang);

  const { data: imagePath, error } = await supabase.rpc(
    "partner_delete_opportunity",
    {
      p_opportunity_id: opportunityId,
    },
  );

  if (error) {
    redirect(
      `/partner/opportunities${q ? `${q}&` : "?"}edit=${encodeURIComponent(
        opportunityId,
      )}&error=${encodeURIComponent(error.message)}`,
    );
  }

  if (imagePath) {
    await supabase.storage
      .from("opportunity-images")
      .remove([String(imagePath)]);
  }

  revalidatePath("/partner/opportunities");
  revalidatePath("/opportunities");
  redirect(
    `/partner/opportunities${q ? `${q}&` : "?"}message=deleted`,
  );
}
