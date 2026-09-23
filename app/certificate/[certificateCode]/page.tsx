import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom } from "@/components/site-shell";
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
    title: "CraftID Identity Certificate",
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
      "This certificate confirms registration and identity within the CraftID infrastructure. It is not a professional qualification, statutory licence, quality certification, accreditation, or EU institutional endorsement.",
    currentNote:
      "The certificate data above is the snapshot recorded when it was issued. Current CraftID status is shown separately.",
    revokedReason: "Revocation reason",
  },
  uk: {
    eyebrow: "Перевірка сертифіката",
    title: "Сертифікат ідентичності CraftID",
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
      "Цей сертифікат підтверджує реєстрацію та ідентичність у інфраструктурі CraftID. Він не є професійною кваліфікацією, законодавчою ліцензією, сертифікацією якості, акредитацією чи інституційним схваленням ЄС.",
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
    "/id/" + craftId + (locale === "uk" ? "?lang=uk" : "");
  const pdfHref =
    "/api/certificate/" +
    encodeURIComponent(certificate.certificate_code) +
    "?lang=" +
    locale +
    "&download=1";
  const dateLocale = locale === "uk" ? "uk-UA" : "en-GB";
  const revoked = certificate.certificate_status === "revoked";

  return (
    <main className="certificateVerificationPage">
      <div className="container certificateVerificationContainer">
        <header className="publicIdentityHeader">
          <Link
            className="brand"
            href={locale === "uk" ? "/?lang=uk" : "/"}
          >
            CraftID
          </Link>
          <div className="recordId">{t.eyebrow}</div>
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
