import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom } from "@/components/site-shell";
import { createInstitutionalReferral } from "./actions";
import { formatCraftIdWithHash } from "@/lib/craftid-format";
import { contentLocale, localeQuery } from "@/lib/i18n";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; error?: string; message?: string }> };

const copy = {
  en: {
    eyebrow: "Institutional referrals",
    title: "Invite a CraftID holder to an opportunity.",
    intro: "CraftID can facilitate introductions without disclosing private contact details to the requesting institution. The holder decides whether to accept.",
    craftId: "Target CraftID",
    organisation: "Requesting organisation",
    contactName: "Contact person (optional)",
    contactEmail: "Contact email (optional)",
    type: "Opportunity type",
    types: { project:"Project", partnership:"Partnership", training:"Training", commission:"Commission", research:"Research", restoration:"Restoration", other:"Other" },
    referralTitle: "Opportunity title",
    message: "Message to CraftID holder",
    deadline: "Response deadline (optional)",
    send: "Send referral",
    created: "Referral created.",
    recent: "Recent referrals",
    empty: "No institutional referrals yet.",
    back: "Back to CraftID",
  },
  uk: {
    eyebrow: "Інституційні направлення",
    title: "Запросіть власника CraftID до можливості.",
    intro: "CraftID може організувати знайомство без розкриття приватних контактів установі-запитувачу. Власник сам вирішує, чи приймати запрошення.",
    craftId: "CraftID отримувача",
    organisation: "Організація-запитувач",
    contactName: "Контактна особа (за бажанням)",
    contactEmail: "Контактний email (за бажанням)",
    type: "Тип можливості",
    types: { project:"Проєкт", partnership:"Партнерство", training:"Навчання", commission:"Замовлення", research:"Дослідження", restoration:"Реставрація", other:"Інше" },
    referralTitle: "Назва можливості",
    message: "Повідомлення власнику CraftID",
    deadline: "Строк відповіді (за бажанням)",
    send: "Надіслати направлення",
    created: "Направлення створено.",
    recent: "Останні направлення",
    empty: "Інституційних направлень ще немає.",
    back: "Назад до CraftID",
  },
} as const;

export default async function AdminReferralsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[contentLocale(locale)];
  const q = localeQuery(locale);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) redirect(`/login${q}`);
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect(`/my-craftid${q}`);

  const { data: referrals } = await supabase
    .from("institutional_referrals")
    .select("id, target_entity_id, requester_organisation, opportunity_type, title, status, response_deadline, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const ids = [...new Set((referrals ?? []).map((r) => r.target_entity_id))];
  const { data: entities } = ids.length
    ? await supabase.from("craftid_entities").select("id, craftid_number, craftid_check_digits").in("id", ids)
    : { data: [] as Array<{id:string;craftid_number:number;craftid_check_digits:string}> };
  const byId = new Map((entities ?? []).map((e) => [e.id, e]));

  return (
    <main className="adminPage">
      <div className="adminPageHeader">
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
      </div>

      {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
      {sp.message ? <p className="formMessage">{t.created}</p> : null}

      <div className="adminDetailGrid adminDetailGridWide">
        <section className="adminPanel">
          <div className="adminPanelHeader">
            <div>
              <div className="eyebrow">{t.eyebrow}</div>
              <h2>{t.send}</h2>
            </div>
          </div>

          <form className="adminStatusForm adminFormComfortable" action={createInstitutionalReferral}>
            <input type="hidden" name="lang" value={locale} />

            <div className="adminFormSplit">
              <label>
                {t.craftId}
                <input name="craftId" placeholder="0000-0101-86" required />
              </label>
              <label>
                {t.type}
                <select name="opportunityType" defaultValue="project">
                  {Object.entries(t.types).map(([value,label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              {t.organisation}
              <input name="organisation" required />
            </label>

            <div className="adminFormSplit">
              <label>
                {t.contactName}
                <input name="contactName" />
              </label>
              <label>
                {t.contactEmail}
                <input name="contactEmail" type="email" />
              </label>
            </div>

            <label>
              {t.referralTitle}
              <input name="title" required />
            </label>

            <label>
              {t.message}
              <textarea name="message" rows={7} minLength={20} required />
            </label>

            <label>
              {t.deadline}
              <input name="deadline" type="date" />
            </label>

            <div className="adminFormActions">
              <button className="button buttonPrimary" type="submit">{t.send}</button>
            </div>
          </form>
        </section>

        <aside className="adminPanel adminDetailAside">
          <div className="adminPanelHeader">
            <div>
              <div className="eyebrow">{t.recent}</div>
              <h2>{t.recent}</h2>
            </div>
            <span>{referrals?.length ?? 0}</span>
          </div>

          {!referrals?.length ? (
            <p className="emptyState">{t.empty}</p>
          ) : (
            <div className="adminMiniList">
              {referrals.map((r) => {
                const e = byId.get(r.target_entity_id);
                return (
                  <article key={r.id}>
                    <span className="recordId">
                      {e ? formatCraftIdWithHash(e.craftid_number, e.craftid_check_digits) : "CraftID"}
                    </span>
                    <strong>{r.title}</strong>
                    <span>{r.requester_organisation}</span>
                    <small>
                      {r.opportunity_type} · {r.status}
                      {r.response_deadline ? ` · ${r.response_deadline}` : ""}
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
