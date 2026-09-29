import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom } from "@/components/site-shell";
import { assignCraftIdNumber } from "./actions";
import { formatCraftIdWithHash } from "@/lib/craftid-format";
import { contentLocale, localeQuery } from "@/lib/i18n";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; error?: string; message?: string }> };

const formatId = formatCraftIdWithHash;

const copy = {
  en: {
    eyebrow: "Identifier administration",
    title: "Assign a specific CraftID number.",
    intro: "Numbers 1–100 are reserved for deliberate administrative assignment. Any other unused positive number may be assigned exceptionally, with a documented reason. Manual numbers do not indicate rank, status or recognition.",
    owner: "Owner user UUID",
    type: "Profile type",
    professional: "Professional",
    workshop: "Workshop",
    name: "Display name",
    number: "Requested number",
    reason: "Reason for manual assignment",
    assign: "Assign CraftID",
    history: "Recent manual assignments",
    empty: "No manual assignments have been recorded yet.",
    reserved: "Reserved range",
    exceptional: "Exceptional manual assignment",
    back: "Back to CraftID",
    success: "CraftID assigned:",
    guidance: "Use manual assignment only when there is a documented institutional reason. Automatic registration remains the default.",
  },
  uk: {
    eyebrow: "Адміністрування ідентифікаторів",
    title: "Призначити конкретний номер CraftID.",
    intro: "Номери 1–100 зарезервовані для свідомого адміністративного призначення. Будь-який інший вільний додатний номер також може бути призначений як виняток із документованою причиною. Ручний номер не означає ранг, статус або рівень визнання.",
    owner: "UUID користувача-власника",
    type: "Тип профілю",
    professional: "Професіонал",
    workshop: "Майстерня",
    name: "Відображуване ім’я",
    number: "Бажаний номер",
    reason: "Причина ручного призначення",
    assign: "Призначити CraftID",
    history: "Останні ручні призначення",
    empty: "Ручних призначень ще не зафіксовано.",
    reserved: "Зарезервований діапазон",
    exceptional: "Виняткове ручне призначення",
    back: "Назад до CraftID",
    success: "CraftID призначено:",
    guidance: "Використовуйте ручне призначення лише за наявності документованої інституційної причини. Автоматична реєстрація залишається стандартним режимом.",
  },
} as const;

export default async function IdentifiersPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[contentLocale(locale)];
  const q = localeQuery(locale);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) redirect(`/login${q}`);

  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect(`/my-craftid${q}`);

  const { data: events } = await supabase
    .from("audit_events")
    .select("id, entity_id, actor_user_id, metadata, created_at")
    .eq("action", "manual_craftid_assigned")
    .order("created_at", { ascending: false })
    .limit(25);

  const entityIds = [...new Set((events ?? []).map((event) => event.entity_id).filter(Boolean))] as string[];
  const { data: entities } = entityIds.length
    ? await supabase
        .from("craftid_entities")
        .select("id, craftid_number, craftid_check_digits, entity_type")
        .in("id", entityIds)
    : { data: [] as Array<{ id: string; craftid_number: number; craftid_check_digits: string; entity_type: string }> };

  const byId = new Map((entities ?? []).map((entity) => [entity.id, entity]));

  return (
    <main className="adminPage">
      <div className="adminPageHeader">
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
      </div>

      {params.error ? <p className="formMessage error">{params.error}</p> : null}
      {params.message ? <p className="formMessage">{t.success} #{params.message}</p> : null}

      <div className="adminDetailGrid adminDetailGridWide">
        <section className="adminPanel">
          <div className="adminPanelHeader">
            <div>
              <div className="eyebrow">{t.eyebrow}</div>
              <h2>{t.assign}</h2>
            </div>
          </div>

          <p className="privacyNote">{t.guidance}</p>

          <form className="adminStatusForm adminFormComfortable" action={assignCraftIdNumber}>
            <input type="hidden" name="lang" value={locale} />
            <label>
              {t.owner}
              <input name="ownerUserId" required placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </label>
            <div className="adminFormSplit">
              <label>
                {t.type}
                <select name="entityType" defaultValue="professional">
                  <option value="professional">{t.professional}</option>
                  <option value="workshop">{t.workshop}</option>
                </select>
              </label>
              <label>
                {t.number}
                <input name="requestedNumber" type="number" min="1" step="1" required />
              </label>
            </div>
            <label>
              {t.name}
              <input name="displayName" required />
            </label>
            <label>
              {t.reason}
              <textarea name="reason" rows={5} required />
            </label>
            <div className="adminFormActions">
              <button className="button buttonPrimary" type="submit">{t.assign}</button>
            </div>
          </form>
        </section>

        <aside className="adminPanel adminDetailAside">
          <div className="adminPanelHeader">
            <div>
              <div className="eyebrow">{t.history}</div>
              <h2>{t.history}</h2>
            </div>
            <span>{events?.length ?? 0}</span>
          </div>

          {!events?.length ? (
            <p className="emptyState">{t.empty}</p>
          ) : (
            <div className="adminMiniList">
              {events.map((event) => {
                const entity = event.entity_id ? byId.get(event.entity_id) : undefined;
                const metadata = (event.metadata ?? {}) as Record<string, unknown>;
                const assignmentType = metadata.assignment_type === "reserved" ? t.reserved : t.exceptional;
                const reason = typeof metadata.reason === "string" ? metadata.reason : "";

                return (
                  <article key={event.id}>
                    <span className="recordId">{assignmentType}</span>
                    <strong>
                      {entity ? formatId(entity.craftid_number, entity.craftid_check_digits) : "CraftID"}
                    </strong>
                    {reason ? <span>{reason}</span> : null}
                    <small>
                      {entity ? `${entity.entity_type} · ` : ""}
                      {new Date(event.created_at).toLocaleDateString(locale === "uk" ? "uk-UA" : "en-GB")}
                    </small>
                  </article>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
