"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom, localeQuery } from "@/lib/i18n";
import { workspaceActionCopy } from "@/lib/workspace-action-copy";

function errorUrl(path: string, lang: ReturnType<typeof localeFrom>, message: string) {
  const q = localeQuery(lang);
  return path + (q ? q + "&" : "?") + "error=" + encodeURIComponent(message);
}

export async function createAdditionalCraftId(formData: FormData) {
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const t = workspaceActionCopy[lang];
  const requestedType = String(formData.get("entityType") ?? "");
  const entityType =
    requestedType === "professional" || requestedType === "workshop"
      ? requestedType
      : null;

  if (!entityType) {
    redirect(errorUrl("/my-craftid", lang, t.invalidCraftIdType));
  }

  const { supabase, userId, entities } = await getOwnedCraftId();
  if (!userId) redirect(`/login${localeQuery(lang)}`);

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
    entityType === "professional" ? t.newProfessional : t.newWorkshop;

  const { data, error } = await supabase.rpc("create_own_craftid", {
    p_entity_type: entityType,
    p_display_name: displayName,
  });

  if (error) {
    redirect(errorUrl("/my-craftid", lang, error.message));
  }

  const created = Array.isArray(data) ? data[0] : data;
  const entityId = created?.entity_id;
  if (!entityId) {
    redirect(errorUrl("/my-craftid", lang, t.createdSelectFailed));
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
  const lang = localeFrom(String(formData.get("lang") ?? "en"));
  const t = workspaceActionCopy[lang];
  const confirmation = String(formData.get("confirmation") ?? "").trim().toLowerCase();
  const expected = t.closeKeyword;

  if (confirmation !== expected) {
    redirect(errorUrl("/my-craftid", lang, t.closeConfirm));
  }

  const { supabase, userId } = await getOwnedCraftId();
  if (!userId) redirect(`/login${localeQuery(lang)}`);

  const { error } = await supabase.rpc("close_my_craftid_account");
  if (error) {
    redirect(errorUrl("/my-craftid", lang, error.message));
  }

  await supabase.auth.signOut();
  const q = localeQuery(lang);
  redirect("/" + (q ? q + "&" : "?") + "account=closed");
}
