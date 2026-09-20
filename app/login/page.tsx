import Link from "next/link";
import { login } from "./actions";
import { localeFrom } from "@/components/site-shell";

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
  },
} as const;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale];
  const q = locale === "uk" ? "?lang=uk" : "";

  return (
    <main className="authPage">
      <section className="authPanel">
        <div className="authTopline">
          <Link href={`/${q}`} className="brand authBrand">CraftID</Link>
          <div className="languageSwitch">
            <Link className={locale === "en" ? "active" : ""} href="/login">EN</Link>
            <span>/</span>
            <Link className={locale === "uk" ? "active" : ""} href="/login?lang=uk">UA</Link>
          </div>
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
        <p className="authBack"><Link href={`/${q}`}>← {t.back}</Link></p>
      </section>
    </main>
  );
}
