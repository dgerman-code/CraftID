import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCraftId } from "./actions";
import { localeFrom } from "@/components/site-shell";

type OnboardingPageProps = {
  searchParams: Promise<{ error?: string; lang?: string }>;
};

export const dynamic = "force-dynamic";

const copy = {
  en: {
    eyebrow: "CraftID setup",
    title: "What will this CraftID represent?",
    intro: "Choose the record type that best reflects the professional identity you want to establish. The initial structure can later be extended through skills, evidence and affiliations.",
    professional: "Professional",
    professionalText: "For an individual craft practitioner with skills, experience, qualifications, portfolio and supporting evidence.",
    professionalCta: "Create professional CraftID",
    workshop: "Workshop",
    workshopText: "For a studio, workshop or craft-based micro-enterprise with capabilities, team, production context, portfolio and evidence.",
    workshopCta: "Create workshop CraftID",
    note: "Your CraftID is a permanent identifier and does not change. Country of professional practice, craft field and profile type are stored separately and may be updated. Numbers 00000001–00000100 are reserved for explicit administrative assignment.",
  },
  uk: {
    eyebrow: "Налаштування CraftID",
    title: "Що представлятиме цей CraftID?",
    intro: "Оберіть тип запису, який найкраще відповідає професійній ідентичності, яку ви створюєте. Початкову структуру згодом можна доповнювати навичками, доказами та професійними зв’язками.",
    professional: "Професіонал",
    professionalText: "Для окремого майстра або ремісничого фахівця з навичками, досвідом, кваліфікаціями, портфоліо та підтвердними матеріалами.",
    professionalCta: "Створити CraftID професіонала",
    workshop: "Майстерня",
    workshopText: "Для студії, майстерні або ремісничого мікропідприємства з можливостями, командою, виробничим контекстом, портфоліо та доказами.",
    workshopCta: "Створити CraftID майстерні",
    note: "Ваш CraftID є постійним ідентифікатором і не змінюється. Країна професійної практики, ремісничий напрям і тип профілю зберігаються окремо та можуть оновлюватися. Номери 00000001–00000100 зарезервовані для окремого призначення адміністратором.",
  },
} as const;

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale];
  const q = locale === "uk" ? "?lang=uk" : "";

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    redirect(`/login${q}`);
  }

  const { data: entity } = await supabase
    .from("craftid_entities")
    .select("id")
    .eq("owner_user_id", data.claims.sub)
    .limit(1)
    .maybeSingle();

  if (entity) {
    redirect(`/my-craftid${q}`);
  }

  return (
    <main className="onboardingPage">
      <div className="container">
        <div className="onboardingTopline">
          <a className="brand" href={`/${q}`}>CraftID</a>
          <div className="languageSwitch">
            <a className={locale === "en" ? "active" : ""} href="/onboarding">EN</a>
            <span>/</span>
            <a className={locale === "uk" ? "active" : ""} href="/onboarding?lang=uk">UA</a>
          </div>
        </div>

        <div className="eyebrow">{t.eyebrow}</div>
        <h1 className="onboardingTitle">{t.title}</h1>
        <p className="onboardingIntro">{t.intro}</p>

        {params.error ? <p className="formMessage error">{params.error}</p> : null}

        <div className="choiceGrid">
          <form action={createCraftId} className="choiceCard">
            <input type="hidden" name="entityType" value="professional" />
            <input type="hidden" name="lang" value={locale} />
            <span className="choiceIndex">01</span>
            <h2>{t.professional}</h2>
            <p>{t.professionalText}</p>
            <button className="button buttonPrimary" type="submit">{t.professionalCta}</button>
          </form>

          <form action={createCraftId} className="choiceCard">
            <input type="hidden" name="entityType" value="workshop" />
            <input type="hidden" name="lang" value={locale} />
            <span className="choiceIndex">02</span>
            <h2>{t.workshop}</h2>
            <p>{t.workshopText}</p>
            <button className="button buttonPrimary" type="submit">{t.workshopCta}</button>
          </form>
        </div>

        <p className="onboardingNote">{t.note}</p>
      </div>
    </main>
  );
}
