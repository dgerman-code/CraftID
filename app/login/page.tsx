import Link from "next/link";
import { login, resendConfirmation } from "./actions";
import { LanguageMenu, localeFrom } from "@/components/site-shell";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string; lang?: string }>;
};

const copy = {
  en: {
    eyebrow: "Secure access",
    title: "Sign in to CraftID",
    intro: "Access your professional record, supporting evidence, privacy settings and profile management.",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    new: "New to CraftID?",
    create: "Create an account",
    back: "Back to CraftID",
    resendTitle: "Confirmation email did not work?",
    resendText: "Enter the same email address and we will send a new confirmation link.",
    resend: "Resend confirmation",
  },
  fr: {
    eyebrow: "Accès sécurisé",
    title: "Se connecter à CraftID",
    intro: "Accédez à votre dossier professionnel, vos preuves, vos paramètres de confidentialité et la gestion de votre profil.",
    email: "E-mail", password: "Mot de passe", submit: "Se connecter",
    new: "Nouveau sur CraftID ?", create: "Créer un compte", back: "Retour à CraftID",
    resendTitle: "L’e-mail de confirmation n’a pas fonctionné ?",
    resendText: "Saisissez la même adresse e-mail et nous enverrons un nouveau lien de confirmation.",
    resend: "Renvoyer la confirmation",
  },
  de: {
    eyebrow: "Sicherer Zugang", title: "Bei CraftID anmelden",
    intro: "Greifen Sie auf Ihren beruflichen Datensatz, Nachweise, Datenschutzeinstellungen und die Profilverwaltung zu.",
    email: "E-Mail", password: "Passwort", submit: "Anmelden",
    new: "Neu bei CraftID?", create: "Konto erstellen", back: "Zurück zu CraftID",
    resendTitle: "Bestätigungs-E-Mail hat nicht funktioniert?",
    resendText: "Geben Sie dieselbe E-Mail-Adresse ein; wir senden einen neuen Bestätigungslink.",
    resend: "Bestätigung erneut senden",
  },
  nl: {
    eyebrow: "Veilige toegang", title: "Inloggen bij CraftID",
    intro: "Krijg toegang tot uw professionele dossier, bewijs, privacy-instellingen en profielbeheer.",
    email: "E-mail", password: "Wachtwoord", submit: "Inloggen",
    new: "Nieuw bij CraftID?", create: "Account aanmaken", back: "Terug naar CraftID",
    resendTitle: "Werkte de bevestigingsmail niet?",
    resendText: "Voer hetzelfde e-mailadres in en we sturen een nieuwe bevestigingslink.",
    resend: "Bevestiging opnieuw verzenden",
  },
  pl: {
    eyebrow: "Bezpieczny dostęp", title: "Zaloguj się do CraftID",
    intro: "Uzyskaj dostęp do swojego zapisu zawodowego, dowodów, ustawień prywatności i zarządzania profilem.",
    email: "E-mail", password: "Hasło", submit: "Zaloguj się",
    new: "Pierwszy raz w CraftID?", create: "Utwórz konto", back: "Wróć do CraftID",
    resendTitle: "E-mail potwierdzający nie zadziałał?",
    resendText: "Wpisz ten sam adres e-mail, a wyślemy nowy link potwierdzający.",
    resend: "Wyślij potwierdzenie ponownie",
  },
  it: {
    eyebrow: "Accesso sicuro", title: "Accedi a CraftID",
    intro: "Accedi al tuo record professionale, alle evidenze, alle impostazioni sulla privacy e alla gestione del profilo.",
    email: "E-mail", password: "Password", submit: "Accedi",
    new: "Nuovo su CraftID?", create: "Crea un account", back: "Torna a CraftID",
    resendTitle: "L’e-mail di conferma non ha funzionato?",
    resendText: "Inserisci lo stesso indirizzo e-mail e invieremo un nuovo link di conferma.",
    resend: "Invia di nuovo la conferma",
  },
  es: {
    eyebrow: "Acceso seguro", title: "Iniciar sesión en CraftID",
    intro: "Accede a tu registro profesional, evidencias, ajustes de privacidad y gestión del perfil.",
    email: "Correo electrónico", password: "Contraseña", submit: "Iniciar sesión",
    new: "¿Nuevo en CraftID?", create: "Crear una cuenta", back: "Volver a CraftID",
    resendTitle: "¿No funcionó el correo de confirmación?",
    resendText: "Introduce la misma dirección de correo y enviaremos un nuevo enlace de confirmación.",
    resend: "Reenviar confirmación",
  },
  uk: {
    eyebrow: "Безпечний доступ",
    title: "Увійти до CraftID",
    intro: "Отримайте доступ до свого професійного запису, підтвердних матеріалів, налаштувань приватності та керування профілем.",
    email: "Email",
    password: "Пароль",
    submit: "Увійти",
    new: "Ще не маєте CraftID?",
    create: "Створити обліковий запис",
    back: "Повернутися до CraftID",
    resendTitle: "Письмо підтвердження не спрацювало?",
    resendText: "Вкажіть ту саму email-адресу, і ми надішлемо нове посилання для підтвердження.",
    resend: "Надіслати підтвердження повторно",
  },
} as const;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale];
  const q = locale === "en" ? "" : `?lang=${locale}`;

  return (
    <main className="authPage">
      <section className="authPanel">
        <div className="authTopline">
          <Link href={`/${q}`} className="brand authBrand">CraftID</Link>
          <LanguageMenu locale={locale} pathname="/login" />
        </div>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="authIntro">{t.intro}</p>

        {params.error ? <p className="formMessage error">{params.error}</p> : null}
        {params.message ? <p className="formMessage">{params.message}</p> : null}

        <form className="authForm" action={login}>
          <input type="hidden" name="lang" value={locale} />
          <label>{t.email}<input name="email" type="email" autoComplete="email" required /></label>
          <label>{t.password}<input name="password" type="password" autoComplete="current-password" required minLength={8} /></label>
          <button className="button buttonPrimary" type="submit">{t.submit}</button>
        </form>

        <p className="authFoot">
          {t.new} <Link href={`/signup${q}`}>{t.create}</Link>
        </p>

        <div className="resendPanel">
          <strong>{t.resendTitle}</strong>
          <p>{t.resendText}</p>
          <form className="resendForm" action={resendConfirmation}>
            <input type="hidden" name="lang" value={locale} />
            <input name="email" type="email" autoComplete="email" placeholder={t.email} required />
            <button className="button" type="submit">{t.resend}</button>
          </form>
        </div>

        <p className="authBack"><Link href={`/${q}`}>← {t.back}</Link></p>
      </section>
    </main>
  );
}
