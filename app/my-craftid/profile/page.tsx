/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom } from "@/components/site-shell";
import { updateProfile, uploadProfileImage, updateContactPoints } from "./actions";

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
    photo: "Profile image",
    photoText: "Add a portrait or workshop image. JPEG, PNG or WebP, up to 5 MB.",
    uploadPhoto: "Upload image",
    noPhoto: "No image uploaded yet.",
    contactsEyebrow: "Professional contact & external presence",
    contactsTitle: "Add the professional channels you want to associate with CraftID.",
    contactsIntro: "All fields are optional. Each contact can stay private or be shown publicly.",
    professionalEmail: "Professional email",
    phone: "Phone",
    website: "Website",
    linkedin: "LinkedIn",
    portfolio: "Portfolio URL",
    publicToggle: "Show publicly",
    saveContacts: "Save contact settings",
    contactsSaved: "Contact settings saved.",
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
    photo: "Зображення профілю",
    photoText: "Додайте портрет або зображення майстерні. JPEG, PNG або WebP до 5 МБ.",
    uploadPhoto: "Завантажити зображення",
    noPhoto: "Зображення ще не завантажено.",
    contactsEyebrow: "Професійні контакти та зовнішні профілі",
    contactsTitle: "Додайте професійні канали, які хочете пов’язати з CraftID.",
    contactsIntro: "Усі поля необов’язкові. Кожен контакт можна залишити приватним або показувати публічно.",
    professionalEmail: "Професійний email",
    phone: "Телефон",
    website: "Вебсайт",
    linkedin: "LinkedIn",
    portfolio: "Посилання на портфоліо",
    publicToggle: "Показувати публічно",
    saveContacts: "Зберегти контакти",
    contactsSaved: "Контактні налаштування збережено.",
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

  const [result, contactsResult] = await Promise.all([
    entity.entity_type === "professional"
      ? supabase.from("professional_profiles").select("display_name, professional_title, country_code, region, city, about, profile_photo_path").eq("entity_id", entity.id).single()
      : supabase.from("workshop_profiles").select("display_name, craft_sector, country_code, region, city, about, profile_photo_path").eq("entity_id", entity.id).single(),
    supabase
      .from("entity_contact_points")
      .select("contact_type, value, visibility")
      .eq("entity_id", entity.id),
  ]);

  const record = result.data as {
    display_name: string;
    professional_title?: string | null;
    craft_sector?: string | null;
    country_code?: string | null;
    region?: string | null;
    city?: string | null;
    about?: string | null;
    profile_photo_path?: string | null;
  };

  const contacts = new Map(
    (contactsResult.data ?? []).map((item) => [item.contact_type, item]),
  );

  let photoUrl: string | null = null;
  if (record.profile_photo_path) {
    const { data: signed } = await supabase.storage
      .from("profile-images")
      .createSignedUrl(record.profile_photo_path, 60 * 60);
    photoUrl = signed?.signedUrl ?? null;
  }

  return (
    <main className="workspacePage">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={`/my-craftid${q}`}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="workspaceIntro">{t.intro}</p>
        <p className="privacyNote">{t.privacy}</p>

        {params.error ? <p className="formMessage error">{params.error}</p> : null}
        {params.message ? (
          <p className="formMessage">
            {params.message === "photo" ? t.uploadPhoto : params.message === "contacts" ? t.contactsSaved : t.saved}
          </p>
        ) : null}

        <section className="profileImageSection">
          <div>
            <div className="eyebrow">{t.photo}</div>
            <p className="fieldHelp">{t.photoText}</p>
          </div>
          <div className="profileImageRow">
            <div className="profileImagePreview">
              {photoUrl ? <img src={photoUrl} alt="" /> : <span>{t.noPhoto}</span>}
            </div>
            <form className="profileImageForm" action={uploadProfileImage}>
              <input type="hidden" name="lang" value={locale} />
              <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
              <button className="button" type="submit">{t.uploadPhoto}</button>
            </form>
          </div>
        </section>

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

        <section className="contactSection">
          <div className="eyebrow">{t.contactsEyebrow}</div>
          <h2>{t.contactsTitle}</h2>
          <p className="fieldHelp">{t.contactsIntro}</p>

          <form className="workspaceForm contactForm" action={updateContactPoints}>
            <input type="hidden" name="lang" value={locale} />

            {[
              ["professional_email", "professionalEmail", t.professionalEmail, "email"],
              ["phone", "phone", t.phone, "tel"],
              ["website", "website", t.website, "url"],
              ["linkedin", "linkedin", t.linkedin, "url"],
              ["portfolio", "portfolio", t.portfolio, "url"],
            ].map(([type, name, label, inputType]) => {
              const item = contacts.get(type);
              return (
                <div className="contactRow" key={type}>
                  <label className="contactValue">
                    {label}
                    <input
                      name={name}
                      type={inputType}
                      defaultValue={item?.value ?? ""}
                    />
                  </label>
                  <label className="contactVisibility">
                    <input
                      type="checkbox"
                      name={`${name}Public`}
                      defaultChecked={item?.visibility === "public"}
                    />
                    {t.publicToggle}
                  </label>
                </div>
              );
            })}

            <button className="button buttonPrimary" type="submit">{t.saveContacts}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
