import Link from "next/link";
import { localeFrom } from "@/components/site-shell";
import { formatCraftId, parseCraftId } from "@/lib/craftid-format";
import { submitPublicContactRequest } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ craftId: string }>;
  searchParams: Promise<{ lang?: string; error?: string; message?: string }>;
};

const copy = {
  en: {
    eyebrow: "Controlled contact",
    title: "Send a professional enquiry through CraftID.",
    intro: "Your message is delivered through CraftID. The professional's private email and phone are not disclosed.",
    name: "Your name",
    email: "Your email",
    organisation: "Organisation (optional)",
    role: "Role / position (optional)",
    purpose: "Purpose",
    professional: "Professional enquiry",
    partnership: "Institutional partnership",
    project: "Project invitation",
    training: "Training",
    commission: "Commission / work request",
    other: "Other",
    messageLabel: "Message",
    send: "Send enquiry",
    sent: "Your enquiry has been sent.",
    privacy: "Do not include sensitive personal information or confidential documents in this message.",
    home: "Back to CraftID",
  },
  fr: {
    eyebrow: "Contact contrôlé", title: "Envoyer une demande professionnelle via CraftID.",
    intro: "Votre message est transmis via CraftID. L’e-mail privé et le téléphone du professionnel ne sont pas divulgués.",
    name: "Votre nom", email: "Votre e-mail", organisation: "Organisation (facultatif)", role: "Rôle / fonction (facultatif)", purpose: "Objet",
    professional: "Demande professionnelle", partnership: "Partenariat institutionnel", project: "Invitation à un projet", training: "Formation", commission: "Commande / demande de travail", other: "Autre",
    messageLabel: "Message", send: "Envoyer la demande", sent: "Votre demande a été envoyée.",
    privacy: "N’incluez pas d’informations personnelles sensibles ni de documents confidentiels dans ce message.", home: "Retour à CraftID",
  },
  de: {
    eyebrow: "Kontrollierter Kontakt", title: "Berufliche Anfrage über CraftID senden.",
    intro: "Ihre Nachricht wird über CraftID übermittelt. Private E-Mail-Adresse und Telefonnummer der Person werden nicht offengelegt.",
    name: "Ihr Name", email: "Ihre E-Mail", organisation: "Organisation (optional)", role: "Rolle / Position (optional)", purpose: "Zweck",
    professional: "Berufliche Anfrage", partnership: "Institutionelle Partnerschaft", project: "Projekteinladung", training: "Schulung", commission: "Auftrag / Arbeitsanfrage", other: "Sonstiges",
    messageLabel: "Nachricht", send: "Anfrage senden", sent: "Ihre Anfrage wurde gesendet.",
    privacy: "Fügen Sie dieser Nachricht keine sensiblen personenbezogenen Informationen oder vertraulichen Dokumente bei.", home: "Zurück zu CraftID",
  },
  nl: {
    eyebrow: "Gecontroleerd contact", title: "Stuur een professionele aanvraag via CraftID.",
    intro: "Uw bericht wordt via CraftID bezorgd. Het privé-e-mailadres en telefoonnummer van de professional worden niet bekendgemaakt.",
    name: "Uw naam", email: "Uw e-mail", organisation: "Organisatie (optioneel)", role: "Rol / functie (optioneel)", purpose: "Doel",
    professional: "Professionele aanvraag", partnership: "Institutioneel partnerschap", project: "Projectuitnodiging", training: "Opleiding", commission: "Opdracht / werkverzoek", other: "Overig",
    messageLabel: "Bericht", send: "Aanvraag verzenden", sent: "Uw aanvraag is verzonden.",
    privacy: "Neem geen gevoelige persoonsgegevens of vertrouwelijke documenten op in dit bericht.", home: "Terug naar CraftID",
  },
  pl: {
    eyebrow: "Kontrolowany kontakt", title: "Wyślij zapytanie zawodowe przez CraftID.",
    intro: "Twoja wiadomość jest przekazywana przez CraftID. Prywatny e-mail i telefon profesjonalisty nie są ujawniane.",
    name: "Twoje imię i nazwisko", email: "Twój e-mail", organisation: "Organizacja (opcjonalnie)", role: "Rola / stanowisko (opcjonalnie)", purpose: "Cel",
    professional: "Zapytanie zawodowe", partnership: "Partnerstwo instytucjonalne", project: "Zaproszenie do projektu", training: "Szkolenie", commission: "Zlecenie / zapytanie o pracę", other: "Inne",
    messageLabel: "Wiadomość", send: "Wyślij zapytanie", sent: "Twoje zapytanie zostało wysłane.",
    privacy: "Nie umieszczaj w wiadomości wrażliwych danych osobowych ani poufnych dokumentów.", home: "Wróć do CraftID",
  },
  it: {
    eyebrow: "Contatto controllato", title: "Invia una richiesta professionale tramite CraftID.",
    intro: "Il tuo messaggio viene consegnato tramite CraftID. E-mail privata e telefono del professionista non vengono divulgati.",
    name: "Il tuo nome", email: "La tua e-mail", organisation: "Organizzazione (facoltativa)", role: "Ruolo / posizione (facoltativo)", purpose: "Finalità",
    professional: "Richiesta professionale", partnership: "Partnership istituzionale", project: "Invito a un progetto", training: "Formazione", commission: "Commissione / richiesta di lavoro", other: "Altro",
    messageLabel: "Messaggio", send: "Invia richiesta", sent: "La tua richiesta è stata inviata.",
    privacy: "Non includere informazioni personali sensibili o documenti riservati in questo messaggio.", home: "Torna a CraftID",
  },
  es: {
    eyebrow: "Contacto controlado", title: "Envía una consulta profesional a través de CraftID.",
    intro: "Tu mensaje se entrega a través de CraftID. No se revelan el correo privado ni el teléfono del profesional.",
    name: "Tu nombre", email: "Tu correo electrónico", organisation: "Organización (opcional)", role: "Rol / cargo (opcional)", purpose: "Finalidad",
    professional: "Consulta profesional", partnership: "Colaboración institucional", project: "Invitación a proyecto", training: "Formación", commission: "Encargo / solicitud de trabajo", other: "Otro",
    messageLabel: "Mensaje", send: "Enviar consulta", sent: "Tu consulta ha sido enviada.",
    privacy: "No incluyas información personal sensible ni documentos confidenciales en este mensaje.", home: "Volver a CraftID",
  },
  uk: {
    eyebrow: "Контрольований контакт",
    title: "Надішліть професійний запит через CraftID.",
    intro: "Ваше повідомлення передається через CraftID. Приватний email і телефон професіонала не розкриваються.",
    name: "Ваше ім’я",
    email: "Ваш email",
    organisation: "Організація (за бажанням)",
    role: "Роль / посада (за бажанням)",
    purpose: "Мета",
    professional: "Професійний запит",
    partnership: "Інституційне партнерство",
    project: "Запрошення до проєкту",
    training: "Навчання",
    commission: "Замовлення / робочий запит",
    other: "Інше",
    messageLabel: "Повідомлення",
    send: "Надіслати запит",
    sent: "Ваш запит надіслано.",
    privacy: "Не додавайте до повідомлення чутливі персональні дані або конфіденційні документи.",
    home: "Назад до CraftID",
  },
} as const;

