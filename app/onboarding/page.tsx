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
    intro: "Choose what you are registering first. A personal CraftID and a Workshop CraftID are separate records and can later be linked without merging their professional evidence.",
    guideTitle: "Which record should I choose?",
    guideText: "If you are a craftsperson — including a craftsperson who owns or runs a workshop — start with Professional. You can add a linked Workshop CraftID from your account afterwards. Choose Workshop only when you are registering the workshop, studio or craft-based micro-enterprise itself as the primary record.",
    professional: "Professional",
    professionalText: "For an individual craft practitioner. This record follows the person: skills, experience, qualifications, portfolio and supporting evidence remain connected to the professional even if they change workshop or place of practice.",
    professionalHint: "Recommended starting point for individual craftspeople and workshop owners.",
    professionalCta: "Create professional CraftID",
    workshop: "Workshop",
    workshopText: "For a studio, workshop or craft-based micro-enterprise. This record describes the organisation or place of practice: craft sector, capabilities, team relationships, business context and workshop-level evidence.",
    workshopHint: "Use this for the workshop itself — not as a replacement for the craftsperson's personal record.",
    workshopCta: "Create workshop CraftID",
    note: "Each CraftID is a permanent identifier for one record. A person and a workshop may therefore have different CraftIDs and be linked through a declared relationship. Country of practice and professional information can be updated without changing the CraftID. Numbers 00000001–00000100 are reserved for explicit administrative assignment.",
  },
  uk: {
    eyebrow: "Налаштування CraftID",
    title: "Що представлятиме цей CraftID?",
    intro: "Оберіть, що саме ви реєструєте насамперед. Персональний CraftID і CraftID майстерні є окремими записами та згодом можуть бути пов’язані без об’єднання їхніх професійних доказів.",
    guideTitle: "Який запис обрати?",
    guideText: "Якщо ви ремісник або майстер — у тому числі власник чи керівник майстерні — почніть із Професіонала. Після цього у своєму кабінеті ви зможете додати пов’язаний CraftID майстерні. Обирайте Майстерню, якщо ви реєструєте саме студію, майстерню або ремісниче мікропідприємство як основний об’єкт.",
    professional: "Професіонал",
    professionalText: "Для окремого майстра або ремісничого фахівця. Цей запис слідує за людиною: навички, досвід, кваліфікації, портфоліо та підтвердні матеріали залишаються пов’язаними з професіоналом навіть при зміні майстерні чи місця діяльності.",
    professionalHint: "Рекомендований стартовий варіант для індивідуальних майстрів і власників майстерень.",
    professionalCta: "Створити CraftID професіонала",
    workshop: "Майстерня",
    workshopText: "Для студії, майстерні або ремісничого мікропідприємства. Цей запис описує організацію або місце професійної діяльності: ремісничий напрям, можливості, командні зв’язки, бізнес-контекст і докази на рівні майстерні.",
    workshopHint: "Використовуйте для самої майстерні — не замість персонального запису майстра.",
    workshopCta: "Створити CraftID майстерні",
    note: "Кожен CraftID є постійним ідентифікатором одного запису. Тому людина і майстерня можуть мати різні CraftID та бути пов’язаними через задекларований зв’язок. Країну діяльності й професійну інформацію можна оновлювати без зміни CraftID. Номери 00000001–00000100 зарезервовані для окремого призначення адміністратором.",
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
    .neq("public_status", "archived")
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

        <section className="onboardingGuide">
          <div className="eyebrow">{t.guideTitle}</div>
          <p>{t.guideText}</p>
        </section>

        <div className="choiceGrid">
          <form action={createCraftId} className="choiceCard">
            <input type="hidden" name="entityType" value="professional" />
            <input type="hidden" name="lang" value={locale} />
            <span className="choiceIndex">01</span>
            <h2>{t.professional}</h2>
            <p>{t.professionalText}</p>
            <small className="choiceHint">{t.professionalHint}</small>
            <button className="button buttonPrimary" type="submit">{t.professionalCta}</button>
          </form>

          <form action={createCraftId} className="choiceCard">
            <input type="hidden" name="entityType" value="workshop" />
            <input type="hidden" name="lang" value={locale} />
            <span className="choiceIndex">02</span>
            <h2>{t.workshop}</h2>
            <p>{t.workshopText}</p>
            <small className="choiceHint">{t.workshopHint}</small>
            <button className="button buttonPrimary" type="submit">{t.workshopCta}</button>
          </form>
        </div>

        <p className="onboardingNote">{t.note}</p>
      </div>
    </main>
  );
}
