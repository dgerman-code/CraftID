import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom, localeQuery, withLocale } from "@/lib/i18n";
import { formatCraftId } from "@/lib/craftid-format";
import { getOwnedCraftId } from "@/lib/owned-craftid";
import { submitInterest } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string; error?: string }>;
};

type Opportunity = {
  id: string;
  title: string;
  partner_name: string;
  allow_interest: boolean;
  deadline_date: string | null;
};

const copy = {
  en:{back:"Back to opportunity",eyebrow:"Controlled introduction",title:"Tell the organisation you’re interested.",intro:"CraftID sends your interest to the publishing partner. The organisation receives your CraftID identity and only the contact details you explicitly choose to share.",record:"Send as",message:"Short message (optional)",shareProfile:"Share my CraftID identity with the organisation",shareEmail:"Share my confirmed account email",sharePhone:"Share a phone number",phone:"Phone number",send:"Send interest",privacy:"This does not submit an application unless the opportunity explicitly says so. The partner decides what happens next.",noRecord:"A Professional or Workshop CraftID is required to send an interest request."},
  fr:{back:"Retour à l’opportunité",eyebrow:"Mise en relation contrôlée",title:"Indiquez à l’organisation que vous êtes intéressé.",intro:"CraftID transmet votre intérêt au partenaire qui publie l’opportunité. L’organisation reçoit votre identité CraftID et uniquement les coordonnées que vous choisissez explicitement de partager.",record:"Envoyer en tant que",message:"Court message (facultatif)",shareProfile:"Partager mon identité CraftID avec l’organisation",shareEmail:"Partager l’e-mail confirmé de mon compte",sharePhone:"Partager un numéro de téléphone",phone:"Numéro de téléphone",send:"Envoyer mon intérêt",privacy:"Cela ne constitue pas une candidature sauf indication contraire dans l’opportunité. Le partenaire décide de la suite.",noRecord:"Un CraftID Professional ou Workshop est requis pour envoyer une manifestation d’intérêt."},
  de:{back:"Zurück zum Angebot",eyebrow:"Kontrollierte Kontaktaufnahme",title:"Teilen Sie der Organisation Ihr Interesse mit.",intro:"CraftID übermittelt Ihr Interesse an die veröffentlichende Partnerorganisation. Sie erhält Ihre CraftID-Identität und nur die Kontaktdaten, die Sie ausdrücklich freigeben.",record:"Senden als",message:"Kurze Nachricht (optional)",shareProfile:"Meine CraftID-Identität mit der Organisation teilen",shareEmail:"Bestätigte Konto-E-Mail teilen",sharePhone:"Telefonnummer teilen",phone:"Telefonnummer",send:"Interesse senden",privacy:"Dies ist keine Bewerbung, sofern das Angebot dies nicht ausdrücklich vorsieht. Der Partner entscheidet über die nächsten Schritte.",noRecord:"Für eine Interessenanfrage ist eine Professional- oder Workshop-CraftID erforderlich."},
  nl:{back:"Terug naar mogelijkheid",eyebrow:"Gecontroleerde introductie",title:"Laat de organisatie weten dat u geïnteresseerd bent.",intro:"CraftID stuurt uw interesse naar de publicerende partner. De organisatie ontvangt uw CraftID-identiteit en alleen de contactgegevens die u bewust deelt.",record:"Versturen als",message:"Kort bericht (optioneel)",shareProfile:"Deel mijn CraftID-identiteit met de organisatie",shareEmail:"Deel mijn bevestigde account-e-mail",sharePhone:"Deel een telefoonnummer",phone:"Telefoonnummer",send:"Interesse versturen",privacy:"Dit is geen aanvraag tenzij de mogelijkheid dat uitdrukkelijk aangeeft. De partner bepaalt de volgende stap.",noRecord:"Een Professional- of Workshop-CraftID is vereist om interesse te sturen."},
  pl:{back:"Wróć do możliwości",eyebrow:"Kontrolowane połączenie",title:"Poinformuj organizację, że jesteś zainteresowany.",intro:"CraftID przekazuje Twoje zainteresowanie partnerowi publikującemu. Organizacja otrzymuje Twoją tożsamość CraftID i tylko dane kontaktowe, które świadomie udostępnisz.",record:"Wyślij jako",message:"Krótka wiadomość (opcjonalnie)",shareProfile:"Udostępnij organizacji moją tożsamość CraftID",shareEmail:"Udostępnij potwierdzony e-mail konta",sharePhone:"Udostępnij numer telefonu",phone:"Numer telefonu",send:"Wyślij zainteresowanie",privacy:"To nie jest formalna aplikacja, chyba że opis możliwości mówi inaczej. Partner decyduje o dalszych krokach.",noRecord:"Do wysłania zainteresowania wymagany jest CraftID Professional lub Workshop."},
  it:{back:"Torna all’opportunità",eyebrow:"Introduzione controllata",title:"Comunica all’organizzazione il tuo interesse.",intro:"CraftID invia il tuo interesse al partner che ha pubblicato l’opportunità. L’organizzazione riceve la tua identità CraftID e solo i contatti che scegli esplicitamente di condividere.",record:"Invia come",message:"Messaggio breve (facoltativo)",shareProfile:"Condividi la mia identità CraftID con l’organizzazione",shareEmail:"Condividi l’e-mail confermata dell’account",sharePhone:"Condividi un numero di telefono",phone:"Numero di telefono",send:"Invia interesse",privacy:"Questo non costituisce una candidatura, salvo diversa indicazione dell’opportunità. Il partner decide i passaggi successivi.",noRecord:"È necessario un CraftID Professional o Workshop per inviare interesse."},
  es:{back:"Volver a la oportunidad",eyebrow:"Presentación controlada",title:"Indica a la organización que estás interesado.",intro:"CraftID envía tu interés al socio que publicó la oportunidad. La organización recibe tu identidad CraftID y solo los datos de contacto que decidas compartir.",record:"Enviar como",message:"Mensaje breve (opcional)",shareProfile:"Compartir mi identidad CraftID con la organización",shareEmail:"Compartir el correo confirmado de mi cuenta",sharePhone:"Compartir un número de teléfono",phone:"Número de teléfono",send:"Enviar interés",privacy:"Esto no constituye una solicitud salvo que la oportunidad lo indique expresamente. El socio decide los siguientes pasos.",noRecord:"Se necesita un CraftID Professional o Workshop para enviar interés."},
  uk:{back:"Назад до можливості",eyebrow:"Контрольоване знайомство",title:"Повідомте організації, що ви зацікавлені.",intro:"CraftID передає ваш інтерес партнеру, який опублікував можливість. Організація отримує вашу CraftID-ідентичність і лише ті контакти, якими ви самі вирішили поділитися.",record:"Надіслати від",message:"Коротке повідомлення (за бажанням)",shareProfile:"Поділитися моєю CraftID-ідентичністю з організацією",shareEmail:"Поділитися підтвердженим email акаунта",sharePhone:"Поділитися номером телефону",phone:"Номер телефону",send:"Надіслати інтерес",privacy:"Це не є формальною заявкою, якщо в описі можливості прямо не зазначено інше. Подальші кроки визначає партнер.",noRecord:"Для надсилання інтересу потрібен CraftID Professional або Workshop."},
} as const;

