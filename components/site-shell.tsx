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
    signIn: "Sign in",
    initiative: "An EUFUA digital instrument",
    language: "Language",
  },
  uk: {
    discover: "Пошук",
    skills: "Навички",
    methodology: "Методологія",
    about: "Про CraftID",
    signIn: "Увійти",
    initiative: "Цифровий інструмент EUFUA",
    language: "Мова",
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
          <Link className="textLink" href="/login">
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
        <span>Professional identity · skills · evidence</span>
      </div>
    </footer>
  );
}
