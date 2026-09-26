import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { updatePrivacy } from "./actions";
import { localeQuery } from "@/lib/i18n";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; entity?: string; error?: string; message?: string }> };

const copy = {
  en: {
    eyebrow: "Privacy", title: "Control what your public record reveals.",
    intro: "CraftID separates public professional visibility from private supporting material. Use these settings to control profile fields and location precision.",
    photo: "Show profile photo", city: "Show city", languages: "Show languages", portfolio: "Show portfolio", qualifications: "Show qualifications",
    location: "Location precision", country: "Country only", region: "Region", cityLevel: "City",
    exactTitle: "Optional exact address",
    exactText: "You may store an exact workshop or business address privately. Workshop CraftID owners can separately choose to publish it in the public workshop profile.",
    address1: "Address line 1", address2: "Address line 2", postalCode: "Postal code", locality: "City / locality", addressCountry: "Country code",
    save: "Save privacy settings", saved: "Privacy settings saved.", back: "Back to My CraftID",
    exactPublic: "Show exact workshop/business address publicly",
    exactPublicHelp: "Workshop only. This publishes the full address in the public Workshop profile. The Craft Skills Map remains aggregated and does not use the exact address.",
    exactPublicConsent: "I understand that this full workshop/business address will be publicly visible.",
    warning: "General public location is controlled separately as country, region or city. Exact address publication is optional and available only for Workshop CraftID.",
    evidence: "Evidence files remain private regardless of these public profile settings.",
  },
  fr: {
    eyebrow: "Confidentialité", title: "Contrôlez ce que révèle votre dossier public.",
    intro: "CraftID sépare la visibilité professionnelle publique des pièces justificatives privées. Utilisez ces paramètres pour contrôler les champs du profil et la précision de la localisation.",
    photo: "Afficher la photo de profil", city: "Afficher la ville", languages: "Afficher les langues", portfolio: "Afficher le portfolio", qualifications: "Afficher les qualifications",
    location: "Précision de localisation", country: "Pays uniquement", region: "Région", cityLevel: "Ville",
    exactTitle: "Adresse exacte facultative",
    exactText: "Vous pouvez conserver en privé l’adresse exacte de l’atelier ou de l’entreprise. Les titulaires d’un Workshop CraftID peuvent choisir séparément de la publier dans le profil public de l’atelier.",
    address1: "Adresse, ligne 1", address2: "Adresse, ligne 2", postalCode: "Code postal", locality: "Ville / localité", addressCountry: "Code pays",
    save: "Enregistrer les paramètres de confidentialité", saved: "Paramètres de confidentialité enregistrés.", back: "Retour à Mon CraftID",
    exactPublic: "Afficher publiquement l’adresse exacte de l’atelier/entreprise",
    exactPublicHelp: "Workshop uniquement. Cela publie l’adresse complète dans le profil public Workshop. La Craft Skills Map reste agrégée et n’utilise pas l’adresse exacte.",
    exactPublicConsent: "Je comprends que cette adresse complète d’atelier/entreprise sera visible publiquement.",
    warning: "La localisation publique générale est contrôlée séparément au niveau pays, région ou ville. La publication de l’adresse exacte est facultative et réservée au Workshop CraftID.",
    evidence: "Les fichiers de preuve restent privés indépendamment de ces paramètres de profil public.",
  },
  de: {
    eyebrow: "Datenschutz", title: "Steuern Sie, was Ihr öffentlicher Datensatz zeigt.",
    intro: "CraftID trennt öffentliche berufliche Sichtbarkeit von privaten Nachweismaterialien. Mit diesen Einstellungen steuern Sie Profilfelder und Standortgenauigkeit.",
    photo: "Profilfoto anzeigen", city: "Stadt anzeigen", languages: "Sprachen anzeigen", portfolio: "Portfolio anzeigen", qualifications: "Qualifikationen anzeigen",
    location: "Standortgenauigkeit", country: "Nur Land", region: "Region", cityLevel: "Stadt",
    exactTitle: "Optionale genaue Adresse",
    exactText: "Sie können eine genaue Werkstatt- oder Geschäftsadresse privat speichern. Inhaber einer Workshop CraftID können separat entscheiden, ob sie im öffentlichen Werkstattprofil veröffentlicht wird.",
    address1: "Adresszeile 1", address2: "Adresszeile 2", postalCode: "Postleitzahl", locality: "Stadt / Ort", addressCountry: "Ländercode",
    save: "Datenschutzeinstellungen speichern", saved: "Datenschutzeinstellungen gespeichert.", back: "Zurück zu Meine CraftID",
    exactPublic: "Genaue Werkstatt-/Geschäftsadresse öffentlich anzeigen",
    exactPublicHelp: "Nur Workshop. Dadurch wird die vollständige Adresse im öffentlichen Workshop-Profil veröffentlicht. Die Craft Skills Map bleibt aggregiert und verwendet die genaue Adresse nicht.",
    exactPublicConsent: "Ich verstehe, dass diese vollständige Werkstatt-/Geschäftsadresse öffentlich sichtbar sein wird.",
    warning: "Der allgemeine öffentliche Standort wird separat als Land, Region oder Stadt gesteuert. Die Veröffentlichung der genauen Adresse ist optional und nur für Workshop CraftID verfügbar.",
    evidence: "Nachweisdateien bleiben unabhängig von diesen öffentlichen Profileinstellungen privat.",
  },
  nl: {
    eyebrow: "Privacy", title: "Bepaal wat uw openbare dossier toont.",
    intro: "CraftID scheidt openbare professionele zichtbaarheid van privé ondersteunend materiaal. Gebruik deze instellingen om profielvelden en locatieprecisie te beheren.",
    photo: "Profielfoto tonen", city: "Stad tonen", languages: "Talen tonen", portfolio: "Portfolio tonen", qualifications: "Kwalificaties tonen",
    location: "Locatieprecisie", country: "Alleen land", region: "Regio", cityLevel: "Stad",
    exactTitle: "Optioneel exact adres",
    exactText: "U kunt een exact werkplaats- of bedrijfsadres privé opslaan. Eigenaars van een Workshop CraftID kunnen afzonderlijk kiezen om dit in het openbare werkplaatsprofiel te publiceren.",
    address1: "Adresregel 1", address2: "Adresregel 2", postalCode: "Postcode", locality: "Stad / plaats", addressCountry: "Landcode",
    save: "Privacy-instellingen opslaan", saved: "Privacy-instellingen opgeslagen.", back: "Terug naar Mijn CraftID",
    exactPublic: "Exact werkplaats-/bedrijfsadres publiek tonen",
    exactPublicHelp: "Alleen Workshop. Hiermee wordt het volledige adres in het openbare Workshop-profiel gepubliceerd. De Craft Skills Map blijft geaggregeerd en gebruikt het exacte adres niet.",
    exactPublicConsent: "Ik begrijp dat dit volledige werkplaats-/bedrijfsadres publiek zichtbaar zal zijn.",
    warning: "De algemene openbare locatie wordt afzonderlijk ingesteld als land, regio of stad. Publicatie van het exacte adres is optioneel en alleen beschikbaar voor Workshop CraftID.",
    evidence: "Bewijsbestanden blijven privé, ongeacht deze instellingen voor het openbare profiel.",
  },
  pl: {
    eyebrow: "Prywatność", title: "Kontroluj, co ujawnia Twój publiczny zapis.",
    intro: "CraftID oddziela publiczną widoczność zawodową od prywatnych materiałów potwierdzających. Użyj tych ustawień, aby kontrolować pola profilu i dokładność lokalizacji.",
    photo: "Pokaż zdjęcie profilowe", city: "Pokaż miasto", languages: "Pokaż języki", portfolio: "Pokaż portfolio", qualifications: "Pokaż kwalifikacje",
    location: "Dokładność lokalizacji", country: "Tylko kraj", region: "Region", cityLevel: "Miasto",
    exactTitle: "Opcjonalny dokładny adres",
    exactText: "Możesz prywatnie przechowywać dokładny adres pracowni lub firmy. Właściciele Workshop CraftID mogą osobno zdecydować o jego publikacji w publicznym profilu pracowni.",
    address1: "Adres, wiersz 1", address2: "Adres, wiersz 2", postalCode: "Kod pocztowy", locality: "Miasto / miejscowość", addressCountry: "Kod kraju",
    save: "Zapisz ustawienia prywatności", saved: "Ustawienia prywatności zapisane.", back: "Wróć do Mój CraftID",
    exactPublic: "Pokaż publicznie dokładny adres pracowni/firmy",
    exactPublicHelp: "Tylko Workshop. Publikuje pełny adres w publicznym profilu Workshop. Craft Skills Map pozostaje zagregowana i nie używa dokładnego adresu.",
    exactPublicConsent: "Rozumiem, że pełny adres pracowni/firmy będzie widoczny publicznie.",
    warning: "Ogólna lokalizacja publiczna jest kontrolowana osobno jako kraj, region lub miasto. Publikacja dokładnego adresu jest opcjonalna i dostępna tylko dla Workshop CraftID.",
    evidence: "Pliki dowodowe pozostają prywatne niezależnie od tych ustawień profilu publicznego.",
  },
  it: {
    eyebrow: "Privacy", title: "Controlla cosa rivela il tuo record pubblico.",
    intro: "CraftID separa la visibilità professionale pubblica dai materiali di supporto privati. Usa queste impostazioni per controllare i campi del profilo e la precisione della posizione.",
    photo: "Mostra foto profilo", city: "Mostra città", languages: "Mostra lingue", portfolio: "Mostra portfolio", qualifications: "Mostra qualifiche",
    location: "Precisione della posizione", country: "Solo paese", region: "Regione", cityLevel: "Città",
    exactTitle: "Indirizzo esatto facoltativo",
    exactText: "Puoi conservare privatamente un indirizzo esatto del laboratorio o dell’attività. I titolari di Workshop CraftID possono scegliere separatamente se pubblicarlo nel profilo pubblico del laboratorio.",
    address1: "Indirizzo, riga 1", address2: "Indirizzo, riga 2", postalCode: "CAP", locality: "Città / località", addressCountry: "Codice paese",
    save: "Salva impostazioni privacy", saved: "Impostazioni privacy salvate.", back: "Torna a Il mio CraftID",
    exactPublic: "Mostra pubblicamente l’indirizzo esatto del laboratorio/attività",
    exactPublicHelp: "Solo Workshop. Pubblica l’indirizzo completo nel profilo pubblico Workshop. La Craft Skills Map resta aggregata e non usa l’indirizzo esatto.",
    exactPublicConsent: "Comprendo che questo indirizzo completo del laboratorio/attività sarà visibile pubblicamente.",
    warning: "La posizione pubblica generale è controllata separatamente come paese, regione o città. La pubblicazione dell’indirizzo esatto è facoltativa e disponibile solo per Workshop CraftID.",
    evidence: "I file delle evidenze restano privati indipendentemente da queste impostazioni del profilo pubblico.",
  },
  es: {
    eyebrow: "Privacidad", title: "Controla lo que revela tu registro público.",
    intro: "CraftID separa la visibilidad profesional pública del material de apoyo privado. Usa estos ajustes para controlar los campos del perfil y la precisión de la ubicación.",
    photo: "Mostrar foto de perfil", city: "Mostrar ciudad", languages: "Mostrar idiomas", portfolio: "Mostrar portfolio", qualifications: "Mostrar cualificaciones",
    location: "Precisión de ubicación", country: "Solo país", region: "Región", cityLevel: "Ciudad",
    exactTitle: "Dirección exacta opcional",
    exactText: "Puedes guardar de forma privada una dirección exacta del taller o negocio. Los titulares de Workshop CraftID pueden elegir por separado publicarla en el perfil público del taller.",
    address1: "Dirección, línea 1", address2: "Dirección, línea 2", postalCode: "Código postal", locality: "Ciudad / localidad", addressCountry: "Código de país",
    save: "Guardar ajustes de privacidad", saved: "Ajustes de privacidad guardados.", back: "Volver a Mi CraftID",
    exactPublic: "Mostrar públicamente la dirección exacta del taller/negocio",
    exactPublicHelp: "Solo Workshop. Publica la dirección completa en el perfil público Workshop. Craft Skills Map permanece agregada y no utiliza la dirección exacta.",
    exactPublicConsent: "Entiendo que esta dirección completa del taller/negocio será visible públicamente.",
    warning: "La ubicación pública general se controla por separado como país, región o ciudad. Publicar la dirección exacta es opcional y solo está disponible para Workshop CraftID.",
    evidence: "Los archivos de evidencias permanecen privados independientemente de estos ajustes del perfil público.",
  },
  uk: {
    eyebrow: "Приватність", title: "Контролюйте, що показує ваш публічний запис.",
    intro: "CraftID розділяє публічну професійну видимість і приватні підтвердні матеріали. Використовуйте ці налаштування для керування полями профілю та точністю місцезнаходження.",
    photo: "Показувати фото профілю", city: "Показувати місто", languages: "Показувати мови", portfolio: "Показувати портфоліо", qualifications: "Показувати кваліфікації",
    location: "Точність місцезнаходження", country: "Лише країна", region: "Регіон", cityLevel: "Місто",
    exactTitle: "Точна адреса за бажанням",
    exactText: "Точну адресу майстерні або бізнесу можна зберігати приватно. Власник Workshop CraftID може окремо дозволити її публікацію у публічному профілі майстерні.",
    address1: "Адреса, рядок 1", address2: "Адреса, рядок 2", postalCode: "Поштовий індекс", locality: "Місто / населений пункт", addressCountry: "Код країни",
    save: "Зберегти налаштування приватності", saved: "Налаштування приватності збережено.", back: "Назад до Мій CraftID",
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
  const t = copy[locale];
  const { supabase, userId, entity } = await getOwnedCraftId(params.entity);
  const q = entity ? ownerWorkspaceQuery(locale, entity.id) : localeQuery(locale);
  if (!userId) redirect(`/login${localeQuery(locale)}`);
  if (params.entity && !entity) redirect(`/my-craftid${localeQuery(locale)}`);
  if (!entity) redirect(`/onboarding${localeQuery(locale)}`);

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
