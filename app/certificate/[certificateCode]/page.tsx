import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LanguageMenu, localeFrom } from "@/components/site-shell";
import { localeMeta } from "@/lib/i18n";
import {
  formatCraftId,
  isCertificateCode,
  normalizeCertificateCode,
  type PublicCraftIdCertificate,
} from "@/lib/certificate";
import { formatCertificateNumber } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ certificateCode: string }>;
  searchParams: Promise<{ lang?: string }>;
};

const copy = {
  en: {
    eyebrow: "Certificate verification",
    title: "CraftID Record Certificate",
    valid: "Certificate record found",
    revoked: "This certificate has been revoked",
    craftId: "CraftID",
    certificateId: "Certificate No.",
    recordType: "Record type",
    professional: "Professional",
    workshop: "Workshop",
    issued: "Issued",
    firstRegistered: "CraftID first registered",
    country: "Profile country at issue",
    currentStatus: "Current CraftID status",
    download: "Download certificate PDF",
    openProfile: "Open CraftID record",
    disclaimer:
      "This certificate records a versioned snapshot of a published CraftID record. It does not by itself verify legal identity, professional competence, a qualification, statutory licence, accreditation, quality, or EU institutional endorsement.",
    currentNote:
      "The certificate data above is the snapshot recorded when it was issued. Current CraftID status is shown separately.",
    revokedReason: "Revocation reason",
  },
  fr: {
    eyebrow: "Vérification du certificat", title: "CraftID Record Certificate", valid: "Dossier de certificat trouvé", revoked: "Ce certificat a été révoqué",
    craftId: "CraftID", certificateId: "Certificate No.", recordType: "Type de dossier", professional: "Professional", workshop: "Workshop",
    issued: "Émis le", firstRegistered: "Premier enregistrement CraftID", country: "Pays du profil à l’émission", currentStatus: "Statut CraftID actuel",
    download: "Télécharger le certificat PDF", openProfile: "Ouvrir le dossier CraftID",
    disclaimer: "Ce certificat enregistre un instantané versionné d’un dossier CraftID publié. À lui seul, il ne vérifie ni identité légale, ni compétence professionnelle, ni qualification, licence légale, accréditation, qualité ou approbation institutionnelle de l’UE.",
    currentNote: "Les données ci-dessus correspondent à l’instantané enregistré lors de l’émission. Le statut actuel du CraftID est affiché séparément.", revokedReason: "Motif de révocation",
  },
  de: {
    eyebrow: "Zertifikatsprüfung", title: "CraftID Record Certificate", valid: "Zertifikatsdatensatz gefunden", revoked: "Dieses Zertifikat wurde widerrufen",
    craftId: "CraftID", certificateId: "Certificate No.", recordType: "Datensatztyp", professional: "Professional", workshop: "Workshop",
    issued: "Ausgestellt", firstRegistered: "CraftID erstmals registriert", country: "Profilland bei Ausgabe", currentStatus: "Aktueller CraftID-Status",
    download: "Zertifikat als PDF herunterladen", openProfile: "CraftID-Datensatz öffnen",
    disclaimer: "Dieses Zertifikat dokumentiert einen versionierten Snapshot eines veröffentlichten CraftID-Datensatzes. Es bestätigt für sich genommen weder rechtliche Identität, berufliche Kompetenz, Qualifikation, gesetzliche Lizenz, Akkreditierung, Qualität noch institutionelle EU-Billigung.",
    currentNote: "Die oben genannten Zertifikatsdaten entsprechen dem bei der Ausgabe gespeicherten Stand. Der aktuelle CraftID-Status wird separat angezeigt.", revokedReason: "Widerrufsgrund",
  },
  nl: {
    eyebrow: "Certificaatcontrole", title: "CraftID Record Certificate", valid: "Certificaatdossier gevonden", revoked: "Dit certificaat is ingetrokken",
    craftId: "CraftID", certificateId: "Certificate No.", recordType: "Dossiertype", professional: "Professional", workshop: "Workshop",
    issued: "Uitgegeven", firstRegistered: "CraftID eerste registratie", country: "Profielland bij uitgifte", currentStatus: "Huidige CraftID-status",
    download: "Certificaat-PDF downloaden", openProfile: "CraftID-dossier openen",
    disclaimer: "Dit certificaat legt een versiegebonden momentopname van een gepubliceerd CraftID-dossier vast. Het verifieert op zichzelf geen wettelijke identiteit, professionele bekwaamheid, kwalificatie, wettelijke vergunning, accreditatie, kwaliteit of institutionele EU-goedkeuring.",
    currentNote: "De bovenstaande certificaatgegevens zijn de momentopname die bij uitgifte is vastgelegd. De huidige CraftID-status wordt apart weergegeven.", revokedReason: "Reden van intrekking",
  },
  pl: {
    eyebrow: "Weryfikacja certyfikatu", title: "CraftID Record Certificate", valid: "Znaleziono zapis certyfikatu", revoked: "Ten certyfikat został wycofany",
    craftId: "CraftID", certificateId: "Certificate No.", recordType: "Typ zapisu", professional: "Professional", workshop: "Workshop",
    issued: "Wydano", firstRegistered: "Pierwsza rejestracja CraftID", country: "Kraj profilu przy wydaniu", currentStatus: "Bieżący status CraftID",
    download: "Pobierz certyfikat PDF", openProfile: "Otwórz zapis CraftID",
    disclaimer: "Ten certyfikat utrwala wersjonowaną migawkę opublikowanego zapisu CraftID. Sam w sobie nie weryfikuje tożsamości prawnej, kompetencji zawodowych, kwalifikacji, licencji ustawowej, akredytacji, jakości ani instytucjonalnego poparcia UE.",
    currentNote: "Powyższe dane certyfikatu są migawką zapisaną w chwili wydania. Bieżący status CraftID jest pokazany osobno.", revokedReason: "Powód wycofania",
  },
  it: {
    eyebrow: "Verifica del certificato", title: "CraftID Record Certificate", valid: "Record del certificato trovato", revoked: "Questo certificato è stato revocato",
    craftId: "CraftID", certificateId: "Certificate No.", recordType: "Tipo di record", professional: "Professional", workshop: "Workshop",
    issued: "Emesso", firstRegistered: "Prima registrazione CraftID", country: "Paese del profilo all’emissione", currentStatus: "Stato CraftID attuale",
    download: "Scarica certificato PDF", openProfile: "Apri record CraftID",
    disclaimer: "Questo certificato registra uno snapshot versionato di un record CraftID pubblicato. Di per sé non verifica identità legale, competenza professionale, qualifica, licenza prevista dalla legge, accreditamento, qualità o approvazione istituzionale dell’UE.",
    currentNote: "I dati del certificato sopra riportati sono lo snapshot registrato al momento dell’emissione. Lo stato attuale del CraftID è mostrato separatamente.", revokedReason: "Motivo della revoca",
  },
  es: {
    eyebrow: "Verificación de certificado", title: "CraftID Record Certificate", valid: "Registro de certificado encontrado", revoked: "Este certificado ha sido revocado",
    craftId: "CraftID", certificateId: "Certificate No.", recordType: "Tipo de registro", professional: "Professional", workshop: "Workshop",
    issued: "Emitido", firstRegistered: "Primera inscripción de CraftID", country: "País del perfil al emitir", currentStatus: "Estado actual de CraftID",
    download: "Descargar certificado PDF", openProfile: "Abrir registro CraftID",
    disclaimer: "Este certificado registra una instantánea versionada de un registro CraftID publicado. Por sí solo no verifica identidad legal, competencia profesional, cualificación, licencia legal, acreditación, calidad ni respaldo institucional de la UE.",
    currentNote: "Los datos del certificado mostrados arriba son la instantánea registrada al emitirse. El estado actual de CraftID se muestra por separado.", revokedReason: "Motivo de revocación",
  },
  uk: {
    eyebrow: "Перевірка сертифіката",
    title: "Сертифікат запису CraftID",
    valid: "Запис сертифіката знайдено",
    revoked: "Цей сертифікат відкликано",
    craftId: "CraftID",
    certificateId: "Certificate No.",
    recordType: "Тип запису",
    professional: "Професіонал",
    workshop: "Майстерня",
    issued: "Дата випуску",
    firstRegistered: "Перша реєстрація CraftID",
    country: "Країна профілю на момент випуску",
    currentStatus: "Поточний статус CraftID",
    download: "Завантажити PDF сертифіката",
    openProfile: "Відкрити запис CraftID",
    disclaimer:
      "Цей сертифікат фіксує версію опублікованого запису CraftID. Він сам по собі не підтверджує юридичну особу, професійну компетентність, кваліфікацію, законодавчу ліцензію, акредитацію, якість чи інституційне схвалення ЄС.",
    currentNote:
      "Дані сертифіката вище є зафіксованим станом на момент його випуску. Поточний статус CraftID показано окремо.",
    revokedReason: "Причина відкликання",
  },
} as const;

