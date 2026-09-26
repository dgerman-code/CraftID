import { localeQuery } from "@/lib/i18n";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { updateProfile, uploadProfileImage, updateContactPoints } from "./actions";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; entity?: string; error?: string; message?: string }> };

const copy = {
  en: {
    eyebrow: "Profile information",
    title: "Describe your professional practice.",
    intro: "This information forms the descriptive layer of your CraftID record. Professional claims and evidence are managed separately.",
    name: "Display name", role: "Professional title / craft sector", country: "Country code", region: "Region", city: "City", about: "About",
    englishRecommended: "English recommended",
    englishGuidance: "Use English for your professional title and main profile description where possible. English is the common cross-border language of CraftID records and helps your profile remain understandable across Europe.",
    save: "Save profile", back: "Back to My CraftID", saved: "Profile saved.",
    privacy: "Use city or region rather than a private home address. Public visibility is controlled separately in Privacy.",
    photo: "Profile image", photoText: "Add a portrait or workshop image. JPEG, PNG or WebP, up to 5 MB.", uploadPhoto: "Upload image", noPhoto: "No image uploaded yet.",
    contactsEyebrow: "Professional contact & external presence",
    contactsTitle: "Add the professional channels you want to associate with CraftID.",
    contactsIntro: "All fields are optional. Each contact can stay private or be shown publicly.",
    professionalEmail: "Professional email", phone: "Phone", website: "Website", linkedin: "LinkedIn", portfolio: "Portfolio URL",
    publicToggle: "Show publicly", partnerToggle: "Share with institutional partners on request",
    privateContactNote: "Email and phone are never exposed publicly. They may be shared only through controlled institutional workflows if you opt in.",
    saveContacts: "Save contact settings", contactsSaved: "Contact settings saved.",
  },
  fr: {
    eyebrow: "Informations du profil",
    title: "Décrivez votre pratique professionnelle.",
    intro: "Ces informations constituent la couche descriptive de votre dossier CraftID. Les déclarations professionnelles et les preuves sont gérées séparément.",
    name: "Nom affiché", role: "Titre professionnel / secteur artisanal", country: "Code pays", region: "Région", city: "Ville", about: "À propos",
    englishRecommended: "Anglais recommandé",
    englishGuidance: "Utilisez si possible l’anglais pour votre titre professionnel et la description principale du profil. L’anglais est la langue commune transfrontalière des dossiers CraftID et aide votre profil à rester compréhensible dans toute l’Europe.",
    save: "Enregistrer le profil", back: "Retour à Mon CraftID", saved: "Profil enregistré.",
    privacy: "Indiquez une ville ou une région plutôt qu’une adresse privée. La visibilité publique se règle séparément dans Confidentialité.",
    photo: "Image du profil", photoText: "Ajoutez un portrait ou une image de l’atelier. JPEG, PNG ou WebP, jusqu’à 5 Mo.", uploadPhoto: "Téléverser l’image", noPhoto: "Aucune image téléversée.",
    contactsEyebrow: "Contacts professionnels et présence externe",
    contactsTitle: "Ajoutez les canaux professionnels que vous souhaitez associer à CraftID.",
    contactsIntro: "Tous les champs sont facultatifs. Chaque contact peut rester privé ou être affiché publiquement.",
    professionalEmail: "E-mail professionnel", phone: "Téléphone", website: "Site web", linkedin: "LinkedIn", portfolio: "URL du portfolio",
    publicToggle: "Afficher publiquement", partnerToggle: "Partager avec des partenaires institutionnels sur demande",
    privateContactNote: "L’e-mail et le téléphone ne sont jamais affichés publiquement. Ils ne peuvent être partagés que via des processus institutionnels contrôlés si vous y consentez.",
    saveContacts: "Enregistrer les contacts", contactsSaved: "Paramètres de contact enregistrés.",
  },
  de: {
    eyebrow: "Profilinformationen",
    title: "Beschreiben Sie Ihre berufliche Tätigkeit.",
    intro: "Diese Angaben bilden die beschreibende Ebene Ihres CraftID-Datensatzes. Berufliche Angaben und Nachweise werden getrennt verwaltet.",
    name: "Anzeigename", role: "Berufsbezeichnung / Handwerksbereich", country: "Ländercode", region: "Region", city: "Stadt", about: "Über die Tätigkeit",
    englishRecommended: "Englisch empfohlen",
    englishGuidance: "Verwenden Sie nach Möglichkeit Englisch für Ihre Berufsbezeichnung und die Hauptbeschreibung des Profils. Englisch ist die gemeinsame grenzüberschreitende Sprache der CraftID-Datensätze und macht Ihr Profil europaweit verständlich.",
    save: "Profil speichern", back: "Zurück zu Meine CraftID", saved: "Profil gespeichert.",
    privacy: "Geben Sie Stadt oder Region statt einer privaten Wohnadresse an. Die öffentliche Sichtbarkeit wird separat unter Datenschutz gesteuert.",
    photo: "Profilbild", photoText: "Fügen Sie ein Porträt oder ein Werkstattbild hinzu. JPEG, PNG oder WebP, bis 5 MB.", uploadPhoto: "Bild hochladen", noPhoto: "Noch kein Bild hochgeladen.",
    contactsEyebrow: "Beruflicher Kontakt & externe Präsenz",
    contactsTitle: "Fügen Sie die beruflichen Kanäle hinzu, die Sie mit CraftID verknüpfen möchten.",
    contactsIntro: "Alle Felder sind optional. Jeder Kontakt kann privat bleiben oder öffentlich angezeigt werden.",
    professionalEmail: "Berufliche E-Mail", phone: "Telefon", website: "Website", linkedin: "LinkedIn", portfolio: "Portfolio-URL",
    publicToggle: "Öffentlich anzeigen", partnerToggle: "Auf Anfrage mit institutionellen Partnern teilen",
    privateContactNote: "E-Mail und Telefonnummer werden niemals öffentlich angezeigt. Sie können nur über kontrollierte institutionelle Abläufe geteilt werden, wenn Sie zustimmen.",
    saveContacts: "Kontakteinstellungen speichern", contactsSaved: "Kontakteinstellungen gespeichert.",
  },
  nl: {
    eyebrow: "Profielinformatie",
    title: "Beschrijf uw professionele praktijk.",
    intro: "Deze informatie vormt de beschrijvende laag van uw CraftID-dossier. Professionele verklaringen en bewijs worden afzonderlijk beheerd.",
    name: "Weergavenaam", role: "Professionele titel / ambachtssector", country: "Landcode", region: "Regio", city: "Stad", about: "Over de praktijk",
    englishRecommended: "Engels aanbevolen",
    englishGuidance: "Gebruik waar mogelijk Engels voor uw professionele titel en hoofdprofielbeschrijving. Engels is de gemeenschappelijke grensoverschrijdende taal van CraftID-dossiers en helpt uw profiel in heel Europa begrijpelijk te blijven.",
    save: "Profiel opslaan", back: "Terug naar Mijn CraftID", saved: "Profiel opgeslagen.",
    privacy: "Gebruik een stad of regio in plaats van een privéadres. Openbare zichtbaarheid wordt afzonderlijk beheerd onder Privacy.",
    photo: "Profielafbeelding", photoText: "Voeg een portret of afbeelding van de werkplaats toe. JPEG, PNG of WebP, tot 5 MB.", uploadPhoto: "Afbeelding uploaden", noPhoto: "Nog geen afbeelding geüpload.",
    contactsEyebrow: "Professioneel contact & externe aanwezigheid",
    contactsTitle: "Voeg de professionele kanalen toe die u aan CraftID wilt koppelen.",
    contactsIntro: "Alle velden zijn optioneel. Elk contact kan privé blijven of publiek worden weergegeven.",
    professionalEmail: "Professioneel e-mailadres", phone: "Telefoon", website: "Website", linkedin: "LinkedIn", portfolio: "Portfolio-URL",
    publicToggle: "Publiek tonen", partnerToggle: "Op verzoek delen met institutionele partners",
    privateContactNote: "E-mail en telefoon worden nooit publiek getoond. Ze kunnen alleen via gecontroleerde institutionele processen worden gedeeld als u daarvoor kiest.",
    saveContacts: "Contactinstellingen opslaan", contactsSaved: "Contactinstellingen opgeslagen.",
  },
  pl: {
    eyebrow: "Informacje o profilu",
    title: "Opisz swoją praktykę zawodową.",
    intro: "Te informacje tworzą opisową warstwę Twojego zapisu CraftID. Deklaracje zawodowe i dowody są zarządzane oddzielnie.",
    name: "Nazwa wyświetlana", role: "Tytuł zawodowy / sektor rzemiosła", country: "Kod kraju", region: "Region", city: "Miasto", about: "O praktyce",
    englishRecommended: "Zalecany język angielski",
    englishGuidance: "W miarę możliwości używaj angielskiego dla tytułu zawodowego i głównego opisu profilu. Angielski jest wspólnym językiem transgranicznym zapisów CraftID i pomaga zachować zrozumiałość profilu w całej Europie.",
    save: "Zapisz profil", back: "Wróć do Mój CraftID", saved: "Profil zapisany.",
    privacy: "Podaj miasto lub region zamiast prywatnego adresu domowego. Widoczność publiczna jest kontrolowana oddzielnie w sekcji Prywatność.",
    photo: "Zdjęcie profilu", photoText: "Dodaj portret lub zdjęcie pracowni. JPEG, PNG lub WebP, do 5 MB.", uploadPhoto: "Prześlij obraz", noPhoto: "Nie przesłano jeszcze obrazu.",
    contactsEyebrow: "Kontakt zawodowy i obecność zewnętrzna",
    contactsTitle: "Dodaj kanały zawodowe, które chcesz powiązać z CraftID.",
    contactsIntro: "Wszystkie pola są opcjonalne. Każdy kontakt może pozostać prywatny lub być pokazany publicznie.",
    professionalEmail: "E-mail zawodowy", phone: "Telefon", website: "Strona internetowa", linkedin: "LinkedIn", portfolio: "URL portfolio",
    publicToggle: "Pokaż publicznie", partnerToggle: "Udostępniaj partnerom instytucjonalnym na żądanie",
    privateContactNote: "E-mail i telefon nigdy nie są pokazywane publicznie. Mogą być udostępniane wyłącznie w kontrolowanych procesach instytucjonalnych, jeśli wyrazisz zgodę.",
    saveContacts: "Zapisz ustawienia kontaktów", contactsSaved: "Ustawienia kontaktów zapisane.",
  },
  it: {
    eyebrow: "Informazioni del profilo",
    title: "Descrivi la tua pratica professionale.",
    intro: "Queste informazioni costituiscono il livello descrittivo del tuo record CraftID. Le dichiarazioni professionali e le evidenze sono gestite separatamente.",
    name: "Nome visualizzato", role: "Titolo professionale / settore artigianale", country: "Codice paese", region: "Regione", city: "Città", about: "Informazioni",
    englishRecommended: "Inglese consigliato",
    englishGuidance: "Quando possibile, usa l’inglese per il titolo professionale e la descrizione principale del profilo. L’inglese è la lingua comune transfrontaliera dei record CraftID e aiuta a rendere il profilo comprensibile in tutta Europa.",
    save: "Salva profilo", back: "Torna a Il mio CraftID", saved: "Profilo salvato.",
    privacy: "Indica città o regione invece di un indirizzo privato. La visibilità pubblica è controllata separatamente in Privacy.",
    photo: "Immagine del profilo", photoText: "Aggiungi un ritratto o un’immagine del laboratorio. JPEG, PNG o WebP, fino a 5 MB.", uploadPhoto: "Carica immagine", noPhoto: "Nessuna immagine caricata.",
    contactsEyebrow: "Contatti professionali e presenza esterna",
    contactsTitle: "Aggiungi i canali professionali che vuoi associare a CraftID.",
    contactsIntro: "Tutti i campi sono facoltativi. Ogni contatto può restare privato o essere mostrato pubblicamente.",
    professionalEmail: "E-mail professionale", phone: "Telefono", website: "Sito web", linkedin: "LinkedIn", portfolio: "URL portfolio",
    publicToggle: "Mostra pubblicamente", partnerToggle: "Condividi con partner istituzionali su richiesta",
    privateContactNote: "E-mail e telefono non vengono mai mostrati pubblicamente. Possono essere condivisi solo tramite processi istituzionali controllati se dai il consenso.",
    saveContacts: "Salva impostazioni contatti", contactsSaved: "Impostazioni contatti salvate.",
  },
  es: {
    eyebrow: "Información del perfil",
    title: "Describe tu práctica profesional.",
    intro: "Esta información forma la capa descriptiva de tu registro CraftID. Las declaraciones profesionales y las evidencias se gestionan por separado.",
    name: "Nombre visible", role: "Título profesional / sector artesanal", country: "Código de país", region: "Región", city: "Ciudad", about: "Acerca de",
    englishRecommended: "Inglés recomendado",
    englishGuidance: "Siempre que sea posible, usa el inglés para tu título profesional y la descripción principal del perfil. El inglés es la lengua común transfronteriza de los registros CraftID y ayuda a que tu perfil sea comprensible en toda Europa.",
    save: "Guardar perfil", back: "Volver a Mi CraftID", saved: "Perfil guardado.",
    privacy: "Usa ciudad o región en lugar de una dirección privada. La visibilidad pública se controla por separado en Privacidad.",
    photo: "Imagen de perfil", photoText: "Añade un retrato o una imagen del taller. JPEG, PNG o WebP, hasta 5 MB.", uploadPhoto: "Subir imagen", noPhoto: "Aún no se ha subido ninguna imagen.",
    contactsEyebrow: "Contacto profesional y presencia externa",
    contactsTitle: "Añade los canales profesionales que quieras asociar con CraftID.",
    contactsIntro: "Todos los campos son opcionales. Cada contacto puede permanecer privado o mostrarse públicamente.",
    professionalEmail: "Correo profesional", phone: "Teléfono", website: "Sitio web", linkedin: "LinkedIn", portfolio: "URL del portfolio",
    publicToggle: "Mostrar públicamente", partnerToggle: "Compartir con socios institucionales bajo solicitud",
    privateContactNote: "El correo y el teléfono nunca se muestran públicamente. Solo pueden compartirse mediante procesos institucionales controlados si das tu consentimiento.",
    saveContacts: "Guardar ajustes de contacto", contactsSaved: "Ajustes de contacto guardados.",
  },
  uk: {
    eyebrow: "Інформація профілю",
    title: "Опишіть свою професійну практику.",
    intro: "Ця інформація формує описову частину вашого запису CraftID. Професійні твердження та докази керуються окремо.",
    name: "Відображуване ім’я", role: "Професійна назва / ремісничий напрям", country: "Код країни", region: "Регіон", city: "Місто", about: "Про практику",
    englishRecommended: "Рекомендовано англійською",
    englishGuidance: "За можливості використовуйте англійську для професійної назви та основного опису профілю. Англійська є спільною транскордонною мовою записів CraftID і допомагає зробити профіль зрозумілим по всій Європі.",
    save: "Зберегти профіль", back: "Назад до Мій CraftID", saved: "Профіль збережено.",
    privacy: "Вказуйте місто або регіон, а не приватну домашню адресу. Публічна видимість налаштовується окремо у розділі Приватність.",
    photo: "Зображення профілю", photoText: "Додайте портрет або зображення майстерні. JPEG, PNG або WebP до 5 МБ.", uploadPhoto: "Завантажити зображення", noPhoto: "Зображення ще не завантажено.",
    contactsEyebrow: "Професійні контакти та зовнішні профілі",
    contactsTitle: "Додайте професійні канали, які хочете пов’язати з CraftID.",
    contactsIntro: "Усі поля необов’язкові. Кожен контакт можна залишити приватним або показувати публічно.",
    professionalEmail: "Професійний email", phone: "Телефон", website: "Вебсайт", linkedin: "LinkedIn", portfolio: "Посилання на портфоліо",
    publicToggle: "Показувати публічно", partnerToggle: "Дозволити передавати інституційним партнерам за запитом",
    privateContactNote: "Email і телефон ніколи не показуються публічно. Вони можуть передаватися лише через контрольований інституційний процес, якщо ви окремо погодитесь.",
    saveContacts: "Зберегти контакти", contactsSaved: "Контактні налаштування збережено.",
  },
} as const;

