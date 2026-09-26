import Link from "next/link";
import { signup } from "./actions";
import { LanguageMenu, localeFrom } from "@/components/site-shell";

type SignupPageProps = {
  searchParams: Promise<{ error?: string; lang?: string }>;
};

const copy = {
  en: {
    eyebrow: "Create a professional identity",
    title: "Create your CraftID account",
    intro: "Your account securely owns the professional or workshop record you create. A CraftID number is assigned only after account setup.",
    email: "Email",
    password: "Password",
    confirm: "Confirm password",
    submit: "Create account",
    have: "Already registered?",
    signIn: "Sign in",
    note: "By creating an account, you are starting a professional record. CraftID does not certify you or grant professional status.",
    back: "Back to CraftID",
  },
  fr: {
    eyebrow: "Créer une identité professionnelle", title: "Créez votre compte CraftID",
    intro: "Votre compte détient de manière sécurisée le dossier Professional ou Workshop que vous créez. Un numéro CraftID n’est attribué qu’après la configuration du compte.",
    email: "E-mail", password: "Mot de passe", confirm: "Confirmer le mot de passe", submit: "Créer le compte",
    have: "Déjà inscrit ?", signIn: "Se connecter",
    note: "En créant un compte, vous commencez un dossier professionnel. CraftID ne vous certifie pas et ne vous confère aucun statut professionnel.",
    back: "Retour à CraftID",
  },
  de: {
    eyebrow: "Berufliche Identität erstellen", title: "CraftID-Konto erstellen",
    intro: "Ihr Konto ist sicherer Inhaber des von Ihnen erstellten Professional- oder Workshop-Datensatzes. Eine CraftID-Nummer wird erst nach der Kontoeinrichtung vergeben.",
    email: "E-Mail", password: "Passwort", confirm: "Passwort bestätigen", submit: "Konto erstellen",
    have: "Bereits registriert?", signIn: "Anmelden",
    note: "Mit der Kontoerstellung beginnen Sie einen beruflichen Datensatz. CraftID zertifiziert Sie nicht und verleiht keinen Berufsstatus.",
    back: "Zurück zu CraftID",
  },
  nl: {
    eyebrow: "Professionele identiteit aanmaken", title: "Maak uw CraftID-account aan",
    intro: "Uw account is de beveiligde eigenaar van het Professional- of Workshop-dossier dat u aanmaakt. Een CraftID-nummer wordt pas na het instellen van het account toegewezen.",
    email: "E-mail", password: "Wachtwoord", confirm: "Bevestig wachtwoord", submit: "Account aanmaken",
    have: "Al geregistreerd?", signIn: "Inloggen",
    note: "Door een account aan te maken start u een professioneel dossier. CraftID certificeert u niet en verleent geen professionele status.",
    back: "Terug naar CraftID",
  },
  pl: {
    eyebrow: "Utwórz tożsamość zawodową", title: "Utwórz konto CraftID",
    intro: "Twoje konto bezpiecznie posiada utworzony przez Ciebie zapis Professional lub Workshop. Numer CraftID jest przydzielany dopiero po skonfigurowaniu konta.",
    email: "E-mail", password: "Hasło", confirm: "Potwierdź hasło", submit: "Utwórz konto",
    have: "Masz już konto?", signIn: "Zaloguj się",
    note: "Tworząc konto, rozpoczynasz zapis zawodowy. CraftID nie certyfikuje Cię ani nie nadaje statusu zawodowego.",
    back: "Wróć do CraftID",
  },
  it: {
    eyebrow: "Crea un’identità professionale", title: "Crea il tuo account CraftID",
    intro: "Il tuo account possiede in modo sicuro il record Professional o Workshop che crei. Un numero CraftID viene assegnato solo dopo la configurazione dell’account.",
    email: "E-mail", password: "Password", confirm: "Conferma password", submit: "Crea account",
    have: "Già registrato?", signIn: "Accedi",
    note: "Creando un account inizi un record professionale. CraftID non ti certifica e non conferisce uno status professionale.",
    back: "Torna a CraftID",
  },
  es: {
    eyebrow: "Crear una identidad profesional", title: "Crea tu cuenta CraftID",
    intro: "Tu cuenta es la propietaria segura del registro Professional o Workshop que crees. El número CraftID se asigna únicamente después de configurar la cuenta.",
    email: "Correo electrónico", password: "Contraseña", confirm: "Confirmar contraseña", submit: "Crear cuenta",
    have: "¿Ya estás registrado?", signIn: "Iniciar sesión",
    note: "Al crear una cuenta comienzas un registro profesional. CraftID no te certifica ni te concede un estatus profesional.",
    back: "Volver a CraftID",
  },
  uk: {
    eyebrow: "Створення професійної ідентичності",
    title: "Створіть обліковий запис CraftID",
    intro: "Ваш обліковий запис безпечно володіє професійним записом або записом майстерні. Номер CraftID присвоюється після налаштування облікового запису.",
    email: "Email",
    password: "Пароль",
    confirm: "Підтвердіть пароль",
    submit: "Створити обліковий запис",
    have: "Вже зареєстровані?",
    signIn: "Увійти",
    note: "Створення облікового запису розпочинає формування професійного запису. CraftID не сертифікує вас і не надає професійного статусу.",
    back: "Повернутися до CraftID",
  },
} as const;

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale];
  const q = locale === "en" ? "" : `?lang=${locale}`;

  return (
    <main className="authPage">
      <section className="authPanel">
        <div className="authTopline">
          <Link href={`/${q}`} className="brand authBrand">CraftID</Link>
          <LanguageMenu locale={locale} pathname="/signup" />
        </div>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="authIntro">{t.intro}</p>

        {params.error ? <p className="formMessage error">{params.error}</p> : null}

        <form className="authForm" action={signup}>
          <input type="hidden" name="lang" value={locale} />
          <label>{t.email}<input name="email" type="email" autoComplete="email" required /></label>
          <label>{t.password}<input name="password" type="password" autoComplete="new-password" required minLength={8} /></label>
          <label>{t.confirm}<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} /></label>
          <button className="button buttonPrimary" type="submit">{t.submit}</button>
        </form>

        <p className="authLegal">{t.note}</p>
        <p className="authFoot">{t.have} <Link href={`/login${q}`}>{t.signIn}</Link></p>
        <p className="authBack"><Link href={`/${q}`}>← {t.back}</Link></p>
      </section>
    </main>
  );
}
