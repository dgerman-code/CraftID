import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageMenu, localeFrom } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";
import { withLocale } from "@/lib/i18n";
import {
  partnerLogin,
  partnerLogout,
  partnerResendConfirmation,
} from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string; message?: string; lang?: string }>;
};

const copy = {
  en: {
    eyebrow: "Partner access",
    title: "Sign in to CraftID Partner Workspace",
    intro:
      "For National Operators and Country Partners assigned by the CraftID Platform Administrator.",
    email: "Partner login email",
    password: "Password",
    submit: "Sign in to Partner Workspace",
    first: "First time using partner access?",
    activate: "Activate partner login",
    holder: "CraftID holder sign in",
    back: "Back to CraftID",
    note:
      "Use the email address that the CraftID administrator assigned to your organisation. Partner access does not create a Professional or Workshop CraftID.",
    resendTitle: "Confirmation email did not work?",
    resendText:
      "Enter the assigned partner email and we will request a new confirmation link.",
    resend: "Resend confirmation",
    signedIn: "You are already signed in",
    noAccess:
      "This account is not assigned to a CraftID partner organisation. Sign out and use the partner email assigned by the CraftID administrator.",
    signOut: "Sign out",
  },
  fr: {
    eyebrow: "Accès partenaire",
    title: "Se connecter à l’espace partenaire CraftID",
    intro:
      "Pour les opérateurs nationaux et partenaires nationaux désignés par l’administrateur de la plateforme CraftID.",
    email: "E-mail d’accès partenaire",
    password: "Mot de passe",
    submit: "Accéder à l’espace partenaire",
    first: "Première utilisation de l’accès partenaire ?",
    activate: "Activer l’accès partenaire",
    holder: "Connexion titulaire CraftID",
    back: "Retour à CraftID",
    note:
      "Utilisez l’adresse e-mail attribuée à votre organisation par l’administrateur CraftID. L’accès partenaire ne crée pas de CraftID Professional ou Workshop.",
    resendTitle: "L’e-mail de confirmation n’a pas fonctionné ?",
    resendText:
      "Saisissez l’e-mail partenaire attribué et nous demanderons un nouveau lien de confirmation.",
    resend: "Renvoyer la confirmation",
    signedIn: "Vous êtes déjà connecté",
    noAccess:
      "Ce compte n’est pas attribué à une organisation partenaire CraftID. Déconnectez-vous et utilisez l’e-mail partenaire attribué par l’administrateur CraftID.",
    signOut: "Se déconnecter",
  },
  de: {
    eyebrow: "Partnerzugang",
    title: "Beim CraftID Partner Workspace anmelden",
    intro:
      "Für nationale Betreiber und Länderpartner, die vom CraftID-Plattformadministrator zugewiesen wurden.",
    email: "Partner-Login-E-Mail",
    password: "Passwort",
    submit: "Im Partner Workspace anmelden",
    first: "Partnerzugang zum ersten Mal?",
    activate: "Partnerzugang aktivieren",
    holder: "CraftID-Inhaber anmelden",
    back: "Zurück zu CraftID",
    note:
      "Verwenden Sie die E-Mail-Adresse, die der CraftID-Administrator Ihrer Organisation zugewiesen hat. Partnerzugang erstellt keine Professional- oder Workshop-CraftID.",
    resendTitle: "Bestätigungs-E-Mail hat nicht funktioniert?",
    resendText:
      "Geben Sie die zugewiesene Partner-E-Mail ein; wir fordern einen neuen Bestätigungslink an.",
    resend: "Bestätigung erneut senden",
    signedIn: "Sie sind bereits angemeldet",
    noAccess:
      "Dieses Konto ist keiner CraftID-Partnerorganisation zugewiesen. Melden Sie sich ab und verwenden Sie die vom CraftID-Administrator zugewiesene Partner-E-Mail.",
    signOut: "Abmelden",
  },
  nl: {
    eyebrow: "Partnertoegang",
    title: "Inloggen bij CraftID Partner Workspace",
    intro:
      "Voor nationale operators en landenpartners die door de CraftID-platformbeheerder zijn toegewezen.",
    email: "E-mail voor partnertoegang",
    password: "Wachtwoord",
    submit: "Inloggen bij Partner Workspace",
    first: "Eerste keer met partnertoegang?",
    activate: "Partnertoegang activeren",
    holder: "Inloggen als CraftID-houder",
    back: "Terug naar CraftID",
    note:
      "Gebruik het e-mailadres dat de CraftID-beheerder aan uw organisatie heeft toegewezen. Partnertoegang maakt geen Professional- of Workshop-CraftID aan.",
    resendTitle: "Werkte de bevestigingsmail niet?",
    resendText:
      "Voer het toegewezen partner-e-mailadres in; we vragen een nieuwe bevestigingslink aan.",
    resend: "Bevestiging opnieuw verzenden",
    signedIn: "U bent al ingelogd",
    noAccess:
      "Dit account is niet toegewezen aan een CraftID-partnerorganisatie. Log uit en gebruik het partner-e-mailadres dat door de CraftID-beheerder is toegewezen.",
    signOut: "Uitloggen",
  },
  pl: {
    eyebrow: "Dostęp partnera",
    title: "Zaloguj się do panelu partnera CraftID",
    intro:
      "Dla operatorów krajowych i partnerów krajowych wyznaczonych przez administratora platformy CraftID.",
    email: "E-mail logowania partnera",
    password: "Hasło",
    submit: "Zaloguj się do panelu partnera",
    first: "Pierwsze użycie dostępu partnera?",
    activate: "Aktywuj dostęp partnera",
    holder: "Logowanie posiadacza CraftID",
    back: "Wróć do CraftID",
    note:
      "Użyj adresu e-mail przypisanego organizacji przez administratora CraftID. Dostęp partnera nie tworzy CraftID Professional ani Workshop.",
    resendTitle: "E-mail potwierdzający nie zadziałał?",
    resendText:
      "Wpisz przypisany e-mail partnera, a poprosimy o nowy link potwierdzający.",
    resend: "Wyślij potwierdzenie ponownie",
    signedIn: "Jesteś już zalogowany",
    noAccess:
      "To konto nie jest przypisane do organizacji partnerskiej CraftID. Wyloguj się i użyj e-maila partnera przypisanego przez administratora CraftID.",
    signOut: "Wyloguj się",
  },
  it: {
    eyebrow: "Accesso partner",
    title: "Accedi al CraftID Partner Workspace",
    intro:
      "Per operatori nazionali e partner nazionali assegnati dall’amministratore della piattaforma CraftID.",
    email: "E-mail di accesso partner",
    password: "Password",
    submit: "Accedi al Partner Workspace",
    first: "Primo accesso come partner?",
    activate: "Attiva accesso partner",
    holder: "Accesso titolare CraftID",
    back: "Torna a CraftID",
    note:
      "Usa l’indirizzo e-mail assegnato alla tua organizzazione dall’amministratore CraftID. L’accesso partner non crea un CraftID Professional o Workshop.",
    resendTitle: "L’e-mail di conferma non ha funzionato?",
    resendText:
      "Inserisci l’e-mail partner assegnata e richiederemo un nuovo link di conferma.",
    resend: "Invia di nuovo la conferma",
    signedIn: "Hai già effettuato l’accesso",
    noAccess:
      "Questo account non è assegnato a un’organizzazione partner CraftID. Esci e usa l’e-mail partner assegnata dall’amministratore CraftID.",
    signOut: "Esci",
  },
  es: {
    eyebrow: "Acceso de socio",
    title: "Iniciar sesión en CraftID Partner Workspace",
    intro:
      "Para operadores nacionales y socios nacionales asignados por el administrador de la plataforma CraftID.",
    email: "Correo de acceso de socio",
    password: "Contraseña",
    submit: "Entrar al Partner Workspace",
    first: "¿Primera vez con acceso de socio?",
    activate: "Activar acceso de socio",
    holder: "Inicio de sesión de titular CraftID",
    back: "Volver a CraftID",
    note:
      "Usa el correo asignado a tu organización por el administrador de CraftID. El acceso de socio no crea un CraftID Professional o Workshop.",
    resendTitle: "¿No funcionó el correo de confirmación?",
    resendText:
      "Introduce el correo de socio asignado y solicitaremos un nuevo enlace de confirmación.",
    resend: "Reenviar confirmación",
    signedIn: "Ya has iniciado sesión",
    noAccess:
      "Esta cuenta no está asignada a una organización asociada CraftID. Cierra sesión y usa el correo de socio asignado por el administrador de CraftID.",
    signOut: "Cerrar sesión",
  },
  uk: {
    eyebrow: "Партнерський доступ",
    title: "Вхід до CraftID Partner Workspace",
    intro:
      "Для Національних операторів і партнерів країн, призначених адміністратором платформи CraftID.",
    email: "Email для партнерського входу",
    password: "Пароль",
    submit: "Увійти до Partner Workspace",
    first: "Вперше користуєтесь партнерським доступом?",
    activate: "Активувати партнерський вхід",
    holder: "Вхід для власника CraftID",
    back: "Повернутися до CraftID",
    note:
      "Використовуйте email, який адміністратор CraftID призначив вашій організації. Партнерський доступ не створює CraftID Professional або Workshop.",
    resendTitle: "Лист підтвердження не спрацював?",
    resendText:
      "Вкажіть призначений партнерський email, і ми запросимо нове посилання підтвердження.",
    resend: "Надіслати підтвердження повторно",
    signedIn: "Ви вже увійшли",
    noAccess:
      "Цей обліковий запис не призначений партнерській організації CraftID. Вийдіть і використайте партнерський email, призначений адміністратором CraftID.",
    signOut: "Вийти",
  },
} as const;

