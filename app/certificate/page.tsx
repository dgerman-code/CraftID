import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";
import { isCertificateCode, normalizeCertificateCode } from "@/lib/certificate";

type Props = {
  searchParams: Promise<{ lang?: string; code?: string; error?: string }>;
};

const copy = {
  en: {
    eyebrow: "Certificate verification",
    title: "Verify a CraftID certificate.",
    intro: "Enter the Certificate No. printed on a CraftID Record Certificate to open its public verification record.",
    label: "Certificate No.",
    placeholder: "0000-0101-86/01",
    button: "Verify certificate",
    invalid: "Enter a valid CraftID Certificate No.",
    note: "Verification shows the original issue data and the current status of the linked CraftID record. A certificate does not represent a professional qualification, licence, quality certification or EU endorsement.",
    home: "Back to CraftID",
  },
  uk: {
    eyebrow: "Перевірка сертифіката",
    title: "Перевірте сертифікат CraftID.",
    intro: "Введіть номер сертифіката, надрукований на сертифікаті запису CraftID, щоб відкрити його публічний запис перевірки.",
    label: "Номер сертифіката",
    placeholder: "0000-0101-86/01",
    button: "Перевірити сертифікат",
    invalid: "Введіть коректний номер сертифіката CraftID.",
    note: "Перевірка показує первинні дані випуску та поточний статус пов’язаного CraftID. Сертифікат не є професійною кваліфікацією, ліцензією, сертифікацією якості чи схваленням ЄС.",
    home: "Назад до CraftID",
  },
} as const;

export default async function CertificateLookupPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];

  if (sp.code) {
    const code = normalizeCertificateCode(sp.code);
    if (isCertificateCode(code)) {
      redirect(
        "/certificate/" +
          encodeURIComponent(code) +
          (locale === "uk" ? "?lang=uk" : ""),
      );
    }

    redirect(
      "/certificate?" +
        (locale === "uk" ? "lang=uk&" : "") +
        "error=invalid",
    );
  }

  return (
    <>
      <SiteHeader locale={locale} pathname="/certificate" />
      <main className="pageHero certificateLookupPage">
        <div className="container">
          <div className="eyebrow">{t.eyebrow}</div>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>

          {sp.error ? <p className="formMessage error">{t.invalid}</p> : null}

          <form className="craftIdLookupForm certificateLookupForm" action="/certificate" method="get">
            {locale === "uk" ? <input type="hidden" name="lang" value="uk" /> : null}
            <label htmlFor="certificate-code">{t.label}</label>
            <div className="craftIdLookupControl">
              <input
                id="certificate-code"
                name="code"
                autoComplete="off"
                spellCheck={false}
                placeholder={t.placeholder}
                required
              />
              <button className="button buttonPrimary" type="submit">
                {t.button}
              </button>
            </div>
          </form>

          <p className="privacyNote certificateLookupNote">{t.note}</p>
          <Link className="backLink" href={locale === "uk" ? "/?lang=uk" : "/"}>
            ← {t.home}
          </Link>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