export default async function ProfilePage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale];
  const { supabase, userId, entity } = await getOwnedCraftId(params.entity);
  const q = entity ? ownerWorkspaceQuery(locale, entity.id) : localeQuery(locale);
  if (!userId) redirect(`/login${localeQuery(locale)}`);
  if (params.entity && !entity) redirect(`/my-craftid${localeQuery(locale)}`);
  if (!entity) redirect(`/onboarding${localeQuery(locale)}`);

  const [result, contactsResult] = await Promise.all([
    entity.entity_type === "professional"
      ? supabase.from("professional_profiles").select("display_name, professional_title, country_code, region, city, about, profile_photo_path").eq("entity_id", entity.id).single()
      : supabase.from("workshop_profiles").select("display_name, craft_sector, country_code, region, city, about, profile_photo_path").eq("entity_id", entity.id).single(),
    supabase
      .from("entity_contact_points")
      .select("contact_type, value, show_in_public_profile, share_with_institutional_partners")
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
        <p className="privacyNote"><strong>{t.englishRecommended}:</strong> {t.englishGuidance}</p>

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
              <input type="hidden" name="entityId" value={entity.id} />
              <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
              <button className="button" type="submit">{t.uploadPhoto}</button>
            </form>
          </div>
        </section>

        <form className="workspaceForm" action={updateProfile}>
          <input type="hidden" name="lang" value={locale} />
              <input type="hidden" name="entityId" value={entity.id} />
          <label>{t.name}<input name="displayName" defaultValue={record.display_name} required /></label>
          <label>{t.role}<input name="title" defaultValue={record.professional_title ?? record.craft_sector ?? ""} /></label>
          <div className="formGrid">
            <label>{t.country}<input name="countryCode" maxLength={2} defaultValue={record.country_code ?? ""} placeholder="e.g. FR" /></label>
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
          <p className="privacyNote">{t.privateContactNote}</p>

          <form className="workspaceForm contactForm" action={updateContactPoints}>
            <input type="hidden" name="lang" value={locale} />
              <input type="hidden" name="entityId" value={entity.id} />

            {[
              { type: "professional_email", name: "professionalEmail", label: t.professionalEmail, inputType: "email", canBePublic: false },
              { type: "phone", name: "phone", label: t.phone, inputType: "tel", canBePublic: false },
              { type: "website", name: "website", label: t.website, inputType: "url", canBePublic: true },
              { type: "linkedin", name: "linkedin", label: t.linkedin, inputType: "url", canBePublic: true },
              { type: "portfolio", name: "portfolio", label: t.portfolio, inputType: "url", canBePublic: true },
            ].map(({ type, name, label, inputType, canBePublic }) => {
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
                  <div className="contactVisibilityGroup">
                    {canBePublic ? (
                      <label className="contactVisibility">
                        <input
                          type="checkbox"
                          name={`${name}Public`}
                          defaultChecked={item?.show_in_public_profile === true}
                        />
                        {t.publicToggle}
                      </label>
                    ) : null}
                    <label className="contactVisibility">
                      <input
                        type="checkbox"
                        name={`${name}Partner`}
                        defaultChecked={item?.share_with_institutional_partners === true}
                      />
                      {t.partnerToggle}
                    </label>
                  </div>
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
