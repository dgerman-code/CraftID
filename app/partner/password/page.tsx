import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageMenu, localeFrom } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";
import { withLocale } from "@/lib/i18n";
import { changePartnerPassword, partnerLogout } from "../login/actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ lang?: string; error?: string; welcome?: string }>;
};

const copy = {
  en: {
    eyebrow: "Partner security",
    title: "Set your own password",
    intro:
      "Your organisation was given temporary partner access. Replace the temporary password before entering the CraftID Partner Workspace.",
    password: "New password",
    confirm: "Confirm new password",
    submit: "Set password and continue",
    note:
      "Use at least 12 characters. The temporary password will stop working after this change.",
    signOut: "Sign out",
    back: "Back to CraftID",
  },
  fr: {
    eyebrow: "Sécurité partenaire",
    title: "Définissez votre propre mot de passe",
    intro:
      "Votre organisation a reçu un accès partenaire temporaire. Remplacez le mot de passe temporaire avant d’entrer dans l’espace partenaire CraftID.",
    password: "Nouveau mot de passe",
    confirm: "Confirmer le nouveau mot de passe",
    submit: "Définir le mot de passe et continuer",
    note:
      "Utilisez au moins 12 caractères. Le mot de passe temporaire cessera de fonctionner après ce changement.",
    signOut: "Se déconnecter",
    back: "Retour à CraftID",
  },
  de: {
    eyebrow: "Partnersicherheit",
    title: "Eigenes Passwort festlegen",
    intro:
      "Ihre Organisation hat einen temporären Partnerzugang erhalten. Ersetzen Sie das temporäre Passwort, bevor Sie den CraftID Partner Workspace öffnen.",
    password: "Neues Passwort",
    confirm: "Neues Passwort bestätigen",
    submit: "Passwort festlegen und fortfahren",
    note:
      "Verwenden Sie mindestens 12 Zeichen. Das temporäre Passwort funktioniert danach nicht mehr.",
    signOut: "Abmelden",
    back: "Zurück zu CraftID",
  },
  nl: {
    eyebrow: "Partnerbeveiliging",
    title: "Stel uw eigen wachtwoord in",
    intro:
      "Uw organisatie kreeg tijdelijke partnertoegang. Vervang het tijdelijke wachtwoord voordat u de CraftID Partner Workspace opent.",
    password: "Nieuw wachtwoord",
    confirm: "Bevestig nieuw wachtwoord",
    submit: "Wachtwoord instellen en doorgaan",
    note:
      "Gebruik minstens 12 tekens. Het tijdelijke wachtwoord werkt daarna niet meer.",
    signOut: "Uitloggen",
    back: "Terug naar CraftID",
  },
  pl: {
    eyebrow: "Bezpieczeństwo partnera",
    title: "Ustaw własne hasło",
    intro:
      "Twoja organizacja otrzymała tymczasowy dostęp partnera. Zmień tymczasowe hasło przed wejściem do panelu partnera CraftID.",
    password: "Nowe hasło",
    confirm: "Potwierdź nowe hasło",
    submit: "Ustaw hasło i przejdź dalej",
    note:
      "Użyj co najmniej 12 znaków. Po zmianie hasło tymczasowe przestanie działać.",
    signOut: "Wyloguj się",
    back: "Wróć do CraftID",
  },
  it: {
    eyebrow: "Sicurezza partner",
    title: "Imposta la tua password",
    intro:
      "La tua organizzazione ha ricevuto un accesso partner temporaneo. Sostituisci la password temporanea prima di entrare nel CraftID Partner Workspace.",
    password: "Nuova password",
    confirm: "Conferma nuova password",
    submit: "Imposta password e continua",
    note:
      "Usa almeno 12 caratteri. La password temporanea smetterà di funzionare dopo la modifica.",
    signOut: "Esci",
    back: "Torna a CraftID",
  },
  es: {
    eyebrow: "Seguridad del socio",
    title: "Establece tu propia contraseña",
    intro:
      "Tu organización recibió acceso temporal de socio. Sustituye la contraseña temporal antes de entrar al CraftID Partner Workspace.",
    password: "Nueva contraseña",
    confirm: "Confirmar nueva contraseña",
    submit: "Establecer contraseña y continuar",
    note:
      "Usa al menos 12 caracteres. La contraseña temporal dejará de funcionar después del cambio.",
    signOut: "Cerrar sesión",
    back: "Volver a CraftID",
  },
  uk: {
    eyebrow: "Безпека партнера",
    title: "Встановіть власний пароль",
    intro:
      "Вашій організації надано тимчасовий партнерський доступ. Замініть тимчасовий пароль перед входом до CraftID Partner Workspace.",
    password: "Новий пароль",
    confirm: "Підтвердіть новий пароль",
    submit: "Встановити пароль і продовжити",
    note:
      "Використовуйте щонайменше 12 символів. Після зміни тимчасовий пароль більше не працюватиме.",
    signOut: "Вийти",
    back: "Повернутися до CraftID",
  },
} as const;

export default async function PartnerPasswordPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();

  if (!userResult.user) {
    redirect(withLocale("/partner/login", locale));
  }

  const [{ data: organisations }, { data: mustChange }] = await Promise.all([
    supabase.rpc("current_partner_organisations"),
    supabase.rpc("current_partner_password_change_required"),
  ]);

  if (!Array.isArray(organisations) || !organisations.length) {
    redirect(withLocale("/partner/login", locale));
  }

  if (!mustChange) {
    redirect(withLocale("/partner", locale));
  }

  return (
    <main className="authPage partnerAuthPage">
      <section className="authPanel partnerAuthPanel">
        <div className="authTopline">
          <Link href={withLocale("/", locale)} className="brand authBrand">
            CraftID
          </Link>
          <LanguageMenu locale={locale} pathname="/partner/password" />
        </div>

        <div className="partnerAuthMark">
          <span>CraftID</span>
          <strong>PARTNER</strong>
        </div>

        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="authIntro">{t.intro}</p>
        <p className="privacyNote partnerAuthNote">{t.note}</p>

        {sp.error ? <p className="formMessage error">{sp.error}</p> : null}

        <form className="authForm" action={changePartnerPassword}>
          <input type="hidden" name="lang" value={locale} />
          <label>
            {t.password}
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </label>
          <label>
            {t.confirm}
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </label>
          <button className="button buttonPrimary" type="submit">
            {t.submit}
          </button>
        </form>

        <div className="partnerAuthLinks">
          <form action={partnerLogout}>
            <input type="hidden" name="lang" value={locale} />
            <button className="textButton" type="submit">{t.signOut}</button>
          </form>
          <Link href={withLocale("/", locale)}>← {t.back}</Link>
        </div>
      </section>
    </main>
  );
}
