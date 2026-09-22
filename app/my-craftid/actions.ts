"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";

export async function createWorkshopCraftId(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const { supabase, userId, entities } = await getOwnedCraftId();

  if (!userId) redirect(lang === "uk" ? "/login?lang=uk" : "/login");

  const hasProfessional = entities.some((entity) => entity.entity_type === "professional");
  const hasWorkshop = entities.some((entity) => entity.entity_type === "workshop");

  if (!hasProfessional) {
    redirect("/my-craftid" + (lang === "uk" ? "?lang=uk&" : "?") + "error=" +
      encodeURIComponent(lang === "uk"
        ? "Спочатку створіть персональний CraftID."
        : "Create a personal CraftID first."));
  }

  if (hasWorkshop) {
    const workshop = entities.find((entity) => entity.entity_type === "workshop")!;
    redirect("/my-craftid" + ownerWorkspaceQuery(lang, workshop.id, { message: "workshop_exists" }));
  }

  const displayName = lang === "uk" ? "Нова майстерня" : "New workshop";
  const { data, error } = await supabase.rpc("create_own_craftid", {
    p_entity_type: "workshop",
    p_display_name: displayName,
  });

  if (error) {
    redirect("/my-craftid" + (lang === "uk" ? "?lang=uk&" : "?") + "error=" + encodeURIComponent(error.message));
  }

  const created = Array.isArray(data) ? data[0] : data;
  const entityId = created?.entity_id;
  if (!entityId) {
    redirect("/my-craftid" + (lang === "uk" ? "?lang=uk&" : "?") + "error=" +
      encodeURIComponent("Workshop CraftID was created but could not be selected."));
  }

  revalidatePath("/my-craftid");
  redirect("/my-craftid" + ownerWorkspaceQuery(lang, entityId, { message: "workshop_created" }));
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
