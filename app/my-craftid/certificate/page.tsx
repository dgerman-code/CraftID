import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { formatCraftId } from "@/lib/certificate";
import { getSiteUrl } from "@/lib/site-url";
import { issueCertificate } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    lang?: string;
    entity?: string;
    error?: string;
    message?: string;
    certificate?: string;
  }>;
};

const copy = {
  en: {
    eyebrow: "CraftID Certificate",
    titleProfessional: "Professional identity certificate",
    titleWorkshop: "Workshop identity certificate",
    intro:
      "Issue a versioned PDF certificate for this CraftID. Each certificate has its own Certificate ID and public verification page.",
    back: "Back to My CraftID",
    eligible: "Certificates can be issued for published CraftID records.",
    notEligible: "Publish this CraftID before issuing a certificate.",
    issue: "Issue first certificate",
    reissue: "Issue updated certificate",
    issued: "Certificate issued.",
    history: "Certificate history",
    none: "No certificate has been issued for this CraftID yet.",
    version: "Version",
    issuedOn: "Issued",
    status: "Status",
    issuedStatus: "Issued",
    revokedStatus: "Revoked",
    downloadEn: "Download PDF (EN)",
    downloadUk: "Download PDF (UA)",
    verify: "Verify certificate",
    noteTitle: "What this certificate confirms",
    note:
      "The certificate confirms registration and identity within CraftID. It does not certify professional quality, a qualification, a statutory licence, accreditation, or EU institutional endorsement.",
    snapshot:
      "A certificate is an issued snapshot. If the profile changes later, the verification page still shows the original issue data and separately shows the current CraftID status.",
    currentCraftId: "CraftID",
    domainWarning: "Important: the verification QR currently uses a temporary technical domain. Do not print certificates for long-term use at scale until the final CraftID production domain is connected.",
  },
  uk: {
    eyebrow: "Сертифікат CraftID",
    titleProfessional: "Сертифікат професійної ідентичності",
    titleWorkshop: "Сертифікат ідентичності майстерні",
    intro:
      "Створюйте версійний PDF-сертифікат для цього CraftID. Кожен сертифікат має власний Certificate ID та публічну сторінку перевірки.",
    back: "Назад до Мій CraftID",
    eligible: "Сертифікат можна випустити для опублікованого запису CraftID.",
    notEligible: "Спочатку опублікуйте цей CraftID.",
    issue: "Випустити перший сертифікат",
    reissue: "Випустити оновлений сертифікат",
    issued: "Сертифікат випущено.",
    history: "Історія сертифікатів",
    none: "Для цього CraftID ще не випущено жодного сертифіката.",
    version: "Версія",
    issuedOn: "Випущено",
    status: "Статус",
    issuedStatus: "Чинний випуск",
    revokedStatus: "Відкликано",
    downloadEn: "Завантажити PDF (EN)",
    downloadUk: "Завантажити PDF (UA)",
    verify: "Перевірити сертифікат",
    noteTitle: "Що підтверджує цей сертифікат",
    note:
      "Сертифікат підтверджує реєстрацію та ідентичність у CraftID. Він не є сертифікацією професійної якості, кваліфікацією, законодавчою ліцензією, акредитацією чи інституційним схваленням ЄС.",
    snapshot:
      "Сертифікат є зафіксованим випуском. Якщо профіль зміниться пізніше, сторінка перевірки зберігає первинні дані випуску й окремо показує поточний статус CraftID.",
    currentCraftId: "CraftID",
    domainWarning: "Важливо: QR-перевірка зараз використовує тимчасовий технічний домен. Не друкуйте сертифікати для довгострокового масового використання, доки не буде підключено фінальний production-домен CraftID.",
  },
} as const;

