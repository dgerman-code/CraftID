import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageMenu, localeFrom } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";
import { withLocale } from "@/lib/i18n";
import { partnerLogout, partnerRegister } from "../login/actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string; lang?: string }>;
};

const copy = {
  en: {
    eyebrow: "Partner access activation",
    title: "Activate your CraftID partner login",
    intro:
      "Create a password for the email address assigned to your organisation by the CraftID Platform Administrator.",
    email: "Assigned partner email",
    password: "Password",
    confirm: "Confirm password",
    submit: "Activate partner login",
    have: "Already activated?",
    signIn: "Sign in to Partner Workspace",
    back: "Back to CraftID",
    note:
      "This creates an authentication account only. It does not create a Professional or Workshop CraftID and does not change your organisation's role.",
    signedIn: "You are already signed in",
    noAccess:
      "This signed-in account is not assigned partner access. Sign out before activating the assigned partner email.",
    signOut: "Sign out",
  },
  fr: {
    eyebrow: "Activation de l’accès partenaire",
    title: "Activez votre connexion partenaire CraftID",
    intro:
      "Créez un mot de passe pour l’adresse e-mail attribuée à votre organisation par l’administrateur de la plateforme CraftID.",
    email: "E-mail partenaire attribué",
    password: "Mot de passe",
    confirm: "Confirmer le mot de passe",
    submit: "Activer la connexion partenaire",
    have: "Déjà activé ?",
    signIn: "Se connecter à l’espace partenaire",
    back: "Retour à CraftID",
    note:
      "Cela crée uniquement un compte d’authentification. Aucun CraftID Professional ou Workshop n’est créé et le rôle de votre organisation ne change pas.",
    signedIn: "Vous êtes déjà connecté",
    noAccess:
      "Ce compte connecté n’a pas d’accès partenaire. Déconnectez-vous avant d’activer l’e-mail partenaire attribué.",
    signOut: "Se déconnecter",
  },
  de: {
    eyebrow: "Partnerzugang aktivieren",
    title: "CraftID-Partnerzugang aktivieren",
    intro:
      "Erstellen Sie ein Passwort für die E-Mail-Adresse, die der CraftID-Plattformadministrator Ihrer Organisation zugewiesen hat.",
    email: "Zugewiesene Partner-E-Mail",
    password: "Passwort",
    confirm: "Passwort bestätigen",
    submit: "Partnerzugang aktivieren",
    have: "Bereits aktiviert?",
    signIn: "Im Partner Workspace anmelden",
    back: "Zurück zu CraftID",
    note:
      "Dies erstellt nur ein Authentifizierungskonto. Es wird keine Professional- oder Workshop-CraftID erstellt und die Rolle Ihrer Organisation bleibt unverändert.",
    signedIn: "Sie sind bereits angemeldet",
    noAccess:
      "Dieses angemeldete Konto hat keinen Partnerzugang. Melden Sie sich ab, bevor Sie die zugewiesene Partner-E-Mail aktivieren.",
    signOut: "Abmelden",
  },
  nl: {
    eyebrow: "Partnertoegang activeren",
    title: "Activeer uw CraftID-partnerlogin",
    intro:
      "Maak een wachtwoord aan voor het e-mailadres dat de CraftID-platformbeheerder aan uw organisatie heeft toegewezen.",
    email: "Toegewezen partner-e-mail",
    password: "Wachtwoord",
    confirm: "Bevestig wachtwoord",
    submit: "Partnertoegang activeren",
    have: "Al geactiveerd?",
    signIn: "Inloggen bij Partner Workspace",
    back: "Terug naar CraftID",
    note:
      "Dit maakt alleen een authenticatieaccount aan. Er wordt geen Professional- of Workshop-CraftID gemaakt en de rol van uw organisatie verandert niet.",
    signedIn: "U bent al ingelogd",
    noAccess:
      "Dit ingelogde account heeft geen partnertoegang. Log uit voordat u het toegewezen partner-e-mailadres activeert.",
    signOut: "Uitloggen",
  },
  pl: {
    eyebrow: "Aktywacja dostępu partnera",
    title: "Aktywuj logowanie partnera CraftID",
    intro:
      "Utwórz hasło dla adresu e-mail przypisanego Twojej organizacji przez administratora platformy CraftID.",
    email: "Przypisany e-mail partnera",
    password: "Hasło",
    confirm: "Potwierdź hasło",
    submit: "Aktywuj dostęp partnera",
    have: "Dostęp już aktywowany?",
    signIn: "Zaloguj się do panelu partnera",
    back: "Wróć do CraftID",
    note:
      "Tworzone jest wyłącznie konto uwierzytelniające. Nie powstaje CraftID Professional ani Workshop i rola organizacji nie ulega zmianie.",
    signedIn: "Jesteś już zalogowany",
    noAccess:
      "To zalogowane konto nie ma dostępu partnera. Wyloguj się przed aktywacją przypisanego e-maila partnera.",
    signOut: "Wyloguj się",
  },
  it: {
    eyebrow: "Attivazione accesso partner",
    title: "Attiva il tuo accesso partner CraftID",
    intro:
      "Crea una password per l’indirizzo e-mail assegnato alla tua organizzazione dall’amministratore della piattaforma CraftID.",
    email: "E-mail partner assegnata",
    password: "Password",
    confirm: "Conferma password",
    submit: "Attiva accesso partner",
    have: "Già attivato?",
    signIn: "Accedi al Partner Workspace",
    back: "Torna a CraftID",
    note:
      "Viene creato solo un account di autenticazione. Non viene creato alcun CraftID Professional o Workshop e il ruolo dell’organizzazione non cambia.",
    signedIn: "Hai già effettuato l’accesso",
    noAccess:
      "Questo account connesso non dispone di accesso partner. Esci prima di attivare l’e-mail partner assegnata.",
    signOut: "Esci",
  },
  es: {
    eyebrow: "Activación de acceso de socio",
    title: "Activa tu acceso de socio CraftID",
    intro:
      "Crea una contraseña para el correo asignado a tu organización por el administrador de la plataforma CraftID.",
    email: "Correo de socio asignado",
    password: "Contraseña",
    confirm: "Confirmar contraseña",
    submit: "Activar acceso de socio",
    have: "¿Ya está activado?",
    signIn: "Entrar al Partner Workspace",
    back: "Volver a CraftID",
    note:
      "Esto crea únicamente una cuenta de autenticación. No crea un CraftID Professional o Workshop ni modifica el rol de tu organización.",
    signedIn: "Ya has iniciado sesión",
    noAccess:
      "Esta cuenta iniciada no tiene acceso de socio. Cierra sesión antes de activar el correo de socio asignado.",
    signOut: "Cerrar sesión",
  },
  uk: {
    eyebrow: "Активація партнерського доступу",
    title: "Активуйте партнерський вхід CraftID",
    intro:
      "Створіть пароль для email, який адміністратор платформи CraftID призначив вашій організації.",
    email: "Призначений партнерський email",
    password: "Пароль",
    confirm: "Підтвердіть пароль",
    submit: "Активувати партнерський вхід",
    have: "Уже активували?",
    signIn: "Увійти до Partner Workspace",
    back: "Повернутися до CraftID",
    note:
      "Створюється лише обліковий запис для входу. CraftID Professional або Workshop не створюється, а роль вашої організації не змінюється.",
    signedIn: "Ви вже увійшли",
    noAccess:
      "Цей активний обліковий запис не має партнерського доступу. Вийдіть перед активацією призначеного партнерського email.",
    signOut: "Вийти",
  },
} as const;

export default async function PartnerRegisterPage({ searchParams }: Props) {
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
          <LanguageMenu locale={locale} pathname="/partner/register" />
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
          <form className="authForm" action={partnerRegister}>
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
                autoComplete="new-password"
                required
                minLength={8}
              />
            </label>
            <label>
              {t.confirm}
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </label>
            <button className="button buttonPrimary" type="submit">
              {t.submit}
            </button>
          </form>
        )}

        <p className="authFoot">
          {t.have}{" "}
          <Link href={withLocale("/partner/login", locale)}>{t.signIn}</Link>
        </p>
        <p className="authBack">
          <Link href={withLocale("/", locale)}>← {t.back}</Link>
        </p>
      </section>
    </main>
  );
}
