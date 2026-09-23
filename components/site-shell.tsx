import Link from "next/link";

export type PublicLocale = "en" | "uk";

export function localeFrom(value?: string): PublicLocale {
  return value === "uk" ? "uk" : "en";
}

function withLocale(path: string, locale: PublicLocale) {
  return locale === "uk" ? `${path}?lang=uk` : path;
}

const labels = {
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
} as const;

export function SiteHeader({
  locale,
  pathname,
}: {
  locale: PublicLocale;
  pathname: string;
}) {
  const t = labels[locale];

  return (
    <header className="header">
      <div className="container headerInner">
        <Link href={withLocale("/", locale)} className="brand">
          CraftID
        </Link>
        <div className="headerRight">
          <nav className="nav" aria-label="Primary navigation">
            <Link href={withLocale("/discover", locale)}>{t.discover}</Link>
            <Link href={withLocale("/skills", locale)}>{t.skills}</Link>
            <Link href={withLocale("/methodology", locale)}>{t.methodology}</Link>
            <Link href={withLocale("/network", locale)}>{t.network}</Link>
            <Link href={withLocale("/about", locale)}>{t.about}</Link>
          </nav>
          <div className="languageSwitch" aria-label={t.language}>
            <Link className={locale === "en" ? "active" : ""} href={pathname}>
              EN
            </Link>
            <span>/</span>
            <Link className={locale === "uk" ? "active" : ""} href={`${pathname}?lang=uk`}>
              UA
            </Link>
          </div>
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
