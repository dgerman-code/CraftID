import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom } from "@/components/site-shell";
import { addClaim } from "./actions";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; error?: string; message?: string }> };

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
  },
} as const;

export default async function ClaimsPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale];
  const q = locale === "uk" ? "?lang=uk" : "";

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect(`/login${q}`);

  const { data: entity } = await supabase.from("craftid_entities")
    .select("id").eq("owner_user_id", userId).limit(1).single();

  const { data: claims } = await supabase.from("claims")
    .select("id, claim_type, title, description, visibility, status, created_at")
    .eq("entity_id", entity.id)
    .order("created_at", { ascending: false });

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
            {params.message ? <p className="formMessage">{t.added}</p> : null}

            <form className="workspaceForm compactForm" action={addClaim}>
              <input type="hidden" name="lang" value={locale} />
              <label>{t.type}
                <select name="claimType" required defaultValue="skill">
                  <option value="skill">Skill</option>
                  <option value="experience">Experience</option>
                  <option value="qualification">Qualification</option>
                  <option value="workshop_affiliation">Workshop affiliation</option>
                  <option value="external_recognition">External recognition</option>
                  <option value="origin">Origin</option>
                  <option value="craft_tradition">Craft tradition</option>
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
              </article>
            ))}
          </aside>
        </div>
      </div>
    </main>
  );
}