export default async function CertificateVerificationPage({
  params,
  searchParams,
}: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale];
  const code = normalizeCertificateCode(
    decodeURIComponent((await params).certificateCode),
  );

  if (!isCertificateCode(code)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.rpc("public_craftid_certificate", {
    p_certificate_code: code,
  });

  const certificate = data as PublicCraftIdCertificate | null;
  if (!certificate) notFound();

  const craftId = formatCraftId(
    certificate.craftid_number,
    certificate.craftid_check_digits,
  );
  const profileHref =
    "/id/" + craftId + (locale === "en" ? "" : `?lang=${locale}`);
  const pdfHref =
    "/api/certificate/" +
    encodeURIComponent(certificate.certificate_code) +
    "?lang=" +
    locale +
    "&download=1";
  const dateLocale = localeMeta[locale].intl;
  const revoked = certificate.certificate_status === "revoked";

  return (
    <main className="certificateVerificationPage">
      <div className="container certificateVerificationContainer">
        <header className="publicIdentityHeader">
          <Link
            className="brand"
            href={locale === "en" ? "/" : `/?lang=${locale}`}
          >
            CraftID
          </Link>
          <div className="publicIdentityHeaderActions"><div className="recordId">{t.eyebrow}</div><LanguageMenu locale={locale} pathname={`/certificate/${encodeURIComponent(certificate.certificate_code)}`} /></div>
        </header>

        <section
          className={
            revoked
              ? "certificateVerifyHero revoked"
              : "certificateVerifyHero"
          }
        >
          <div>
            <div className="eyebrow">{revoked ? t.revoked : t.valid}</div>
            <h1>{t.title}</h1>
            <p className="certificateVerifyName">
              {certificate.issued_display_name}
            </p>
            {certificate.issued_role_label ? (
              <p>{certificate.issued_role_label}</p>
            ) : null}
          </div>
          <div className="trustStamp">
            <span>CraftID</span>
            <strong>#{craftId}</strong>
          </div>
        </section>

        <section className="certificateFacts">
          <dl>
            <div>
              <dt>{t.certificateId}</dt>
              <dd>{formatCertificateNumber(
                certificate.craftid_number,
                certificate.craftid_check_digits,
                certificate.version_no,
              )}</dd>
            </div>
            <div>
              <dt>{t.craftId}</dt>
              <dd>#{craftId}</dd>
            </div>
            <div>
              <dt>{t.recordType}</dt>
              <dd>
                {certificate.entity_type === "professional"
                  ? t.professional
                  : t.workshop}
              </dd>
            </div>
            <div>
              <dt>{t.issued}</dt>
              <dd>
                {new Date(certificate.issued_at).toLocaleDateString(
                  dateLocale,
                )}
              </dd>
            </div>
            <div>
              <dt>{t.firstRegistered}</dt>
              <dd>
                {new Date(certificate.entity_created_at).toLocaleDateString(
                  dateLocale,
                )}
              </dd>
            </div>
            {certificate.issued_country_code ? (
              <div>
                <dt>{t.country}</dt>
                <dd>{certificate.issued_country_code}</dd>
              </div>
            ) : null}
            <div>
              <dt>{t.currentStatus}</dt>
              <dd>{certificate.current_craftid_status}</dd>
            </div>
            {revoked && certificate.revoked_reason ? (
              <div>
                <dt>{t.revokedReason}</dt>
                <dd>{certificate.revoked_reason}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <div className="certificateVerifyActions">
          <a className="button buttonPrimary" href={pdfHref}>
            {t.download}
          </a>
          <Link className="button" href={profileHref}>
            {t.openProfile}
          </Link>
        </div>

        <p className="privacyNote">{t.currentNote}</p>
        <p className="publicIdentityNotice">{t.disclaimer}</p>
      </div>
    </main>
  );
}