export default async function ContactPage({ params, searchParams }: Props) {
  const { craftId } = await params;
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const q = locale === "en" ? "" : `?lang=${locale}`;
  const parsedCraftId = parseCraftId(craftId);
  const displayCraftId = parsedCraftId
    ? formatCraftId(parsedCraftId.number, parsedCraftId.check)
    : craftId;

  return (
    <main className="workspacePage">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={`/${q}`}>← {t.home}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="workspaceIntro">{t.intro}</p>
        <div className="recordId">CraftID #{displayCraftId}</div>
        <p className="privacyNote">{t.privacy}</p>

        {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
        {sp.message ? <p className="formMessage">{t.sent}</p> : null}

        <form className="workspaceForm" action={submitPublicContactRequest}>
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="craftId" value={craftId} />
          <label>{t.name}<input name="name" minLength={2} maxLength={120} required /></label>
          <label>{t.email}<input name="email" type="email" required /></label>
          <div className="formGrid">
            <label>{t.organisation}<input name="organisation" maxLength={160} /></label>
            <label>{t.role}<input name="role" maxLength={160} /></label>
          </div>
          <label>{t.purpose}
            <select name="purpose" defaultValue="professional_enquiry">
              <option value="professional_enquiry">{t.professional}</option>
              <option value="institutional_partnership">{t.partnership}</option>
              <option value="project_invitation">{t.project}</option>
              <option value="training">{t.training}</option>
              <option value="commission">{t.commission}</option>
              <option value="other">{t.other}</option>
            </select>
          </label>
          <label>{t.messageLabel}<textarea name="message" minLength={20} maxLength={3000} rows={8} required /></label>
          <button className="button buttonPrimary" type="submit">{t.send}</button>
        </form>
      </div>
    </main>
  );
}
