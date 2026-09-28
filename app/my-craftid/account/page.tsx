import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom } from "@/components/site-shell";
import { localeQuery } from "@/lib/i18n";
import { requestAccountEmailChange } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ lang?: string; error?: string; message?: string }>;
};

const copy = {
  en: {
    eyebrow: "Account & login",
    title: "Keep account access separate from your CraftID identity.",
    intro: "Your login email can change without creating a new CraftID. Existing Professional and Workshop records keep the same permanent CraftID numbers.",
    back: "Back to My CraftID",
    current: "Current login email",
    change: "Change login email",
    newEmail: "New email",
    submit: "Request email change",
    requested: "Email change requested. Complete the confirmation steps sent by Supabase Auth. Your CraftID numbers do not change.",
    ruleTitle: "Important account rule",
    rule: "Do not create a second CraftID account only because your email address changed. Use this email-change flow. If you already created another account under another email, stop before creating more records and ask a CraftID administrator to review the accounts.",
    recordsTitle: "Identity continuity",
    records: "Changing login credentials changes access only. It does not merge a Professional with a Workshop, issue a replacement CraftID, or transfer a CraftID to another person or organisation.",
  },
  fr: {
    eyebrow: "Compte et connexion", title: "Séparez l’accès au compte de votre identité CraftID.",
    intro: "Votre e-mail de connexion peut changer sans créer un nouveau CraftID. Les dossiers Professional et Workshop conservent leurs numéros CraftID permanents.",
    back: "Retour à Mon CraftID", current: "E-mail de connexion actuel", change: "Modifier l’e-mail de connexion", newEmail: "Nouvel e-mail", submit: "Demander le changement d’e-mail",
    requested: "Changement d’e-mail demandé. Terminez les étapes de confirmation envoyées par Supabase Auth. Vos numéros CraftID ne changent pas.",
    ruleTitle: "Règle importante", rule: "Ne créez pas un deuxième compte CraftID uniquement parce que votre adresse e-mail a changé. Utilisez ce flux de modification. Si vous avez déjà créé un autre compte avec un autre e-mail, n’ajoutez plus de dossiers et demandez à un administrateur CraftID de vérifier les comptes.",
    recordsTitle: "Continuité de l’identité", records: "Modifier les identifiants de connexion ne change que l’accès. Cela ne fusionne pas Professional et Workshop, ne crée pas un nouveau CraftID et ne transfère pas un CraftID à une autre personne ou organisation.",
  },
  de: {
    eyebrow: "Konto & Anmeldung", title: "Trennen Sie Kontozugang und CraftID-Identität.",
    intro: "Ihre Login-E-Mail kann geändert werden, ohne eine neue CraftID anzulegen. Bestehende Professional- und Workshop-Datensätze behalten ihre permanenten CraftID-Nummern.",
    back: "Zurück zu Meine CraftID", current: "Aktuelle Login-E-Mail", change: "Login-E-Mail ändern", newEmail: "Neue E-Mail", submit: "E-Mail-Änderung anfordern",
    requested: "E-Mail-Änderung angefordert. Schließen Sie die Bestätigungsschritte von Supabase Auth ab. Ihre CraftID-Nummern ändern sich nicht.",
    ruleTitle: "Wichtige Kontoregel", rule: "Erstellen Sie kein zweites CraftID-Konto nur wegen einer neuen E-Mail-Adresse. Nutzen Sie diese E-Mail-Änderung. Wenn bereits ein weiteres Konto mit einer anderen E-Mail erstellt wurde, legen Sie keine weiteren Datensätze an und lassen Sie die Konten durch einen CraftID-Administrator prüfen.",
    recordsTitle: "Identitätskontinuität", records: "Eine Änderung der Login-Daten ändert nur den Zugang. Sie führt Professional und Workshop nicht zusammen, erzeugt keine Ersatz-CraftID und überträgt keine CraftID auf eine andere Person oder Organisation.",
  },
  nl: {
    eyebrow: "Account & login", title: "Houd accounttoegang en CraftID-identiteit gescheiden.",
    intro: "Uw login-e-mail kan wijzigen zonder een nieuwe CraftID aan te maken. Bestaande Professional- en Workshop-dossiers behouden dezelfde permanente CraftID-nummers.",
    back: "Terug naar Mijn CraftID", current: "Huidige login-e-mail", change: "Login-e-mail wijzigen", newEmail: "Nieuwe e-mail", submit: "E-mailwijziging aanvragen",
    requested: "E-mailwijziging aangevraagd. Rond de bevestigingsstappen van Supabase Auth af. Uw CraftID-nummers veranderen niet.",
    ruleTitle: "Belangrijke accountregel", rule: "Maak geen tweede CraftID-account aan alleen omdat uw e-mailadres is gewijzigd. Gebruik deze e-mailwijziging. Als u al een ander account met een ander e-mailadres hebt gemaakt, maak dan geen extra dossiers aan en vraag een CraftID-beheerder de accounts te controleren.",
    recordsTitle: "Identiteitscontinuïteit", records: "Het wijzigen van login-gegevens verandert alleen de toegang. Het voegt Professional en Workshop niet samen, geeft geen vervangende CraftID uit en draagt geen CraftID over aan een andere persoon of organisatie.",
  },
  pl: {
    eyebrow: "Konto i logowanie", title: "Oddziel dostęp do konta od tożsamości CraftID.",
    intro: "Adres e-mail do logowania może się zmienić bez tworzenia nowego CraftID. Istniejące wpisy Professional i Workshop zachowują te same stałe numery CraftID.",
    back: "Wróć do Mój CraftID", current: "Obecny e-mail logowania", change: "Zmień e-mail logowania", newEmail: "Nowy e-mail", submit: "Poproś o zmianę e-maila",
    requested: "Poproszono o zmianę e-maila. Dokończ kroki potwierdzenia wysłane przez Supabase Auth. Numery CraftID nie zmienią się.",
    ruleTitle: "Ważna zasada konta", rule: "Nie twórz drugiego konta CraftID tylko dlatego, że zmienił się Twój e-mail. Użyj tej procedury zmiany adresu. Jeśli utworzyłeś już inne konto z innym e-mailem, nie twórz kolejnych wpisów i poproś administratora CraftID o sprawdzenie kont.",
    recordsTitle: "Ciągłość tożsamości", records: "Zmiana danych logowania zmienia tylko dostęp. Nie łączy Professional z Workshop, nie wydaje zastępczego CraftID i nie przenosi CraftID na inną osobę lub organizację.",
  },
  it: {
    eyebrow: "Account e accesso", title: "Mantieni separati accesso all’account e identità CraftID.",
    intro: "L’e-mail di accesso può cambiare senza creare un nuovo CraftID. I record Professional e Workshop esistenti mantengono gli stessi numeri CraftID permanenti.",
    back: "Torna a Il mio CraftID", current: "E-mail di accesso attuale", change: "Cambia e-mail di accesso", newEmail: "Nuova e-mail", submit: "Richiedi cambio e-mail",
    requested: "Cambio e-mail richiesto. Completa i passaggi di conferma inviati da Supabase Auth. I numeri CraftID non cambiano.",
    ruleTitle: "Regola importante", rule: "Non creare un secondo account CraftID solo perché è cambiato il tuo indirizzo e-mail. Usa questa procedura. Se hai già creato un altro account con un’altra e-mail, non creare altri record e chiedi a un amministratore CraftID di verificare gli account.",
    recordsTitle: "Continuità dell’identità", records: "Cambiare le credenziali modifica solo l’accesso. Non unisce Professional e Workshop, non emette un CraftID sostitutivo e non trasferisce un CraftID a un’altra persona o organizzazione.",
  },
  es: {
    eyebrow: "Cuenta e inicio de sesión", title: "Mantén separado el acceso a la cuenta de la identidad CraftID.",
    intro: "Tu correo de acceso puede cambiar sin crear un nuevo CraftID. Los registros Professional y Workshop existentes conservan los mismos números CraftID permanentes.",
    back: "Volver a Mi CraftID", current: "Correo de acceso actual", change: "Cambiar correo de acceso", newEmail: "Nuevo correo", submit: "Solicitar cambio de correo",
    requested: "Cambio de correo solicitado. Completa los pasos de confirmación enviados por Supabase Auth. Tus números CraftID no cambian.",
    ruleTitle: "Regla importante de cuenta", rule: "No crees una segunda cuenta CraftID solo porque cambió tu correo. Usa este flujo de cambio. Si ya creaste otra cuenta con otro correo, no generes más registros y pide a un administrador de CraftID que revise las cuentas.",
    recordsTitle: "Continuidad de identidad", records: "Cambiar las credenciales solo cambia el acceso. No fusiona Professional y Workshop, no emite un CraftID de sustitución ni transfiere un CraftID a otra persona u organización.",
  },
  uk: {
    eyebrow: "Обліковий запис і вхід",
    title: "Відокремлюйте доступ до акаунта від ідентичності CraftID.",
    intro: "Email для входу можна змінити без створення нового CraftID. Існуючі записи Professional і Workshop зберігають ті самі постійні номери CraftID.",
    back: "Назад до Мій CraftID",
    current: "Поточний email для входу",
    change: "Змінити email для входу",
    newEmail: "Новий email",
    submit: "Запросити зміну email",
    requested: "Зміну email запитано. Завершіть кроки підтвердження, надіслані Supabase Auth. Номери CraftID не змінюються.",
    ruleTitle: "Важливе правило акаунта",
    rule: "Не створюйте другий акаунт CraftID лише через зміну email. Використовуйте цю процедуру. Якщо ви вже створили інший акаунт з іншим email, не створюйте нових записів і зверніться до адміністратора CraftID для перевірки акаунтів.",
    recordsTitle: "Безперервність ідентичності",
    records: "Зміна даних входу змінює лише доступ. Вона не об’єднує Professional і Workshop, не видає новий CraftID замість існуючого та не передає CraftID іншій особі чи організації.",
  },
} as const;

export default async function AccountPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const q = localeQuery(locale);

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult.user;

  if (!user) redirect(`/login${q}`);

  return (
    <main className="workspacePage">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={`/my-craftid${q}`}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="workspaceIntro">{t.intro}</p>

        {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
        {sp.message === "email-change-requested" ? <p className="formMessage">{t.requested}</p> : null}

        <section className="accountSecurityPanel">
          <div className="eyebrow">{t.current}</div>
          <strong className="accountEmailValue">{user.email ?? "—"}</strong>
        </section>

        <section className="accountSecurityPanel">
          <div className="eyebrow">{t.change}</div>
          <form className="workspaceForm" action={requestAccountEmailChange}>
            <input type="hidden" name="lang" value={locale} />
            <label>
              {t.newEmail}
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <button className="button buttonPrimary" type="submit">{t.submit}</button>
          </form>
        </section>

        <section className="accountSecurityNotice">
          <div>
            <div className="eyebrow">{t.ruleTitle}</div>
            <p>{t.rule}</p>
          </div>
          <div>
            <div className="eyebrow">{t.recordsTitle}</div>
            <p>{t.records}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
