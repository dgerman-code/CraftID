/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; entity?: string }> };

function formatCraftId(value: number | string, checkDigits: string) {
  return `#${String(value).padStart(8, "0")}-${checkDigits}`;
}

const copy = {
  en: {
    eyebrow: "Owner preview",
    back: "Back to My CraftID",
    preview: "Preview of your record",
    draft: "This is an owner-only preview. It is not public while the record remains in draft.",
    skills: "Skills",
    about: "About",
    location: "Location",
    noSkills: "No skills added yet.",
    noAbout: "No description added yet.",
    notSet: "Not set",
    contact: "Contact & links",
    professional_email: "Email",
    phone: "Phone",
    website: "Website",
    linkedin: "LinkedIn",
    portfolio: "Portfolio",
  },
  uk: {
    eyebrow: "Попередній перегляд",
    back: "Назад до Мій CraftID",
    preview: "Попередній вигляд вашого запису",
    draft: "Це перегляд лише для власника. Запис не є публічним, поки має статус чернетки.",
    skills: "Навички",
    about: "Про практику",
    location: "Місце",
    noSkills: "Навички ще не додані.",
    noAbout: "Опис ще не додано.",
    notSet: "Не вказано",
    contact: "Контакти та посилання",
    professional_email: "Email",
    phone: "Телефон",
    website: "Вебсайт",
    linkedin: "LinkedIn",
    portfolio: "Портфоліо",
  },
} as const;

export default async function PreviewPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const { supabase, userId, entity } = await getOwnedCraftId(sp.entity);
  const q = entity ? ownerWorkspaceQuery(locale, entity.id) : locale === "uk" ? "?lang=uk" : "";
  if (!userId) redirect(locale === "uk" ? "/login?lang=uk" : "/login");
  if (sp.entity && !entity) redirect(locale === "uk" ? "/my-craftid?lang=uk" : "/my-craftid");
  if (!entity) redirect(locale === "uk" ? "/onboarding?lang=uk" : "/onboarding");

  const profileResult =
    entity.entity_type === "professional"
      ? await supabase
          .from("professional_profiles")
          .select("display_name, professional_title, country_code, region, city, about, profile_photo_path")
          .eq("entity_id", entity.id)
          .single()
      : await supabase
          .from("workshop_profiles")
          .select("display_name, craft_sector, country_code, region, city, about, profile_photo_path")
          .eq("entity_id", entity.id)
          .single();

  const record = profileResult.data as {
    display_name: string;
    professional_title?: string | null;
    craft_sector?: string | null;
    country_code?: string | null;
    region?: string | null;
    city?: string | null;
    about?: string | null;
    profile_photo_path?: string | null;
  };

  const [{ data: claims }, { data: privacy }, { data: address }, { data: contacts }] = await Promise.all([
    supabase
      .from("claims")
      .select("id, claim_type, title, status, visibility")
      .eq("entity_id", entity.id)
      .eq("visibility", "public")
      .order("created_at", { ascending: true }),
    supabase
      .from("privacy_settings")
      .select("show_profile_photo, show_city, show_languages, show_portfolio, show_qualifications, location_precision")
      .eq("entity_id", entity.id)
      .single(),
    supabase
      .from("entity_business_addresses")
      .select("address_line1, address_line2, postal_code, locality, country_code")
      .eq("entity_id", entity.id)
      .maybeSingle(),
    supabase
      .from("public_contact_links")
      .select("contact_type, value, verification_level, verified_at, last_checked_at")
      .eq("entity_id", entity.id),
  ]);

  let photoUrl: string | null = null;
  if (privacy?.show_profile_photo && record.profile_photo_path) {
    const { data: signed } = await supabase.storage
      .from("profile-images")
      .createSignedUrl(record.profile_photo_path, 60 * 60);
    photoUrl = signed?.signedUrl ?? null;
  }

  const skills = (claims ?? []).filter((claim) => claim.claim_type === "skill");

  let location = [record.region, record.country_code].filter(Boolean).join(", ");
  if (privacy?.location_precision === "country") {
    location = record.country_code ?? "";
  } else if (privacy?.location_precision === "region") {
    location = [record.region, record.country_code].filter(Boolean).join(", ");
  } else if (privacy?.location_precision === "city") {
    location = [record.city, record.region, record.country_code].filter(Boolean).join(", ");
  } else if (privacy?.location_precision === "exact_business_location" && address) {
    location = [
      address.address_line1,
      address.address_line2,
      [address.postal_code, address.locality].filter(Boolean).join(" "),
      address.country_code,
    ].filter(Boolean).join(", ");
  }

  return (
    <main className="workspacePage previewPage">
      <div className="container">
        <Link className="backLink" href={`/my-craftid${q}`}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <p className="previewNotice">{t.draft}</p>

        <section className="ownerPreviewCard">
          <div className="ownerPreviewHeader">
            <div>
              <div className="recordId">CraftID {formatCraftId(entity.craftid_number, entity.craftid_check_digits)}</div>
              <h1>{record.display_name}</h1>
              <p className="profileRole">{record.professional_title ?? record.craft_sector ?? ""}</p>
            </div>
            {photoUrl ? <img className="ownerPreviewImage" src={photoUrl} alt="" /> : null}
          </div>

          <div className="ownerPreviewGrid">
            <section>
              <div className="eyebrow">{t.about}</div>
              <p>{record.about || t.noAbout}</p>
            </section>
            <aside>
              <div className="eyebrow">{t.location}</div>
              <p>{location || t.notSet}</p>

              <div className="eyebrow previewSkillsLabel">{t.skills}</div>
              {skills.length ? (
                <div className="tagRow">
                  {skills.map((skill) => <span className="tag" key={skill.id}>{skill.title}</span>)}
                </div>
              ) : <p>{t.noSkills}</p>}

              {contacts?.length ? (
                <>
                  <div className="eyebrow previewSkillsLabel">{t.contact}</div>
                  <div className="contactPreviewList">
                    {contacts.map((item) => {
                      const label = t[item.contact_type as keyof typeof t] ?? item.contact_type;
                      const isUrl = ["website", "linkedin", "portfolio"].includes(item.contact_type);
                      const href = item.contact_type === "professional_email"
                        ? `mailto:${item.value}`
                        : item.contact_type === "phone"
                          ? `tel:${item.value}`
                          : item.value;
                      return isUrl || item.contact_type === "professional_email" || item.contact_type === "phone" ? (
                        <a key={item.contact_type} href={href} target={isUrl ? "_blank" : undefined} rel={isUrl ? "nofollow noopener noreferrer" : undefined}>
                          {label} →
                        </a>
                      ) : null;
                    })}
                  </div>
                </>
              ) : null}
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
