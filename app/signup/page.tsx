import Link from "next/link";
import { signup } from "./actions";
import { localeFrom } from "@/components/site-shell";

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
  const t = copy[locale as keyof typeof copy] ?? copy.en;
  const q = locale === "en" ? "" : `?lang=${locale}`;

  return (
    <main className="authPage">
      <section className="authPanel">
        <div className="authTopline">
          <Link href={`/${q}`} className="brand authBrand">CraftID</Link>
          <div className="languageSwitch">
            <Link className={locale === "en" ? "active" : ""} href="/signup">EN</Link>
            <span>/</span>
            <Link className={locale === "uk" ? "active" : ""} href="/signup?lang=uk">UA</Link>
          </div>
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