export default async function OpportunityInterestPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const locale = localeFrom(sp.lang);
  const q = localeQuery(locale);
  const t = copy[locale];

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    redirect(
      `/login${q ? `${q}&` : "?"}next=${encodeURIComponent(
        `/opportunities/${id}/interest${q}`,
      )}`,
    );
  }

  const [{ data: opportunityData, error }, owned] = await Promise.all([
    supabase.rpc("public_opportunity", { p_opportunity_id: id }),
    getOwnedCraftId(),
  ]);
  if (error) throw new Error(error.message);
  if (!opportunityData) notFound();
  const opportunity = opportunityData as Opportunity;
  if (!opportunity.allow_interest) notFound();

  if (!owned.entities.length) {
    return (
      <main className="workspacePage">
        <div className="container workspaceNarrow">
          <Link className="backLink" href={withLocale(`/opportunities/${id}`, locale)}>← {t.back}</Link>
          <h1>{t.noRecord}</h1>
          <Link className="button buttonPrimary" href={`/onboarding${q}`}>Create CraftID</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="workspacePage">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={withLocale(`/opportunities/${id}`, locale)}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="workspaceIntro">{t.intro}</p>

        <div className="opportunityInterestContext">
          <strong>{opportunity.title}</strong>
          <span>{opportunity.partner_name}</span>
        </div>

        {sp.error ? <p className="formMessage error">{sp.error}</p> : null}

        <form className="workspaceForm" action={submitInterest}>
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="opportunityId" value={id} />

          <label>
            {t.record}
            <select name="entityId" required defaultValue={owned.entity?.id ?? owned.entities[0]?.id}>
              {owned.entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.entity_type === "professional" ? "Professional" : "Workshop"} · CraftID #{formatCraftId(entity.craftid_number, entity.craftid_check_digits)}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t.message}
            <textarea name="message" rows={5} maxLength={2000} />
          </label>

          <label className="adminCheckbox">
            <input name="shareProfile" type="checkbox" required defaultChecked />
            {t.shareProfile}
          </label>

          <label className="adminCheckbox">
            <input name="shareEmail" type="checkbox" defaultChecked />
            {t.shareEmail}
          </label>

          <label className="adminCheckbox">
            <input name="sharePhone" type="checkbox" />
            {t.sharePhone}
          </label>

          <label>
            {t.phone}
            <input name="phone" type="tel" />
          </label>

          <p className="privacyNote">{t.privacy}</p>
          <button className="button buttonPrimary" type="submit">{t.send}</button>
        </form>
      </div>
    </main>
  );
}
