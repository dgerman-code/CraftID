"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";

export async function createAdditionalCraftId(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const requestedType = String(formData.get("entityType") ?? "");
  const entityType =
    requestedType === "professional" || requestedType === "workshop"
      ? requestedType
      : null;

  if (!entityType) {
    redirect(
      "/my-craftid" +
        (lang === "uk" ? "?lang=uk&" : "?") +
        "error=" +
        encodeURIComponent(lang === "uk" ? "Невірний тип CraftID." : "Invalid CraftID type."),
    );
  }

  const { supabase, userId, entities } = await getOwnedCraftId();
  if (!userId) redirect(lang === "uk" ? "/login?lang=uk" : "/login");

  const existing = entities.find((entity) => entity.entity_type === entityType);
  if (existing) {
    redirect(
      "/my-craftid" +
        ownerWorkspaceQuery(lang, existing.id, {
          message: entityType === "professional" ? "professional_exists" : "workshop_exists",
        }),
    );
  }

  const displayName =
    entityType === "professional"
      ? lang === "uk" ? "Новий професіонал" : "New professional"
      : lang === "uk" ? "Нова майстерня" : "New workshop";

  const { data, error } = await supabase.rpc("create_own_craftid", {
    p_entity_type: entityType,
    p_display_name: displayName,
  });

  if (error) {
    redirect(
      "/my-craftid" +
        (lang === "uk" ? "?lang=uk&" : "?") +
        "error=" +
        encodeURIComponent(error.message),
    );
  }

  const created = Array.isArray(data) ? data[0] : data;
  const entityId = created?.entity_id;
  if (!entityId) {
    redirect(
      "/my-craftid" +
        (lang === "uk" ? "?lang=uk&" : "?") +
        "error=" +
        encodeURIComponent(
          lang === "uk"
            ? "CraftID створено, але новий запис не вдалося вибрати."
            : "CraftID was created but the new record could not be selected.",
        ),
    );
  }

  revalidatePath("/my-craftid");
  redirect(
    "/my-craftid" +
      ownerWorkspaceQuery(lang, entityId, {
        message: entityType === "professional" ? "professional_created" : "workshop_created",
      }),
  );
}

export async function closeCraftIdAccount(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const confirmation = String(formData.get("confirmation") ?? "").trim().toLowerCase();
  const expected = lang === "uk" ? "закрити" : "close";

  if (confirmation !== expected) {
    redirect(
      "/my-craftid" +
        (lang === "uk" ? "?lang=uk&" : "?") +
        "error=" +
        encodeURIComponent(
          lang === "uk"
            ? "Введіть «закрити», щоб підтвердити закриття облікового запису."
            : 'Type "close" to confirm account closure.',
        ),
    );
  }

  const { supabase, userId } = await getOwnedCraftId();
  if (!userId) redirect(lang === "uk" ? "/login?lang=uk" : "/login");

  const { error } = await supabase.rpc("close_my_craftid_account");
  if (error) {
    redirect(
      "/my-craftid" +
        (lang === "uk" ? "?lang=uk&" : "?") +
        "error=" +
        encodeURIComponent(error.message),
    );
  }

  await supabase.auth.signOut();
  redirect(
    (lang === "uk" ? "/?lang=uk&" : "/?") +
      "account=closed",
  );
}
