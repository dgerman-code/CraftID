import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom } from "@/components/site-shell";
import { updatePrivacy } from "./actions";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; error?: string; message?: string }> };

const copy = {
  en: {
    eyebrow: "Privacy",
    title: "Control what your public record reveals.",
    intro: "CraftID separates public professional visibility from private supporting material. Use these settings to control profile fields and location precision.",
    photo: "Show profile photo",
    city: "Show city",
    languages: "Show languages",
    portfolio: "Show portfolio",
    qualifications: "Show qualifications",
    location: "Location precision",
    country: "Country only",
    region: "Region",
    cityLevel: "City",
    exact: "Exact address (optional)",
    exactTitle: "Optional exact address",
    exactText: "Add an exact workshop or business address only if you want CraftID to store it. It stays private unless you explicitly choose Exact address above.",
    address1: "Address line 1",
    address2: "Address line 2",
    postalCode: "Postal code",
    locality: "City / locality",
    addressCountry: "Country code",
    save: "Save privacy settings",
    saved: "Privacy settings saved.",
    back: "Back to My CraftID",
    warning: "Exact address is optional. For individual professionals, avoid publishing a private home address. Use this only for a workshop, studio, shop or other location you intentionally want to disclose.",
    evidence: "Evidence files remain private regardless of these public profile settings.",
  },
  uk: {
    eyebrow: "Приватність",
    title: "Контролюйте, що показує ваш публічний запис.",
    intro: "CraftID розділяє публічну професійну видимість і приватні підтвердні матеріали. Використовуйте ці налаштування для керування полями профілю та точністю місцезнаходження.",
    photo: "Показувати фото профілю",
    city: "Показувати місто",
    languages: "Показувати мови",
    portfolio: "Показувати портфоліо",
    qualifications: "Показувати кваліфікації",
    location: "Точність місцезнаходження",
    country: "Лише країна",
    region: "Регіон",
    cityLevel: "Місто",
    exact: "Точна адреса (за бажанням)",
    exactTitle: "Точна адреса за бажанням",
    exactText: "Додайте точну адресу майстерні або бізнесу лише за бажанням. Вона залишається приватною, доки ви явно не оберете «Точна адреса» вище.",
    address1: "Адреса, рядок 1",
    address2: "Адреса, рядок 2",
    postalCode: "Поштовий індекс",
    locality: "Місто / населений пункт",
    addressCountry: "Код країни",
    save: "Зберегти налаштування приватності",
    saved: "Налаштування приватності збережено.",
    back: "Назад до Мій CraftID",
    warning: "Точна адреса не є обов’язковою. Для індивідуальних професіоналів не публікуйте приватну домашню адресу. Використовуйте цю опцію лише для майстерні, студії, магазину або іншого місця, яке ви свідомо хочете показати.",
    evidence: "Файли доказів залишаються приватними незалежно від цих налаштувань публічного профілю.",
  },
} as const;

export default async function PrivacyPage({ searchParams }: Props) {
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
  if (!entity) redirect(`/onboarding${q}`);

  const [{ data: settings }, { data: address }] = await Promise.all([
    supabase.from("privacy_settings")
      .select("show_profile_photo, show_city, show_languages, show_portfolio, show_qualifications, location_precision")
      .eq("entity_id", entity.id).single(),
    supabase.from("entity_business_addresses")
      .select("address_line1, address_line2, postal_code, locality, country_code")
      .eq("entity_id", entity.id)
      .maybeSingle(),
  ]);

  return (
    <main className="workspacePage">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={`/my-craftid${q}`}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="workspaceIntro">{t.intro}</p>
        <p className="privacyNote">{t.warning}</p>
        <p className="privacyNote">{t.evidence}</p>

        {params.error ? <p className="formMessage error">{params.error}</p> : null}
        {params.message ? <p className="formMessage">{t.saved}</p> : null}

        <form className="workspaceForm" action={updatePrivacy}>
          <input type="hidden" name="lang" value={locale} />
          <div className="toggleList">
            <label><input type="checkbox" name="showProfilePhoto" defaultChecked={settings?.show_profile_photo} />{t.photo}</label>
            <label><input type="checkbox" name="showCity" defaultChecked={settings?.show_city} />{t.city}</label>
            <label><input type="checkbox" name="showLanguages" defaultChecked={settings?.show_languages} />{t.languages}</label>
            <label><input type="checkbox" name="showPortfolio" defaultChecked={settings?.show_portfolio} />{t.portfolio}</label>
            <label><input type="checkbox" name="showQualifications" defaultChecked={settings?.show_qualifications} />{t.qualifications}</label>
          </div>
          <label>{t.location}
            <select name="locationPrecision" defaultValue={settings?.location_precision ?? "city"}>
              <option value="country">{t.country}</option>
              <option value="region">{t.region}</option>
              <option value="city">{t.cityLevel}</option>
              <option value="exact_business_location">{t.exact}</option>
            </select>
          </label>

          <section className="exactAddressSection">
            <div className="eyebrow">{t.exactTitle}</div>
            <p className="fieldHelp">{t.exactText}</p>
            <div className="formGrid">
              <label>{t.address1}<input name="addressLine1" defaultValue={address?.address_line1 ?? ""} /></label>
              <label>{t.address2}<input name="addressLine2" defaultValue={address?.address_line2 ?? ""} /></label>
              <label>{t.postalCode}<input name="postalCode" defaultValue={address?.postal_code ?? ""} /></label>
              <label>{t.locality}<input name="locality" defaultValue={address?.locality ?? ""} /></label>
              <label>{t.addressCountry}<input name="addressCountryCode" maxLength={2} defaultValue={address?.country_code ?? ""} placeholder="UA" /></label>
            </div>
          </section>

          <button className="button buttonPrimary" type="submit">{t.save}</button>
        </form>
      </div>
    </main>
  );
}
