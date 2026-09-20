import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import { localeFrom } from "@/components/site-shell";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ lang?: string }> };

function formatCraftId(value: number | string, checkDigits: string) {
  return `#${String(value).padStart(8, "0")}-${checkDigits}`;
}

const copy = {
  en: {
    eyebrow: "My CraftID",
    signOut: "Sign out",
    recordFallback: "CraftID record",
    complete: "Complete your profile to describe your professional practice.",
    status: "Status",
    location: "Location",
    notSet: "Not set",
    next: "Next steps",
    steps: [
      "Complete profile information",
      "Add professional skills",
      "Add experience and qualifications",
      "Link supporting evidence",
      "Review privacy and publish",
    ],
    profile: "Profile",
    profileText: "Manage the information that describes you or your workshop.",
    skills: "Skills & claims",
    skillsText: "Build structured claims around skills, experience and qualifications.",
    evidence: "Evidence",
    evidenceText: "Manage private supporting material linked to individual claims.",
    privacy: "Privacy",
    privacyText: "Choose what is visible publicly and how precise your location may be.",
    public: "Public profile",
    publicText: "Preview how the record will appear once publication criteria are met.",
    requests: "Contact requests",
    requestsText: "Review controlled enquiries without publishing your private email or phone.",
    open: "Open",
    typeProfessional: "Professional",
    typeWorkshop: "Workshop",
    draft: "Draft",
    published: "Published",
    suspended: "Suspended",
    archived: "Archived",
  },
  uk: {
    eyebrow: "Мій CraftID",
    signOut: "Вийти",
    recordFallback: "Запис CraftID",
    complete: "Доповніть профіль, щоб описати свою професійну практику.",
    status: "Статус",
    location: "Місце",
    notSet: "Не вказано",
    next: "Наступні кроки",
    steps: [
      "Заповніть інформацію профілю",
      "Додайте професійні навички",
      "Додайте досвід і кваліфікації",
      "Пов’яжіть підтвердні матеріали",
      "Перевірте приватність і опублікуйте",
    ],
    profile: "Профіль",
    profileText: "Керуйте інформацією, що описує вас або вашу майстерню.",
    skills: "Навички та твердження",
    skillsText: "Формуйте структуровані твердження про навички, досвід і кваліфікації.",
    evidence: "Докази",
    evidenceText: "Керуйте приватними підтвердними матеріалами, пов’язаними з окремими твердженнями.",
    privacy: "Приватність",
    privacyText: "Оберіть, що буде публічним і наскільки точно може відображатися ваше місцезнаходження.",
    public: "Публічний профіль",
    publicText: "Перегляньте, як запис виглядатиме після виконання критеріїв публікації.",
    requests: "Запити на контакт",
    requestsText: "Переглядайте контрольовані звернення без публікації вашого приватного email або телефону.",
    open: "Відкрити",
    typeProfessional: "Професіонал",
    typeWorkshop: "Майстерня",
    draft: "Чернетка",
    published: "Опубліковано",
    suspended: "Призупинено",
    archived: "Архів",
  },
} as const;

export default async function MyCraftIdPage({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale];
  const q = locale === "uk" ? "?lang=uk" : "";

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect(`/login${q}`);

  const { data: entity } = await supabase
    .from("craftid_entities")
    .select("id, craftid_number, craftid_check_digits, entity_type, public_status")
    .eq("owner_user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!entity) redirect(`/onboarding${q}`);

  const profile =
    entity.entity_type === "professional"
      ? await supabase.from("professional_profiles")
          .select("display_name, professional_title, country_code, region, city")
          .eq("entity_id", entity.id).single()
      : await supabase.from("workshop_profiles")
          .select("display_name, craft_sector, country_code, region, city")
          .eq("entity_id", entity.id).single();

  const record = profile.data as
    | {
        display_name: string;
        professional_title?: string | null;
        craft_sector?: string | null;
        country_code?: string | null;
        region?: string | null;
        city?: string | null;
      }
    | null;

  const typeLabel =
    entity.entity_type === "professional" ? t.typeProfessional : t.typeWorkshop;

  return (
    <main className="recordPage dashboardPage">
      <div className="container">
        <div className="dashboardHeader">
          <div>
            <Link href={`/${q}`} className="brand">CraftID</Link>
            <div className="eyebrow dashboardEyebrow">{t.eyebrow}</div>
          </div>
          <div className="dashboardActions">
            <div className="languageSwitch">
              <Link className={locale === "en" ? "active" : ""} href="/my-craftid">EN</Link>
              <span>/</span>
              <Link className={locale === "uk" ? "active" : ""} href="/my-craftid?lang=uk">UA</Link>
            </div>
            <form action={logout}>
              <input type="hidden" name="lang" value={locale} />
              <button className="button" type="submit">{t.signOut}</button>
            </form>
          </div>
        </div>

        <div className="recordTopbar">
          <div>
            <span className="recordType">{typeLabel}</span>
            <h1>{formatCraftId(entity.craftid_number, entity.craftid_check_digits)}</h1>
          </div>
          <div className="dashboardStatus">
            <span>{t.status}</span>
            <strong>{t[entity.public_status as keyof typeof t] ?? entity.public_status}</strong>
          </div>
        </div>

        <div className="recordGrid">
          <section className="recordPrimary">
            <h2>{record?.display_name ?? t.recordFallback}</h2>
            <p>{record?.professional_title ?? record?.craft_sector ?? t.complete}</p>
            <div className="recordMeta">
              <span>{t.location}: {[record?.city, record?.region, record?.country_code].filter(Boolean).join(", ") || t.notSet}</span>
            </div>
          </section>
          <aside className="recordAside">
            <div className="eyebrow">{t.next}</div>
            <ol>{t.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          </aside>
        </div>

        <section className="dashboardModules">
          {[
            [t.profile, t.profileText, "/my-craftid/profile"],
            [t.skills, t.skillsText, "/my-craftid/claims"],
            [t.evidence, t.evidenceText, "/my-craftid/evidence"],
            [t.privacy, t.privacyText, "/my-craftid/privacy"],
            [t.public, t.publicText, "/my-craftid/preview"],
            [t.requests, t.requestsText, "/my-craftid/requests"],
          ].map(([title, text, href], index) => (
            <article className="dashboardModule" key={title}>
              <span className="choiceIndex">{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <Link href={`${href}${q}`}>{t.open} →</Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
