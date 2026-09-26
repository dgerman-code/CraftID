import Link from "next/link";
import {
  localeFrom,
  localeMeta,
  supportedLocales,
  withLocale,
  type Locale,
} from "@/lib/i18n";

export type PublicLocale = Locale;
export { localeFrom };

const labels: Record<
  PublicLocale,
  {
    discover: string;
    skills: string;
    methodology: string;
    about: string;
    network: string;
    signIn: string;
    initiative: string;
    language: string;
    privacy: string;
    governance: string;
    verifyCertificate: string;
    footerLine: string;
  }
> = {
  en: {
    discover: "Discover",
    skills: "Skills",
    methodology: "Methodology",
    about: "About",
    network: "Network",
    signIn: "Sign in",
    initiative: "An EUFUA digital instrument",
    language: "Language",
    privacy: "Privacy",
    governance: "Governance",
    verifyCertificate: "Verify certificate",
    footerLine: "Professional identity · skills · evidence · trust",
  },
  fr: {
    discover: "Explorer",
    skills: "Compétences",
    methodology: "Méthodologie",
    about: "À propos",
    network: "Réseau",
    signIn: "Se connecter",
    initiative: "Un instrument numérique d’EUFUA",
    language: "Langue",
    privacy: "Confidentialité",
    governance: "Gouvernance",
    verifyCertificate: "Vérifier un certificat",
    footerLine: "Identité professionnelle · compétences · preuves · confiance",
  },
  de: {
    discover: "Entdecken",
    skills: "Kompetenzen",
    methodology: "Methodik",
    about: "Über CraftID",
    network: "Netzwerk",
    signIn: "Anmelden",
    initiative: "Ein digitales Instrument von EUFUA",
    language: "Sprache",
    privacy: "Datenschutz",
    governance: "Governance",
    verifyCertificate: "Zertifikat prüfen",
    footerLine: "Berufliche Identität · Kompetenzen · Nachweise · Vertrauen",
  },
  nl: {
    discover: "Ontdekken",
    skills: "Vaardigheden",
    methodology: "Methodologie",
    about: "Over CraftID",
    network: "Netwerk",
    signIn: "Inloggen",
    initiative: "Een digitaal instrument van EUFUA",
    language: "Taal",
    privacy: "Privacy",
    governance: "Governance",
    verifyCertificate: "Certificaat controleren",
    footerLine: "Professionele identiteit · vaardigheden · bewijs · vertrouwen",
  },
  pl: {
    discover: "Odkrywaj",
    skills: "Umiejętności",
    methodology: "Metodologia",
    about: "O CraftID",
    network: "Sieć",
    signIn: "Zaloguj się",
    initiative: "Cyfrowe narzędzie EUFUA",
    language: "Język",
    privacy: "Prywatność",
    governance: "Zarządzanie",
    verifyCertificate: "Sprawdź certyfikat",
    footerLine: "Tożsamość zawodowa · umiejętności · dowody · zaufanie",
  },
  it: {
    discover: "Scopri",
    skills: "Competenze",
    methodology: "Metodologia",
    about: "Informazioni",
    network: "Rete",
    signIn: "Accedi",
    initiative: "Uno strumento digitale di EUFUA",
    language: "Lingua",
    privacy: "Privacy",
    governance: "Governance",
    verifyCertificate: "Verifica certificato",
    footerLine: "Identità professionale · competenze · evidenze · fiducia",
  },
  es: {
    discover: "Descubrir",
    skills: "Competencias",
    methodology: "Metodología",
    about: "Acerca de CraftID",
    network: "Red",
    signIn: "Iniciar sesión",
    initiative: "Un instrumento digital de EUFUA",
    language: "Idioma",
    privacy: "Privacidad",
    governance: "Gobernanza",
    verifyCertificate: "Verificar certificado",
    footerLine: "Identidad profesional · competencias · evidencias · confianza",
  },
  uk: {
    discover: "Пошук",
    skills: "Навички",
    methodology: "Методологія",
    about: "Про CraftID",
    network: "Мережа",
    signIn: "Увійти",
    initiative: "Цифровий інструмент EUFUA",
    language: "Мова",
    privacy: "Приватність",
    governance: "Управління",
    verifyCertificate: "Перевірити сертифікат",
    footerLine: "Професійна ідентичність · навички · докази · довіра",
  },
};

export function SiteHeader({
  locale,
  pathname,
}: {
  locale: PublicLocale;
  pathname: string;
}) {
  const t = labels[locale];
  const isActive = (path: string) =>
    pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));

  return (
    <header className="header">
      <div className="container headerInner">
        <Link href={withLocale("/", locale)} className="brand">
          CraftID
        </Link>
        <div className="headerRight">
          <nav className="nav" aria-label="Primary navigation">
            <Link className={isActive("/discover") ? "active" : ""} href={withLocale("/discover", locale)}>{t.discover}</Link>
            <Link className={isActive("/skills") ? "active" : ""} href={withLocale("/skills", locale)}>{t.skills}</Link>
            <Link className={isActive("/methodology") ? "active" : ""} href={withLocale("/methodology", locale)}>{t.methodology}</Link>
            <Link className={isActive("/network") ? "active" : ""} href={withLocale("/network", locale)}>{t.network}</Link>
            <Link className={isActive("/about") ? "active" : ""} href={withLocale("/about", locale)}>{t.about}</Link>
          </nav>
          <details className="languageMenu">
            <summary aria-label={t.language}>
              <span>{localeMeta[locale].label}</span>
              <span className="languageMenuChevron" aria-hidden="true">⌄</span>
            </summary>
            <div className="languageMenuPanel">
              {supportedLocales.map((language) => (
                <Link
                  key={language}
                  className={locale === language ? "active" : ""}
                  href={withLocale(pathname, language)}
                  hrefLang={language}
                >
                  <span>{localeMeta[language].label}</span>
                  <small>{localeMeta[language].short}</small>
                </Link>
              ))}
            </div>
          </details>
          <Link className="textLink" href={withLocale("/login", locale)}>
            {t.signIn}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: PublicLocale }) {
  const t = labels[locale];

  return (
    <footer className="footer">
      <div className="container footerInner">
        <span>CraftID</span>
        <span>{t.initiative}</span>
        <nav className="footerNav" aria-label="Footer navigation">
          <Link href={withLocale("/privacy", locale)}>{t.privacy}</Link>
          <Link href={withLocale("/governance", locale)}>{t.governance}</Link>
          <Link href={withLocale("/certificate", locale)}>{t.verifyCertificate}</Link>
          <span>{t.footerLine}</span>
        </nav>
      </div>
    </footer>
  );
}
