import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { formatCraftId } from "@/lib/certificate";
import { formatCertificateNumber } from "@/lib/craftid-format";
import { getSiteUrl } from "@/lib/site-url";
import { issueCertificate } from "./actions";
import { localeMeta, localeQuery } from "@/lib/i18n";

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
    eyebrow: "CraftID Record Certificate", titleProfessional: "Professional CraftID record certificate", titleWorkshop: "Workshop CraftID record certificate",
    intro: "Issue a versioned PDF certificate of this CraftID record. Each certificate has its own Certificate No. and public verification page.",
    back: "Back to My CraftID", eligible: "Certificates can be issued for published CraftID records.", notEligible: "Publish this CraftID before issuing a certificate.",
    issue: "Issue first certificate", reissue: "Issue updated certificate", issued: "Certificate issued.", history: "Certificate history", none: "No certificate has been issued for this CraftID yet.",
    version: "Version", issuedOn: "Issued", status: "Status", issuedStatus: "Issued", revokedStatus: "Revoked",
    downloadEn: "Download PDF (English)", downloadUk: "Download PDF (Ukrainian)", verify: "Verify certificate",
    noteTitle: "What this certificate records",
    note: "The certificate records a versioned snapshot of a published CraftID record under its permanent identifier. It does not by itself verify legal identity, professional competence, a qualification, a statutory licence, accreditation, quality, or EU institutional endorsement.",
    snapshot: "A certificate is an issued snapshot. If the profile changes later, the verification page still shows the original issue data and separately shows the current CraftID status.",
    currentCraftId: "CraftID",
    domainWarning: "Important: the verification QR currently uses a temporary technical domain. Do not print certificates for long-term use at scale until the final CraftID production domain is connected.",
  },
  fr: {
    eyebrow: "Certificat du dossier CraftID", titleProfessional: "Certificat du dossier Professional CraftID", titleWorkshop: "Certificat du dossier Workshop CraftID",
    intro: "Émettez un certificat PDF versionné de ce dossier CraftID. Chaque certificat possède son propre Certificate No. et une page publique de vérification.",
    back: "Retour à Mon CraftID", eligible: "Un certificat peut être émis pour un dossier CraftID publié.", notEligible: "Publiez ce CraftID avant d’émettre un certificat.",
    issue: "Émettre le premier certificat", reissue: "Émettre un certificat mis à jour", issued: "Certificat émis.", history: "Historique des certificats", none: "Aucun certificat n’a encore été émis pour ce CraftID.",
    version: "Version", issuedOn: "Émis", status: "Statut", issuedStatus: "Émis", revokedStatus: "Révoqué",
    downloadEn: "Télécharger le PDF (anglais)", downloadUk: "Télécharger le PDF (ukrainien)", verify: "Vérifier le certificat",
    noteTitle: "Ce que ce certificat enregistre",
    note: "Le certificat enregistre un instantané versionné d’un dossier CraftID publié sous son identifiant permanent. À lui seul, il ne vérifie ni l’identité juridique, ni la compétence professionnelle, ni une qualification, licence légale, accréditation, qualité ou approbation institutionnelle de l’UE.",
    snapshot: "Un certificat est un instantané émis. Si le profil change ensuite, la page de vérification conserve les données originales de l’émission et affiche séparément le statut CraftID actuel.",
    currentCraftId: "CraftID",
    domainWarning: "Important : le QR de vérification utilise actuellement un domaine technique temporaire. N’imprimez pas de certificats à grande échelle pour un usage durable avant la connexion du domaine de production final.",
  },
  de: {
    eyebrow: "CraftID-Datensatzzertifikat", titleProfessional: "Zertifikat des Professional CraftID-Datensatzes", titleWorkshop: "Zertifikat des Workshop CraftID-Datensatzes",
    intro: "Stellen Sie ein versioniertes PDF-Zertifikat dieses CraftID-Datensatzes aus. Jedes Zertifikat hat eine eigene Certificate No. und eine öffentliche Prüfseite.",
    back: "Zurück zu Meine CraftID", eligible: "Zertifikate können für veröffentlichte CraftID-Datensätze ausgestellt werden.", notEligible: "Veröffentlichen Sie diese CraftID, bevor Sie ein Zertifikat ausstellen.",
    issue: "Erstes Zertifikat ausstellen", reissue: "Aktualisiertes Zertifikat ausstellen", issued: "Zertifikat ausgestellt.", history: "Zertifikatshistorie", none: "Für diese CraftID wurde noch kein Zertifikat ausgestellt.",
    version: "Version", issuedOn: "Ausgestellt", status: "Status", issuedStatus: "Ausgestellt", revokedStatus: "Widerrufen",
    downloadEn: "PDF herunterladen (Englisch)", downloadUk: "PDF herunterladen (Ukrainisch)", verify: "Zertifikat prüfen",
    noteTitle: "Was dieses Zertifikat festhält",
    note: "Das Zertifikat dokumentiert einen versionierten Snapshot eines veröffentlichten CraftID-Datensatzes unter seiner dauerhaften Kennung. Es bestätigt für sich genommen weder rechtliche Identität noch berufliche Kompetenz, Qualifikation, gesetzliche Lizenz, Akkreditierung, Qualität oder institutionelle EU-Billigung.",
    snapshot: "Ein Zertifikat ist ein ausgestellter Snapshot. Wenn sich das Profil später ändert, zeigt die Prüfseite weiterhin die ursprünglichen Ausgabedaten und separat den aktuellen CraftID-Status.",
    currentCraftId: "CraftID",
    domainWarning: "Wichtig: Der Prüf-QR verwendet derzeit eine temporäre technische Domain. Drucken Sie Zertifikate nicht in größerem Umfang für eine langfristige Nutzung, bevor die endgültige CraftID-Produktionsdomain verbunden ist.",
  },
  nl: {
    eyebrow: "CraftID Record Certificate", titleProfessional: "Certificaat van het Professional CraftID-dossier", titleWorkshop: "Certificaat van het Workshop CraftID-dossier",
    intro: "Geef een versiegebonden PDF-certificaat van dit CraftID-dossier uit. Elk certificaat heeft een eigen Certificate No. en openbare verificatiepagina.",
    back: "Terug naar Mijn CraftID", eligible: "Certificaten kunnen worden uitgegeven voor gepubliceerde CraftID-dossiers.", notEligible: "Publiceer deze CraftID voordat u een certificaat uitgeeft.",
    issue: "Eerste certificaat uitgeven", reissue: "Bijgewerkt certificaat uitgeven", issued: "Certificaat uitgegeven.", history: "Certificaatgeschiedenis", none: "Voor deze CraftID is nog geen certificaat uitgegeven.",
    version: "Versie", issuedOn: "Uitgegeven", status: "Status", issuedStatus: "Uitgegeven", revokedStatus: "Ingetrokken",
    downloadEn: "PDF downloaden (Engels)", downloadUk: "PDF downloaden (Oekraïens)", verify: "Certificaat verifiëren",
    noteTitle: "Wat dit certificaat vastlegt",
    note: "Het certificaat legt een versiegebonden momentopname vast van een gepubliceerd CraftID-dossier onder de permanente identifier. Het verifieert op zichzelf geen juridische identiteit, professionele competentie, kwalificatie, wettelijke licentie, accreditatie, kwaliteit of institutionele EU-goedkeuring.",
    snapshot: "Een certificaat is een uitgegeven momentopname. Als het profiel later wijzigt, blijft de verificatiepagina de oorspronkelijke uitgiftegegevens tonen en daarnaast de actuele CraftID-status.",
    currentCraftId: "CraftID",
    domainWarning: "Belangrijk: de verificatie-QR gebruikt momenteel een tijdelijk technisch domein. Druk certificaten niet op grote schaal voor langdurig gebruik totdat het definitieve CraftID-productiedomein is gekoppeld.",
  },
  pl: {
    eyebrow: "Certyfikat zapisu CraftID", titleProfessional: "Certyfikat zapisu Professional CraftID", titleWorkshop: "Certyfikat zapisu Workshop CraftID",
    intro: "Wydaj wersjonowany certyfikat PDF tego zapisu CraftID. Każdy certyfikat ma własny Certificate No. i publiczną stronę weryfikacji.",
    back: "Wróć do Mój CraftID", eligible: "Certyfikat można wydać dla opublikowanego zapisu CraftID.", notEligible: "Opublikuj ten CraftID przed wydaniem certyfikatu.",
    issue: "Wydaj pierwszy certyfikat", reissue: "Wydaj zaktualizowany certyfikat", issued: "Certyfikat wydany.", history: "Historia certyfikatów", none: "Dla tego CraftID nie wydano jeszcze certyfikatu.",
    version: "Wersja", issuedOn: "Wydano", status: "Status", issuedStatus: "Wydany", revokedStatus: "Unieważniony",
    downloadEn: "Pobierz PDF (angielski)", downloadUk: "Pobierz PDF (ukraiński)", verify: "Zweryfikuj certyfikat",
    noteTitle: "Co dokumentuje ten certyfikat",
    note: "Certyfikat dokumentuje wersjonowany obraz opublikowanego zapisu CraftID pod jego stałym identyfikatorem. Sam w sobie nie weryfikuje tożsamości prawnej, kompetencji zawodowych, kwalifikacji, ustawowej licencji, akredytacji, jakości ani instytucjonalnego poparcia UE.",
    snapshot: "Certyfikat jest wydanym obrazem zapisu. Jeśli profil zmieni się później, strona weryfikacji nadal pokazuje pierwotne dane wydania oraz oddzielnie aktualny status CraftID.",
    currentCraftId: "CraftID",
    domainWarning: "Ważne: kod QR do weryfikacji używa obecnie tymczasowej domeny technicznej. Nie drukuj certyfikatów masowo do długoterminowego użytku przed podłączeniem ostatecznej domeny produkcyjnej CraftID.",
  },
  it: {
    eyebrow: "Certificato del record CraftID", titleProfessional: "Certificato del record Professional CraftID", titleWorkshop: "Certificato del record Workshop CraftID",
    intro: "Emetti un certificato PDF versionato di questo record CraftID. Ogni certificato ha un proprio Certificate No. e una pagina pubblica di verifica.",
    back: "Torna a Il mio CraftID", eligible: "I certificati possono essere emessi per record CraftID pubblicati.", notEligible: "Pubblica questo CraftID prima di emettere un certificato.",
    issue: "Emetti primo certificato", reissue: "Emetti certificato aggiornato", issued: "Certificato emesso.", history: "Storico certificati", none: "Nessun certificato è stato ancora emesso per questo CraftID.",
    version: "Versione", issuedOn: "Emesso", status: "Stato", issuedStatus: "Emesso", revokedStatus: "Revocato",
    downloadEn: "Scarica PDF (inglese)", downloadUk: "Scarica PDF (ucraino)", verify: "Verifica certificato",
    noteTitle: "Che cosa registra questo certificato",
    note: "Il certificato registra un’istantanea versionata di un record CraftID pubblicato sotto il suo identificatore permanente. Da solo non verifica identità legale, competenza professionale, qualifica, licenza prevista dalla legge, accreditamento, qualità o approvazione istituzionale dell’UE.",
    snapshot: "Un certificato è un’istantanea emessa. Se il profilo cambia in seguito, la pagina di verifica continua a mostrare i dati originali di emissione e separatamente lo stato CraftID corrente.",
    currentCraftId: "CraftID",
    domainWarning: "Importante: il QR di verifica utilizza attualmente un dominio tecnico temporaneo. Non stampare certificati in grande quantità per uso a lungo termine finché non sarà collegato il dominio di produzione finale CraftID.",
  },
  es: {
    eyebrow: "Certificado del registro CraftID", titleProfessional: "Certificado del registro Professional CraftID", titleWorkshop: "Certificado del registro Workshop CraftID",
    intro: "Emite un certificado PDF versionado de este registro CraftID. Cada certificado tiene su propio Certificate No. y una página pública de verificación.",
    back: "Volver a Mi CraftID", eligible: "Los certificados pueden emitirse para registros CraftID publicados.", notEligible: "Publica este CraftID antes de emitir un certificado.",
    issue: "Emitir primer certificado", reissue: "Emitir certificado actualizado", issued: "Certificado emitido.", history: "Historial de certificados", none: "Aún no se ha emitido ningún certificado para este CraftID.",
    version: "Versión", issuedOn: "Emitido", status: "Estado", issuedStatus: "Emitido", revokedStatus: "Revocado",
    downloadEn: "Descargar PDF (inglés)", downloadUk: "Descargar PDF (ucraniano)", verify: "Verificar certificado",
    noteTitle: "Qué registra este certificado",
    note: "El certificado registra una instantánea versionada de un registro CraftID publicado bajo su identificador permanente. Por sí solo no verifica identidad jurídica, competencia profesional, cualificación, licencia legal, acreditación, calidad ni respaldo institucional de la UE.",
    snapshot: "Un certificado es una instantánea emitida. Si el perfil cambia después, la página de verificación sigue mostrando los datos originales de emisión y, por separado, el estado actual de CraftID.",
    currentCraftId: "CraftID",
    domainWarning: "Importante: el QR de verificación utiliza actualmente un dominio técnico temporal. No imprimas certificados a gran escala para uso duradero hasta que esté conectado el dominio de producción final de CraftID.",
  },
  uk: {
    eyebrow: "Сертифікат запису CraftID", titleProfessional: "Сертифікат запису Professional CraftID", titleWorkshop: "Сертифікат запису Workshop CraftID",
    intro: "Створюйте версійний PDF-сертифікат цього запису CraftID. Кожен сертифікат має власний номер сертифіката та публічну сторінку перевірки.",
    back: "Назад до Мій CraftID", eligible: "Сертифікат можна випустити для опублікованого запису CraftID.", notEligible: "Спочатку опублікуйте цей CraftID.",
    issue: "Випустити перший сертифікат", reissue: "Випустити оновлений сертифікат", issued: "Сертифікат випущено.", history: "Історія сертифікатів", none: "Для цього CraftID ще не випущено жодного сертифіката.",
    version: "Версія", issuedOn: "Випущено", status: "Статус", issuedStatus: "Чинний випуск", revokedStatus: "Відкликано",
    downloadEn: "Завантажити PDF (англійською)", downloadUk: "Завантажити PDF (українською)", verify: "Перевірити сертифікат",
    noteTitle: "Що фіксує цей сертифікат",
    note: "Сертифікат фіксує версію опублікованого запису CraftID під його постійним ідентифікатором. Він сам по собі не підтверджує юридичну особу, професійну компетентність, кваліфікацію, законодавчу ліцензію, акредитацію, якість чи інституційне схвалення ЄС.",
    snapshot: "Сертифікат є зафіксованим випуском. Якщо профіль зміниться пізніше, сторінка перевірки зберігає первинні дані випуску й окремо показує поточний статус CraftID.",
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
    : localeQuery(locale);

  if (!userId) redirect(`/login${localeQuery(locale)}`);
  if (sp.entity && !entity) {
    redirect(`/my-craftid${localeQuery(locale)}`);
  }
  if (!entity) {
    redirect(`/onboarding${localeQuery(locale)}`);
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
                  (localeQuery(locale));
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
                      <strong>{formatCertificateNumber(
                        entity.craftid_number,
                        entity.craftid_check_digits,
                        certificate.version_no,
                      )}</strong>
                      <span>
                        {t.version} {certificate.version_no}
                      </span>
                    </div>
                    <div>
                      <span>{t.issuedOn}</span>
                      <strong>
                        {new Date(certificate.issued_at).toLocaleDateString(
                          localeMeta[locale].intl,
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
                      {locale === "uk" ? (
                        <a className="button" href={pdfUk}>
                          {t.downloadUk}
                        </a>
                      ) : null}
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
