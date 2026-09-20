import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom } from "@/components/site-shell";
import { updateProfile } from "./actions";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; error?: string; message?: string }> };

const copy = {
  en: {
    eyebrow: "Profile information",
    title: "Describe your professional practice.",
    intro: "This information forms the descriptive layer of your CraftID record. Professional claims and evidence are managed separately.",
    name: "Display name",
    role: "Professional title / craft sector",
    country: "Country code",
    region: "Region",
    city: "City",
    about: "About",
    save: "Save profile",
    back: "Back to My CraftID",
    saved: "Profile saved.",
    privacy: "Use city or region rather than a private home address. Public visibility is controlled separately in Privacy.",
  },
  uk: {
    eyebrow: "Інформація профілю",
    title: "Опишіть свою професійну практику.",
    intro: "Ця інформація формує описову частину вашого запису CraftID. Професійні твердження та докази керуються окремо.",
    name: "Відображуване ім’я",
    role: "Професійна назва / ремісничий напрям",
    country: "Код країни",
    region: "Регіон",
    city: "Місто",
    about: "Про практику",
    save: "Зберегти профіль",
    back: "Назад до Мій CraftID",
    saved: "Профіль збережено.",
    privacy: "Вказуйте місто або регіон, а не приватну домашню адресу. Публічна видимість налаштовується окремо у розділі Приватність.",
  },
} as const;

export default async function ProfilePage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale];
  const q = locale === "uk" ? "?lang=uk" : "";

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect(`/login${q}`);

  const { data: entity } = await supabase.from("craftid_entities")
    .select("id, entity_type").eq("owner_user_id", userId).limit(1).single();
  if (!entity) redirect(`/onboarding${q}`);

  const result = entity.entity_type === "professional"
    ? await supabase.from("professional_profiles").select("display_name, professional_title, country_code, region, city, about").eq("entity_id", entity.id).single()
    : await supabase.from("workshop_profiles").select("display_name, craft_sector, country_code, region, city, about").eq("entity_id", entity.id).single();

  const record = result.data as {
    display_name: string;
    professional_title?: string | null;
    craft_sector?: string | null;
    country_code?: string | null;
    region?: string | null;
    city?: string | null;
    about?: string | null;
  };

  return (
    <main className="workspacePage">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={`/my-craftid${q}`}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="workspaceIntro">{t.intro}</p>
        <p className="privacyNote">{t.privacy}</p>

        {params.error ? <p className="formMessage error">{params.error}</p> : null}
        {params.message ? <p className="formMessage">{t.saved}</p> : null}

        <form className="workspaceForm" action={updateProfile}>
          <input type="hidden" name="lang" value={locale} />
          <label>{t.name}<input name="displayName" defaultValue={record.display_name} required /></label>
          <label>{t.role}<input name="title" defaultValue={record.professional_title ?? record.craft_sector ?? ""} /></label>
          <div className="formGrid">
            <label>{t.country}<input name="countryCode" maxLength={2} defaultValue={record.country_code ?? ""} placeholder="UA" /></label>
            <label>{t.region}<input name="region" defaultValue={record.region ?? ""} /></label>
            <label>{t.city}<input name="city" defaultValue={record.city ?? ""} /></label>
          </div>
          <label>{t.about}<textarea name="about" rows={7} defaultValue={record.about ?? ""} /></label>
          <button className="button buttonPrimary" type="submit">{t.save}</button>
        </form>
      </div>
    </main>
  );
}