export default async function PartnerLoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale];
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();

  if (userResult.user) {
    const { data: organisations } = await supabase.rpc(
      "current_partner_organisations",
    );

    if (Array.isArray(organisations) && organisations.length) {
      redirect(withLocale("/partner", locale));
    }
  }

  return (
    <main className="authPage partnerAuthPage">
      <section className="authPanel partnerAuthPanel">
        <div className="authTopline">
          <Link href={withLocale("/", locale)} className="brand authBrand">
            CraftID
          </Link>
          <LanguageMenu locale={locale} pathname="/partner/login" />
        </div>

        <div className="partnerAuthMark">
          <span>CraftID</span>
          <strong>PARTNER</strong>
        </div>

        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="authIntro">{t.intro}</p>
        <p className="privacyNote partnerAuthNote">{t.note}</p>

        {params.error ? (
          <p className="formMessage error">{params.error}</p>
        ) : null}
        {params.message ? (
          <p className="formMessage">{params.message}</p>
        ) : null}

        {userResult.user ? (
          <div className="partnerSignedInMismatch">
            <strong>{t.signedIn}</strong>
            <span>{userResult.user.email}</span>
            <p>{t.noAccess}</p>
            <form action={partnerLogout}>
              <input type="hidden" name="lang" value={locale} />
              <button className="button" type="submit">
                {t.signOut}
              </button>
            </form>
          </div>
        ) : (
          <>
            <form className="authForm" action={partnerLogin}>
              <input type="hidden" name="lang" value={locale} />
              <label>
                {t.email}
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                {t.password}
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                />
              </label>
              <button className="button buttonPrimary" type="submit">
                {t.submit}
              </button>
            </form>

            <p className="authFoot">
              {t.first}{" "}
              <Link href={withLocale("/partner/register", locale)}>
                {t.activate}
              </Link>
            </p>

            <div className="resendPanel">
              <strong>{t.resendTitle}</strong>
              <p>{t.resendText}</p>
              <form className="resendForm" action={partnerResendConfirmation}>
                <input type="hidden" name="lang" value={locale} />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t.email}
                  required
                />
                <button className="button" type="submit">
                  {t.resend}
                </button>
              </form>
            </div>
          </>
        )}

        <div className="partnerAuthLinks">
          <Link href={withLocale("/login", locale)}>{t.holder}</Link>
          <Link href={withLocale("/", locale)}>← {t.back}</Link>
        </div>
      </section>
    </main>
  );
}
