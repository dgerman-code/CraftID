import Link from "next/link";
import { redirect } from "next/navigation";
import { localeFrom } from "@/components/site-shell";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { saveSupportProfile } from "./actions";
import { localeQuery, contentLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ lang?: string; entity?: string; error?: string; message?: string }>;
};

const copy = {
  en: {
    eyebrow: "Opportunities & Support",
    title: "Tell us what would help your professional practice.",
    intro:
      "Select the areas that interest you now. This is a self-declared support profile, not an application and not an eligibility assessment. You can change it at any time.",
    privateNote:
      "These selections are not shown on your public CraftID profile. CraftID uses them for internal needs analysis and, where you explicitly allow it, to contact you about relevant support.",
    level: "Current interest",
    notInterested: "Not currently interested",
    interested: "Interested",
    active: "Actively looking",
    note: "Optional details",
    notePlaceholder: "Briefly describe what you are looking for, if useful.",
    contact:
      "CraftID or the authorised national operator may contact me about support relevant to the interests I selected.",
    contactHelp:
      "This does not share your data with external partners. Any future partner-facing matching or data-sharing flow will require its own rules and controls.",
    save: "Save support profile",
    saved: "Support profile saved.",
    back: "Back to My CraftID",
  },
  uk: {
    eyebrow: "Можливості та підтримка",
    title: "Розкажіть, що може допомогти вашій професійній діяльності.",
    intro:
      "Оберіть напрями, які вас цікавлять зараз. Це самодекларований профіль потреб, а не заявка і не оцінка відповідності програмі. Ви можете змінити його будь-коли.",
    privateNote:
      "Ці дані не показуються у вашому публічному профілі CraftID. CraftID використовує їх для внутрішнього аналізу потреб і, лише за вашою окремою згодою, для зв’язку щодо релевантної підтримки.",
    level: "Поточний інтерес",
    notInterested: "Зараз не цікавить",
    interested: "Цікавить",
    active: "Активно шукаю",
    note: "Додаткове пояснення",
    notePlaceholder: "Коротко опишіть, що саме ви шукаєте, якщо це корисно.",
    contact:
      "CraftID або уповноважений національний оператор може зв’язуватися зі мною щодо підтримки, релевантної обраним інтересам.",
    contactHelp:
      "Це не означає передачу ваших даних зовнішнім партнерам. Майбутній matching або передача даних партнерам матимуть окремі правила та контроль.",
    save: "Зберегти профіль підтримки",
    saved: "Профіль підтримки збережено.",
    back: "Назад до Мій CraftID",
  },
} as const;

export default async function SupportPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[contentLocale(locale)];

  const { supabase, userId, entity } = await getOwnedCraftId(sp.entity);
  if (!userId) redirect(`/login${localeQuery(locale)}`);
  if (sp.entity && !entity) redirect(`/my-craftid${localeQuery(locale)}`);
  if (!entity) redirect(`/onboarding${localeQuery(locale)}`);

  const q = ownerWorkspaceQuery(locale, entity.id);
  const [{ data: categories }, { data: interests }, { data: preferences }] = await Promise.all([
    supabase
      .from("support_interest_taxonomy")
      .select("code, label_en, label_uk, description_en, description_uk, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("entity_support_interests")
      .select("interest_code, engagement_level, note")
      .eq("entity_id", entity.id),
    supabase
      .from("entity_support_preferences")
      .select("allow_relevant_contact")
      .eq("entity_id", entity.id)
      .maybeSingle(),
  ]);

  const byCode = new Map((interests ?? []).map((item) => [item.interest_code, item]));

  return (
    <main className="workspacePage">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={`/my-craftid${q}`}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="workspaceIntro">{t.intro}</p>
        <p className="privacyNote">{t.privateNote}</p>

        {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
        {sp.message === "saved" ? <p className="formMessage">{t.saved}</p> : null}

        <form className="workspaceForm" action={saveSupportProfile}>
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="entityId" value={entity.id} />

          <div className="workspaceList">
            {(categories ?? []).map((category) => {
              const current = byCode.get(category.code);
              const label = locale === "uk" ? category.label_uk : category.label_en;
              const description =
                locale === "uk" ? category.description_uk : category.description_en;

              return (
                <article className="claimItem" key={category.code}>
                  <h3>{label}</h3>
                  <p>{description}</p>
                  <div className="formGrid">
                    <label>
                      {t.level}
                      <select
                        name={`level_${category.code}`}
                        defaultValue={current?.engagement_level ?? ""}
                      >
                        <option value="">{t.notInterested}</option>
                        <option value="interested">{t.interested}</option>
                        <option value="actively_looking">{t.active}</option>
                      </select>
                    </label>
                    <label>
                      {t.note}
                      <textarea
                        name={`note_${category.code}`}
                        rows={3}
                        maxLength={1000}
                        defaultValue={current?.note ?? ""}
                        placeholder={t.notePlaceholder}
                      />
                    </label>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="toggleList">
            <label>
              <input
                type="checkbox"
                name="allowRelevantContact"
                defaultChecked={preferences?.allow_relevant_contact ?? false}
              />
              {t.contact}
            </label>
          </div>
          <p className="fieldHelp">{t.contactHelp}</p>

          <button className="button buttonPrimary" type="submit">{t.save}</button>
        </form>
      </div>
    </main>
  );
}
