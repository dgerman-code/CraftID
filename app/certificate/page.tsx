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
  fr: {
    eyebrow: "Vérification du certificat", title: "Vérifier un certificat CraftID.",
    intro: "Saisissez le numéro de certificat imprimé sur un CraftID Record Certificate pour ouvrir son dossier public de vérification.",
    label: "Certificate No.", placeholder: "0000-0101-86/01", button: "Vérifier le certificat", invalid: "Saisissez un numéro de certificat CraftID valide.",
    note: "La vérification affiche les données d’émission d’origine et le statut actuel du dossier CraftID lié. Un certificat ne constitue ni qualification professionnelle, ni licence, ni certification de qualité, ni approbation de l’UE.",
    home: "Retour à CraftID",
  },
  de: {
    eyebrow: "Zertifikatsprüfung", title: "CraftID-Zertifikat prüfen.",
    intro: "Geben Sie die auf einem CraftID Record Certificate gedruckte Zertifikatsnummer ein, um den öffentlichen Prüfdatensatz zu öffnen.",
    label: "Certificate No.", placeholder: "0000-0101-86/01", button: "Zertifikat prüfen", invalid: "Geben Sie eine gültige CraftID-Zertifikatsnummer ein.",
    note: "Die Prüfung zeigt die ursprünglichen Ausgabedaten und den aktuellen Status des verknüpften CraftID-Datensatzes. Ein Zertifikat ist weder Berufsqualifikation noch Lizenz, Qualitätszertifizierung oder EU-Billigung.",
    home: "Zurück zu CraftID",
  },
  nl: {
    eyebrow: "Certificaatcontrole", title: "Controleer een CraftID-certificaat.",
    intro: "Voer het Certificate No. in dat op een CraftID Record Certificate staat om het openbare verificatiedossier te openen.",
    label: "Certificate No.", placeholder: "0000-0101-86/01", button: "Certificaat controleren", invalid: "Voer een geldig CraftID Certificate No. in.",
    note: "Verificatie toont de oorspronkelijke uitgiftegegevens en de huidige status van het gekoppelde CraftID-dossier. Een certificaat is geen beroepskwalificatie, vergunning, kwaliteitscertificering of EU-goedkeuring.",
    home: "Terug naar CraftID",
  },
  pl: {
    eyebrow: "Weryfikacja certyfikatu", title: "Sprawdź certyfikat CraftID.",
    intro: "Wprowadź Certificate No. wydrukowany na CraftID Record Certificate, aby otworzyć publiczny zapis weryfikacyjny.",
    label: "Certificate No.", placeholder: "0000-0101-86/01", button: "Sprawdź certyfikat", invalid: "Wprowadź prawidłowy numer certyfikatu CraftID.",
    note: "Weryfikacja pokazuje pierwotne dane wydania oraz bieżący status powiązanego zapisu CraftID. Certyfikat nie jest kwalifikacją zawodową, licencją, certyfikacją jakości ani zatwierdzeniem UE.",
    home: "Wróć do CraftID",
  },
  it: {
    eyebrow: "Verifica del certificato", title: "Verifica un certificato CraftID.",
    intro: "Inserisci il Certificate No. stampato su un CraftID Record Certificate per aprire il relativo record pubblico di verifica.",
    label: "Certificate No.", placeholder: "0000-0101-86/01", button: "Verifica certificato", invalid: "Inserisci un Certificate No. CraftID valido.",
    note: "La verifica mostra i dati originali di emissione e lo stato attuale del record CraftID collegato. Un certificato non rappresenta una qualifica professionale, licenza, certificazione di qualità o approvazione dell’UE.",
    home: "Torna a CraftID",
  },
  es: {
    eyebrow: "Verificación de certificado", title: "Verifica un certificado CraftID.",
    intro: "Introduce el Certificate No. impreso en un CraftID Record Certificate para abrir su registro público de verificación.",
    label: "Certificate No.", placeholder: "0000-0101-86/01", button: "Verificar certificado", invalid: "Introduce un Certificate No. de CraftID válido.",
    note: "La verificación muestra los datos originales de emisión y el estado actual del registro CraftID vinculado. Un certificado no representa una cualificación profesional, licencia, certificación de calidad ni respaldo de la UE.",
    home: "Volver a CraftID",
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
          (locale === "en" ? "" : `?lang=${locale}`),
      );
    }

    redirect(
      "/certificate?" +
        (locale === "en" ? "" : `lang=${locale}&`) +
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
            {locale !== "en" ? <input type="hidden" name="lang" value={locale} /> : null}
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
          <Link className="backLink" href={locale === "en" ? "/" : `/?lang=${locale}`}>
            ← {t.home}
          </Link>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
