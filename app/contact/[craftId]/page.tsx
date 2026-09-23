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
  const q = locale === "uk" ? "?lang=uk" : "";
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
