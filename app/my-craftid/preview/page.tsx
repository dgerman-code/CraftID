import { localeQuery } from "@/lib/i18n";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { formatCraftId } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; entity?: string }> };

const copy = {
  en: {
    eyebrow: "Owner preview", back: "Back to My CraftID", preview: "Preview of your record",
    draft: "This is an owner-only preview. It is not public while the record remains in draft.",
    skills: "Skills", about: "About", location: "Location", exactAddress: "Workshop address",
    noSkills: "No skills added yet.", noAbout: "No description added yet.", notSet: "Not set",
    contact: "Contact & links", professional_email: "Email", phone: "Phone", website: "Website", linkedin: "LinkedIn", portfolio: "Portfolio",
  },
  fr: {
    eyebrow: "Aperçu propriétaire", back: "Retour à Mon CraftID", preview: "Aperçu de votre dossier",
    draft: "Cet aperçu est réservé au titulaire. Il n’est pas public tant que le dossier reste en brouillon.",
    skills: "Compétences", about: "À propos", location: "Localisation", exactAddress: "Adresse de l’atelier",
    noSkills: "Aucune compétence ajoutée.", noAbout: "Aucune description ajoutée.", notSet: "Non renseigné",
    contact: "Contacts et liens", professional_email: "E-mail", phone: "Téléphone", website: "Site web", linkedin: "LinkedIn", portfolio: "Portfolio",
  },
  de: {
    eyebrow: "Inhabervorschau", back: "Zurück zu Meine CraftID", preview: "Vorschau Ihres Datensatzes",
    draft: "Dies ist eine Vorschau nur für den Inhaber. Solange der Datensatz ein Entwurf ist, ist er nicht öffentlich.",
    skills: "Kompetenzen", about: "Über die Tätigkeit", location: "Standort", exactAddress: "Werkstattadresse",
    noSkills: "Noch keine Kompetenzen hinzugefügt.", noAbout: "Noch keine Beschreibung hinzugefügt.", notSet: "Nicht angegeben",
    contact: "Kontakt & Links", professional_email: "E-Mail", phone: "Telefon", website: "Website", linkedin: "LinkedIn", portfolio: "Portfolio",
  },
  nl: {
    eyebrow: "Voorbeeld voor eigenaar", back: "Terug naar Mijn CraftID", preview: "Voorbeeld van uw dossier",
    draft: "Dit is een voorbeeld dat alleen voor de eigenaar zichtbaar is. Zolang het dossier concept blijft, is het niet openbaar.",
    skills: "Vaardigheden", about: "Over de praktijk", location: "Locatie", exactAddress: "Adres werkplaats",
    noSkills: "Nog geen vaardigheden toegevoegd.", noAbout: "Nog geen beschrijving toegevoegd.", notSet: "Niet ingesteld",
    contact: "Contact & links", professional_email: "E-mail", phone: "Telefoon", website: "Website", linkedin: "LinkedIn", portfolio: "Portfolio",
  },
  pl: {
    eyebrow: "Podgląd właściciela", back: "Wróć do Mój CraftID", preview: "Podgląd Twojego zapisu",
    draft: "To podgląd dostępny tylko dla właściciela. Zapis nie jest publiczny, dopóki pozostaje wersją roboczą.",
    skills: "Umiejętności", about: "O praktyce", location: "Lokalizacja", exactAddress: "Adres pracowni",
    noSkills: "Nie dodano jeszcze umiejętności.", noAbout: "Nie dodano jeszcze opisu.", notSet: "Nie ustawiono",
    contact: "Kontakt i linki", professional_email: "E-mail", phone: "Telefon", website: "Strona internetowa", linkedin: "LinkedIn", portfolio: "Portfolio",
  },
  it: {
    eyebrow: "Anteprima proprietario", back: "Torna a Il mio CraftID", preview: "Anteprima del tuo record",
    draft: "Questa anteprima è visibile solo al titolare. Non è pubblica finché il record resta in bozza.",
    skills: "Competenze", about: "Informazioni", location: "Località", exactAddress: "Indirizzo laboratorio",
    noSkills: "Nessuna competenza aggiunta.", noAbout: "Nessuna descrizione aggiunta.", notSet: "Non impostato",
    contact: "Contatti e link", professional_email: "E-mail", phone: "Telefono", website: "Sito web", linkedin: "LinkedIn", portfolio: "Portfolio",
  },
  es: {
    eyebrow: "Vista previa del titular", back: "Volver a Mi CraftID", preview: "Vista previa de tu registro",
    draft: "Esta vista previa solo es visible para el titular. No es pública mientras el registro siga como borrador.",
    skills: "Competencias", about: "Acerca de", location: "Ubicación", exactAddress: "Dirección del taller",
    noSkills: "Aún no se han añadido competencias.", noAbout: "Aún no se ha añadido una descripción.", notSet: "No establecido",
    contact: "Contacto y enlaces", professional_email: "Correo electrónico", phone: "Teléfono", website: "Sitio web", linkedin: "LinkedIn", portfolio: "Portfolio",
  },
  uk: {
    eyebrow: "Попередній перегляд", back: "Назад до Мій CraftID", preview: "Попередній вигляд вашого запису",
    draft: "Це перегляд лише для власника. Запис не є публічним, поки має статус чернетки.",
    skills: "Навички", about: "Про практику", location: "Місце", exactAddress: "Адреса майстерні",
    noSkills: "Навички ще не додані.", noAbout: "Опис ще не додано.", notSet: "Не вказано",
    contact: "Контакти та посилання", professional_email: "Email", phone: "Телефон", website: "Вебсайт", linkedin: "LinkedIn", portfolio: "Портфоліо",
  },
} as const;

export default async function PreviewPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const { supabase, userId, entity } = await getOwnedCraftId(sp.entity);
  const q = entity ? ownerWorkspaceQuery(locale, entity.id) : localeQuery(locale);
  if (!userId) redirect(`/login${localeQuery(locale)}`);
  if (sp.entity && !entity) redirect(`/my-craftid${localeQuery(locale)}`);
  if (!entity) redirect(`/onboarding${localeQuery(locale)}`);

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
      .select("address_line1, address_line2, postal_code, locality, country_code, show_in_public_profile")
      .eq("entity_id", entity.id)
      .maybeSingle(),
    supabase
      .from("entity_contact_points")
      .select("contact_type, value, verification_level, verified_at, last_checked_at")
      .eq("entity_id", entity.id)
      .eq("show_in_public_profile", true)
      .in("contact_type", ["website", "linkedin", "portfolio"]),
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
  }

  const exactAddress =
    entity.entity_type === "workshop" && address?.show_in_public_profile
      ? [
          address.address_line1,
          address.address_line2,
          [address.postal_code, address.locality].filter(Boolean).join(" "),
          address.country_code,
        ].filter(Boolean).join(", ")
      : "";

  return (
    <main className="workspacePage previewPage">
      <div className="container">
        <Link className="backLink" href={`/my-craftid${q}`}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <p className="previewNotice">{t.draft}</p>

        <section className="ownerPreviewCard">
          <div className="ownerPreviewHeader">
            <div>
              <div className="recordId">CraftID #{formatCraftId(entity.craftid_number, entity.craftid_check_digits)}</div>
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

              {exactAddress ? (
                <>
                  <div className="eyebrow previewSkillsLabel">{t.exactAddress}</div>
                  <p>{exactAddress}</p>
                </>
              ) : null}

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
