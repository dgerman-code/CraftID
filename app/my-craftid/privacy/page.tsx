import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { updatePrivacy } from "./actions";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; entity?: string; error?: string; message?: string }> };

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
    exactTitle: "Optional exact address",
    exactText: "You may store an exact workshop or business address privately. Workshop CraftID owners can separately choose to publish it in the public workshop profile.",
    address1: "Address line 1",
    address2: "Address line 2",
    postalCode: "Postal code",
    locality: "City / locality",
    addressCountry: "Country code",
    save: "Save privacy settings",
    saved: "Privacy settings saved.",
    back: "Back to My CraftID",
    exactPublic: "Show exact workshop/business address publicly",
    exactPublicHelp: "Workshop only. This publishes the full address in the public Workshop profile. The Craft Skills Map remains aggregated and does not use the exact address.",
    exactPublicConsent: "I understand that this full workshop/business address will be publicly visible.",
    warning: "General public location is controlled separately as country, region or city. Exact address publication is optional and available only for Workshop CraftID.",
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
    exactTitle: "Точна адреса за бажанням",
    exactText: "Точну адресу майстерні або бізнесу можна зберігати приватно. Власник Workshop CraftID може окремо дозволити її публікацію у публічному профілі майстерні.",
    address1: "Адреса, рядок 1",
    address2: "Адреса, рядок 2",
    postalCode: "Поштовий індекс",
    locality: "Місто / населений пункт",
    addressCountry: "Код країни",
    save: "Зберегти налаштування приватності",
    saved: "Налаштування приватності збережено.",
    back: "Назад до Мій CraftID",
    exactPublic: "Показувати точну адресу майстерні/бізнесу публічно",
    exactPublicHelp: "Лише для Workshop CraftID. Повна адреса буде показана у публічному профілі майстерні. Craft Skills Map залишається агрегованою і не використовує точну адресу.",
    exactPublicConsent: "Я розумію, що ця повна адреса майстерні/бізнесу буде доступна публічно.",
    warning: "Загальна публічна географія окремо налаштовується як країна, регіон або місто. Публікація точної адреси є добровільною і доступна лише для Workshop CraftID.",
    evidence: "Файли доказів залишаються приватними незалежно від цих налаштувань публічного профілю.",
  },
} as const;

export default async function PrivacyPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale as keyof typeof copy] ?? copy.en;
  const { supabase, userId, entity } = await getOwnedCraftId(params.entity);
  const q = entity ? ownerWorkspaceQuery(locale, entity.id) : locale === "uk" ? "?lang=uk" : "";
  if (!userId) redirect(locale === "uk" ? "/login?lang=uk" : "/login");
  if (params.entity && !entity) redirect(locale === "uk" ? "/my-craftid?lang=uk" : "/my-craftid");
  if (!entity) redirect(locale === "uk" ? "/onboarding?lang=uk" : "/onboarding");

  const [{ data: settings }, { data: address }] = await Promise.all([
    supabase.from("privacy_settings")
      .select("show_profile_photo, show_city, show_languages, show_portfolio, show_qualifications, location_precision")
      .eq("entity_id", entity.id).single(),
    supabase.from("entity_business_addresses")
      .select("address_line1, address_line2, postal_code, locality, country_code, show_in_public_profile")
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
          <input type="hidden" name="entityId" value={entity.id} />
          <div className="toggleList">
            <label><input type="checkbox" name="showProfilePhoto" defaultChecked={settings?.show_profile_photo} />{t.photo}</label>
            <label><input type="checkbox" name="showLanguages" defaultChecked={settings?.show_languages} />{t.languages}</label>
            <label><input type="checkbox" name="showPortfolio" defaultChecked={settings?.show_portfolio} />{t.portfolio}</label>
            <label><input type="checkbox" name="showQualifications" defaultChecked={settings?.show_qualifications} />{t.qualifications}</label>
          </div>
          <label>{t.location}
            <select name="locationPrecision" defaultValue={settings?.location_precision ?? "city"}>
              <option value="country">{t.country}</option>
              <option value="region">{t.region}</option>
              <option value="city">{t.cityLevel}</option>
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
            {entity.entity_type === "workshop" ? (
              <div className="toggleList exactAddressPublicConsent">
                <label>
                  <input
                    type="checkbox"
                    name="showExactAddressPublic"
                    defaultChecked={address?.show_in_public_profile ?? false}
                  />
                  {t.exactPublic}
                </label>
                <p className="fieldHelp">{t.exactPublicHelp}</p>
                <label>
                  <input
                    type="checkbox"
                    name="confirmExactAddressPublic"
                    defaultChecked={address?.show_in_public_profile ?? false}
                  />
                  {t.exactPublicConsent}
                </label>
              </div>
            ) : null}
          </section>

          <button className="button buttonPrimary" type="submit">{t.save}</button>
        </form>
      </div>
    </main>
  );
}