export default async function CertificateWorkspacePage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const { supabase, userId, entity } = await getOwnedCraftId(sp.entity);
  const q = entity
    ? ownerWorkspaceQuery(locale, entity.id)
    : locale === "uk"
      ? "?lang=uk"
      : "";

  if (!userId) redirect(locale === "uk" ? "/login?lang=uk" : "/login");
  if (sp.entity && !entity) {
    redirect(locale === "uk" ? "/my-craftid?lang=uk" : "/my-craftid");
  }
  if (!entity) {
    redirect(locale === "uk" ? "/onboarding?lang=uk" : "/onboarding");
  }

  const { data: certificates } = await supabase
    .from("craftid_certificates")
    .select("certificate_code, version_no, issued_at, status")
    .eq("entity_id", entity.id)
    .order("version_no", { ascending: false });

  const rows = certificates ?? [];
  const canIssue = entity.public_status === "published";
  const siteUrl = getSiteUrl();
  const isTemporaryDomain = siteUrl.includes("vercel.app") || siteUrl.includes("localhost");
  const craftId = formatCraftId(
    entity.craftid_number,
    entity.craftid_check_digits,
  );

  return (
    <main className="workspacePage">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={"/my-craftid" + q}>
          ← {t.back}
        </Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{entity.entity_type === "professional" ? t.titleProfessional : t.titleWorkshop}</h1>
        <p className="workspaceIntro">{t.intro}</p>

        {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
        {sp.message === "issued" ? (
          <p className="formMessage">{t.issued}</p>
        ) : null}
        {isTemporaryDomain ? (
          <p className="privacyNote markDomainWarning">{t.domainWarning}</p>
        ) : null}

        <section className="certificateSummaryCard">
          <div>
            <div className="eyebrow">{t.currentCraftId}</div>
            <strong className="certificateCraftId">#{craftId}</strong>
          </div>
          <p className={canIssue ? "formMessage" : "privacyNote"}>
            {canIssue ? t.eligible : t.notEligible}
          </p>
          {canIssue ? (
            <form action={issueCertificate}>
              <input type="hidden" name="lang" value={locale} />
              <input type="hidden" name="entityId" value={entity.id} />
              <button className="button buttonPrimary" type="submit">
                {rows.length ? t.reissue : t.issue}
              </button>
            </form>
          ) : null}
        </section>

        <section className="certificateInfoPanel">
          <div className="eyebrow">{t.noteTitle}</div>
          <p>{t.note}</p>
          <p className="fieldHelp">{t.snapshot}</p>
        </section>

        <section className="certificateHistorySection">
          <div className="eyebrow">{t.history}</div>
          {rows.length ? (
            <div className="certificateHistoryList">
              {rows.map((certificate) => {
                const verifyHref =
                  "/certificate/" +
                  encodeURIComponent(certificate.certificate_code) +
                  (locale === "uk" ? "?lang=uk" : "");
                const pdfEn =
                  "/api/certificate/" +
                  encodeURIComponent(certificate.certificate_code) +
                  "?lang=en&download=1";
                const pdfUk =
                  "/api/certificate/" +
                  encodeURIComponent(certificate.certificate_code) +
                  "?lang=uk&download=1";

                return (
                  <article
                    className="certificateHistoryItem"
                    key={certificate.certificate_code}
                  >
                    <div>
                      <strong>{certificate.certificate_code}</strong>
                      <span>
                        {t.version} {certificate.version_no}
                      </span>
                    </div>
                    <div>
                      <span>{t.issuedOn}</span>
                      <strong>
                        {new Date(certificate.issued_at).toLocaleDateString(
                          locale === "uk" ? "uk-UA" : "en-GB",
                        )}
                      </strong>
                    </div>
                    <div>
                      <span>{t.status}</span>
                      <strong>
                        {certificate.status === "revoked"
                          ? t.revokedStatus
                          : t.issuedStatus}
                      </strong>
                    </div>
                    <div className="certificateActions">
                      <a className="button" href={pdfEn}>
                        {t.downloadEn}
                      </a>
                      <a className="button" href={pdfUk}>
                        {t.downloadUk}
                      </a>
                      <Link className="button" href={verifyHref}>
                        {t.verify}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p>{t.none}</p>
          )}
        </section>
      </div>
    </main>
  );
}
