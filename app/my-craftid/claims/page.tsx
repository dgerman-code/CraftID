import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { addClaim, addSkillClaims } from "./actions";
import { localeQuery, contentLocale, withLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; entity?: string; error?: string; message?: string }> };

const copy = {
  en: {
    eyebrow: "Skills & claims",
    title: "Build your professional record claim by claim.",
    intro: "A claim is a specific statement about your professional practice. Evidence can be linked later to support that claim.",
    type: "Claim type",
    titleLabel: "Claim title",
    desc: "Description",
    visibility: "Visibility",
    public: "Public",
    private: "Private",
    add: "Add claim",
    list: "Your claims",
    empty: "No claims yet. Start with a skill, experience or qualification that matters to your professional record.",
    back: "Back to My CraftID",
    added: "Claim added.",
    status: "Status",
    describeSkill: "Describe skill",
    selectSkills: "Select professional skills",
    selectSkillsIntro: "Choose one or more skills from the CraftID taxonomy. Selected skills are added as structured self-declared claims and can later be supported by evidence.",
    saveSkills: "Add selected skills",
    skillsAdded: "Skills added.",
    additionalClaim: "Add another claim",
    customSkill: "Other skill (not yet in taxonomy)",
  },
  uk: {
    eyebrow: "Навички та твердження",
    title: "Формуйте професійний запис окремими твердженнями.",
    intro: "Твердження — це конкретна інформація про вашу професійну практику. Згодом до нього можна пов’язати докази.",
    type: "Тип твердження",
    titleLabel: "Назва твердження",
    desc: "Опис",
    visibility: "Видимість",
    public: "Публічне",
    private: "Приватне",
    add: "Додати твердження",
    list: "Ваші твердження",
    empty: "Тверджень ще немає. Почніть із навички, досвіду або кваліфікації, важливої для вашого професійного запису.",
    back: "Назад до Мій CraftID",
    added: "Твердження додано.",
    status: "Статус",
    describeSkill: "Описати навичку",
    selectSkills: "Оберіть професійні навички",
    selectSkillsIntro: "Оберіть одну або кілька навичок із таксономії CraftID. Вибрані навички додаються як структуровані самодекларовані твердження, до яких згодом можна додати докази.",
    saveSkills: "Додати вибрані навички",
    skillsAdded: "Навички додано.",
    additionalClaim: "Додати інше твердження",
    customSkill: "Інша навичка (ще не в таксономії)",
  },
} as const;

export default async function ClaimsPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[contentLocale(locale)];
  const { supabase, userId, entity } = await getOwnedCraftId(params.entity);
  const q = entity ? ownerWorkspaceQuery(locale, entity.id) : localeQuery(locale);
  if (!userId) redirect(`/login${localeQuery(locale)}`);
  if (params.entity && !entity) redirect(`/my-craftid${localeQuery(locale)}`);
  if (!entity) redirect(`/onboarding${localeQuery(locale)}`);

  const [{ data: claims }, { data: skillTerms }] = await Promise.all([
    supabase.from("claims")
      .select("id, claim_type, title, description, visibility, status, created_at, taxonomy_term_id")
      .eq("entity_id", entity.id)
      .order("created_at", { ascending: false }),
    supabase.from("taxonomy_terms")
      .select("id, stable_key, label_en, label_uk")
      .eq("term_type", "skill")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const selectedSkillIds = new Set(
    (claims ?? [])
      .filter((claim) => claim.claim_type === "skill" && claim.taxonomy_term_id)
      .map((claim) => claim.taxonomy_term_id),
  );

  return (
    <main className="workspacePage">
      <div className="container">
        <Link className="backLink" href={`/my-craftid${q}`}>← {t.back}</Link>
        <div className="workspaceGrid">
          <section>
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
            <p className="workspaceIntro">{t.intro}</p>
            {params.error ? <p className="formMessage error">{params.error}</p> : null}
            {params.message ? <p className="formMessage">{params.message === "skills" ? t.skillsAdded : t.added}</p> : null}

            <section className="skillSelector">
              <div className="eyebrow">{t.selectSkills}</div>
              <p className="fieldHelp">{t.selectSkillsIntro}</p>
              <form action={addSkillClaims}>
                <input type="hidden" name="lang" value={locale} />
                <input type="hidden" name="entityId" value={entity.id} />
                <div className="skillOptionGrid">
                  {skillTerms?.map((term) => {
                    const label = locale === "uk" ? term.label_uk : term.label_en;
                    const selected = selectedSkillIds.has(term.id);
                    return (
                      <label className={selected ? "skillOption selected" : "skillOption"} key={term.id}>
                        <input type="checkbox" name="skillId" value={term.id} disabled={selected} defaultChecked={selected} />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>
                <button className="button buttonPrimary" type="submit">{t.saveSkills}</button>
              </form>
            </section>

            <div className="eyebrow secondaryFormEyebrow">{t.additionalClaim}</div>

            <form className="workspaceForm compactForm" action={addClaim}>
              <input type="hidden" name="lang" value={locale} />
                <input type="hidden" name="entityId" value={entity.id} />
              <label>{t.type}
                <select name="claimType" required defaultValue="skill">
                  <option value="skill">{t.customSkill}</option>
                  <option value="experience">{locale === "uk" ? "Досвід" : "Experience"}</option>
                  <option value="qualification">{locale === "uk" ? "Кваліфікація" : "Qualification"}</option>
                  <option value="workshop_affiliation">{locale === "uk" ? "Зв’язок із майстернею" : "Workshop affiliation"}</option>
                  <option value="external_recognition">{locale === "uk" ? "Зовнішнє визнання" : "External recognition"}</option>
                  <option value="origin">{locale === "uk" ? "Походження" : "Origin"}</option>
                  <option value="craft_tradition">{locale === "uk" ? "Реміснича традиція" : "Craft tradition"}</option>
                </select>
              </label>
              <label>{t.titleLabel}<input name="title" required /></label>
              <label>{t.desc}<textarea name="description" rows={4} /></label>
              <label>{t.visibility}
                <select name="visibility" defaultValue="public">
                  <option value="public">{t.public}</option>
                  <option value="private">{t.private}</option>
                </select>
              </label>
              <button className="button buttonPrimary" type="submit">{t.add}</button>
            </form>
          </section>

          <aside className="workspaceList">
            <div className="eyebrow">{t.list}</div>
            {!claims?.length ? <p className="emptyState">{t.empty}</p> : claims.map((claim) => (
              <article className="claimItem" key={claim.id}>
                <span className="recordId">{claim.claim_type.replaceAll("_", " ")}</span>
                <h3>{claim.title}</h3>
                {claim.description ? <p>{claim.description}</p> : null}
                <div className="claimMeta">
                  <span>{t.status}: {claim.status.replaceAll("_", " ")}</span>
                  <span>{claim.visibility}</span>
                </div>
                {claim.claim_type === "skill" ? (
                  <Link className="claimAction" href={`/my-craftid/claims/${claim.id}${q}`}>
                    {t.describeSkill} →
                  </Link>
                ) : null}
              </article>
            ))}
          </aside>
        </div>
      </div>
    </main>
  );
}
