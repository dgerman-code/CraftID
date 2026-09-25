/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { getSiteUrl } from "@/lib/site-url";
import { formatCraftId } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; entity?: string }> };

const copy = {
  en: {
    eyebrow: "CraftID Download Kit",
    title: "Download the materials for this CraftID.",
    intro:
      "Every file is generated for the selected Professional or Workshop record. The QR code in ordinary CraftID assets points to that record's unique public profile.",
    back: "Back to My CraftID",
    publicWarning:
      "This CraftID is not published yet. You can prepare owner-only files, but the public profile and website badge will not resolve until the record is published.",
    publicReady: "The public CraftID profile is available.",
    profile: "Public profile",
    openProfile: "Open public profile",
    rule:
      "Ordinary CraftID assets contain the CraftID identifier and QR only. Certificate No. is used only on an issued certificate.",
    sticker: "Round Sticker / Seal",
    stickerText:
      "For packaging, workshop doors, product presentation and printed materials.",
    downloadSticker: "Download Round Sticker (SVG)",
    printSheet: "Print Sheet",
    printSheetText:
      "A4 sheet with multiple Round Sticker / Seal marks ready for printing.",
    downloadPrintSheet: "Download Print Sheet (PDF)",
    website: "Website Embed Badge",
    websiteText:
      "The website badge uses the same Round Sticker / Seal design and links to the public profile.",
    embed: "Embed code",
    copyHint: "Copy this HTML into your website.",
    certificate: "Certificate",
    certificateText:
      "Certificates are versioned documents. Certificate No. appears only on the certificate. On the approved Professional certificate, the QR opens the corresponding public CraftID profile.",
    manageCertificate: "Open Certificate area",
    domainWarning:
      "The final QR target is craftid.eu. Do not mass-print permanent materials from a preview deployment.",
  },
  uk: {
    eyebrow: "CraftID Download Kit",
    title: "Завантажте матеріали для цього CraftID.",
    intro:
      "Кожен файл генерується для вибраного запису Professional або Workshop. QR-код у звичайних матеріалах CraftID веде на унікальний публічний профіль саме цього запису.",
    back: "Назад до Мій CraftID",
    publicWarning:
      "Цей CraftID ще не опубліковано. Власник може підготувати файли, але публічний профіль і website badge запрацюють лише після публікації запису.",
    publicReady: "Публічний профіль CraftID доступний.",
    profile: "Публічний профіль",
    openProfile: "Відкрити публічний профіль",
    rule:
      "Звичайні матеріали CraftID містять тільки ідентифікатор CraftID і QR. Certificate No. використовується лише на випущеному сертифікаті.",
    sticker: "Round Sticker / Seal",
    stickerText:
      "Для пакування, дверей майстерні, презентації виробів і друкованих матеріалів.",
    downloadSticker: "Завантажити Round Sticker (SVG)",
    printSheet: "Print Sheet",
    printSheetText:
      "Аркуш A4 з кількома Round Sticker / Seal для друку.",
    downloadPrintSheet: "Завантажити Print Sheet (PDF)",
    website: "Website Embed Badge",
    websiteText:
      "Website badge використовує той самий дизайн Round Sticker / Seal і веде на публічний профіль.",
    embed: "Код для вставки",
    copyHint: "Скопіюйте цей HTML-код на свій вебсайт.",
    certificate: "Certificate",
    certificateText:
      "Сертифікати є версійними документами. Certificate No. вказується тільки на сертифікаті. У затвердженому сертифікаті Professional QR веде на відповідний публічний профіль CraftID.",
    manageCertificate: "Відкрити розділ Certificate",
    domainWarning:
      "Фінальна QR-адреса — craftid.eu. Не запускайте масовий друк постійних матеріалів із preview deployment.",
  },
} as const;

export default async function CraftIdMarkPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const { userId, entity } = await getOwnedCraftId(sp.entity);

  if (!userId) redirect(locale === "uk" ? "/login?lang=uk" : "/login");
  if (sp.entity && !entity) redirect(locale === "uk" ? "/my-craftid?lang=uk" : "/my-craftid");
  if (!entity) redirect(locale === "uk" ? "/onboarding?lang=uk" : "/onboarding");

  const q = ownerWorkspaceQuery(locale, entity.id);
  const craftId = formatCraftId(entity.craftid_number, entity.craftid_check_digits);
  const siteUrl = getSiteUrl();
  const profileUrl = new URL("id/" + craftId, siteUrl).toString();

  const stickerPreview = `/api/kit/sticker?entity=${encodeURIComponent(entity.id)}`;
  const stickerDownload = stickerPreview + "&download=1";
  const printSheetDownload = `/api/kit/print-sheet?entity=${encodeURIComponent(entity.id)}`;

  const publicBadgeUrl = new URL(
    "api/mark/badge?craftId=" + encodeURIComponent(craftId),
    siteUrl,
  ).toString();

  const embed = `<a href="${profileUrl}" rel="me noopener" target="_blank"><img src="${publicBadgeUrl}" alt="CraftID #${craftId}" width="180" height="180"></a>`;

  const isTemporaryDomain =
    siteUrl.includes("vercel.app") || siteUrl.includes("localhost");

  return (
    <main className="workspacePage markWorkspace">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={"/my-craftid" + q}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="workspaceIntro">{t.intro}</p>

        <p className={entity.public_status === "published" ? "formMessage" : "privacyNote"}>
          {entity.public_status === "published" ? t.publicReady : t.publicWarning}
        </p>
        <p className="privacyNote">{t.rule}</p>
        {isTemporaryDomain ? <p className="privacyNote markDomainWarning">{t.domainWarning}</p> : null}

        <section className="markCodeSection">
          <div className="eyebrow">{t.profile}</div>
          <code>{profileUrl}</code>
          {entity.public_status === "published" ? (
            <div className="markButtonRow">
              <Link
                className="button"
                href={`/id/${craftId}${locale === "uk" ? "?lang=uk" : ""}`}
              >
                {t.openProfile}
              </Link>
            </div>
          ) : null}
        </section>

        <section className="markGrid">
          <article className="markPanel">
            <div className="eyebrow">{t.sticker}</div>
            <p>{t.stickerText}</p>
            <img
              className="craftIdBadgePreview"
              src={stickerPreview}
              alt={`CraftID #${craftId} round sticker`}
            />
            <a className="button markAssetButton" href={stickerDownload}>
              {t.downloadSticker}
            </a>
          </article>

          <article className="markPanel">
            <div className="eyebrow">{t.printSheet}</div>
            <p>{t.printSheetText}</p>
            <a className="button markAssetButton" href={printSheetDownload}>
              {t.downloadPrintSheet}
            </a>
          </article>

          <article className="markPanel">
            <div className="eyebrow">{t.certificate}</div>
            <p>{t.certificateText}</p>
            <Link className="button markAssetButton" href={"/my-craftid/certificate" + q}>
              {t.manageCertificate}
            </Link>
          </article>
        </section>

        <section className="markCodeSection">
          <div className="eyebrow">{t.website}</div>
          <p className="fieldHelp">{t.websiteText}</p>
          {entity.public_status === "published" ? (
            <>
              <img
                className="craftIdBadgePreview"
                src={publicBadgeUrl}
                alt={`CraftID #${craftId}`}
              />
              <div className="eyebrow">{t.embed}</div>
              <p className="fieldHelp">{t.copyHint}</p>
              <textarea className="embedCode" readOnly rows={5} value={embed} />
            </>
          ) : (
            <p className="privacyNote">{t.publicWarning}</p>
          )}
        </section>
      </div>
    </main>
  );
}
