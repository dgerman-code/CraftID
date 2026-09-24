/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { getSiteUrl } from "@/lib/site-url";
import { formatCraftId } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ lang?: string; entity?: string }>;
};

const copy = {
  en: {
    eyebrow: "CraftID Download Kit",
    title: "Your CraftID materials.",
    intro:
      "Download and use the core CraftID materials for this identity record. Every QR used in the mark assets resolves to this CraftID's permanent public profile.",
    back: "Back to My CraftID",
    certificate: "Certificate",
    certificateText:
      "Issue and download the A4 CraftID certificate for this Professional or Workshop record.",
    openCertificate: "Open certificates",
    sticker: "Round Sticker / Seal",
    stickerText:
      "Use the CraftID seal on packaging, workshop signage and printed materials. Only the CraftID number and QR change for each record.",
    downloadSticker: "Download sticker (SVG)",
    qr: "QR Label",
    qrText:
      "A clean QR label that resolves directly to this CraftID's permanent public profile.",
    downloadQrPng: "Download QR (PNG)",
    downloadQrSvg: "Download QR (SVG)",
    printSheet: "Print Sheet",
    printSheetText:
      "A4 print layout made from the same Round Sticker / Seal. The current sheet contains 12 stickers at 50 mm.",
    openPrintSheet: "Open A4 print sheet",
    website: "Website Embed Badge",
    websiteText:
      "Use the same Round Sticker / Seal as a clickable badge on your website.",
    embed: "Embed code",
    copyHint: "Copy this HTML into your website.",
    canonical: "Permanent profile URL",
    publicWarning:
      "Your profile is not published yet. Assets can be prepared now, but their QR target will only be publicly available after publication.",
    publicReady: "Your public CraftID profile is available.",
    openProfile: "Open public profile",
    domainWarning:
      "Important: this is still running on a temporary technical domain. Do not print permanent QR materials at scale until the final CraftID production domain is connected.",
  },
  uk: {
    eyebrow: "CraftID Download Kit",
    title: "Ваші матеріали CraftID.",
    intro:
      "Завантажуйте та використовуйте основні матеріали CraftID для цього запису. Кожен QR у маркуванні веде на постійну публічну сторінку саме цього CraftID.",
    back: "Назад до Мій CraftID",
    certificate: "Сертифікат",
    certificateText:
      "Випустіть і завантажте A4-сертифікат CraftID для запису Professional або Workshop.",
    openCertificate: "Відкрити сертифікати",
    sticker: "Round Sticker / Seal",
    stickerText:
      "Використовуйте круглий знак CraftID на пакуванні, вивісці майстерні та друкованих матеріалах. Для кожного запису змінюються лише номер CraftID і QR.",
    downloadSticker: "Завантажити sticker (SVG)",
    qr: "QR Label",
    qrText:
      "Чистий QR-лейбл, що веде безпосередньо на постійну публічну сторінку цього CraftID.",
    downloadQrPng: "Завантажити QR (PNG)",
    downloadQrSvg: "Завантажити QR (SVG)",
    printSheet: "Print Sheet",
    printSheetText:
      "A4-макет для друку з того самого Round Sticker / Seal. Поточний аркуш містить 12 стікерів по 50 мм.",
    openPrintSheet: "Відкрити A4 print sheet",
    website: "Website Embed Badge",
    websiteText:
      "Використовуйте той самий Round Sticker / Seal як клікабельний badge на своєму вебсайті.",
    embed: "Код для вставки",
    copyHint: "Скопіюйте цей HTML у свій вебсайт.",
    canonical: "Постійна адреса профілю",
    publicWarning:
      "Ваш профіль ще не опублікований. Матеріали можна підготувати вже зараз, але QR стане публічно доступним лише після публікації профілю.",
    publicReady: "Ваш публічний профіль CraftID доступний.",
    openProfile: "Відкрити публічний профіль",
    domainWarning:
      "Важливо: зараз CraftID ще працює на тимчасовому технічному домені. Не друкуйте постійні QR-матеріали масово, доки не буде підключено фінальний production-домен CraftID.",
  },
} as const;

export default async function CraftIdMarkPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const { userId, entity } = await getOwnedCraftId(sp.entity);
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

  const craftId = formatCraftId(
    entity.craftid_number,
    entity.craftid_check_digits,
  );
  const siteUrl = getSiteUrl();
  const profileUrl = new URL(`id/${craftId}`, siteUrl).toString();

  const stickerPath = `/api/mark/sticker?craftId=${encodeURIComponent(craftId)}`;
  const stickerDownloadUrl = stickerPath + "&download=1";
  const stickerEmbedUrl = new URL(
    `api/mark/sticker?craftId=${encodeURIComponent(craftId)}`,
    siteUrl,
  ).toString();

  const qrPath = `/api/mark/qr?craftId=${encodeURIComponent(craftId)}`;
  const qrPngDownload = qrPath + "&format=png&download=1";
  const qrSvgDownload = qrPath + "&format=svg&download=1";

  const embed =
    `<a href="${profileUrl}" rel="me noopener" target="_blank">` +
    `<img src="${stickerEmbedUrl}" alt="CraftID #${craftId}" width="220" height="220">` +
    `</a>`;

  const isTemporaryDomain =
    siteUrl.includes("vercel.app") || siteUrl.includes("localhost");

  return (
    <main className="workspacePage markWorkspace">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={`/my-craftid${q}`}>
          ← {t.back}
        </Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="workspaceIntro">{t.intro}</p>

        <p
          className={
            entity.public_status === "published"
              ? "formMessage"
              : "privacyNote"
          }
        >
          {entity.public_status === "published"
            ? t.publicReady
            : t.publicWarning}
        </p>

        {isTemporaryDomain ? (
          <p className="privacyNote markDomainWarning">{t.domainWarning}</p>
        ) : null}

        <section className="downloadKitGrid">
          <article className="downloadKitCard">
            <div className="eyebrow">{t.certificate}</div>
            <h2>{t.certificate}</h2>
            <p>{t.certificateText}</p>
            <Link className="button markAssetButton" href={`/my-craftid/certificate${q}`}>
              {t.openCertificate}
            </Link>
          </article>

          <article className="downloadKitCard">
            <div className="eyebrow">{t.sticker}</div>
            <h2>{t.sticker}</h2>
            <p>{t.stickerText}</p>
            <img
              className="roundStickerPreview"
              src={stickerPath}
              alt={`CraftID #${craftId} round sticker`}
            />
            <a className="button markAssetButton" href={stickerDownloadUrl}>
              {t.downloadSticker}
            </a>
          </article>

          <article className="downloadKitCard">
            <div className="eyebrow">{t.qr}</div>
            <h2>{t.qr}</h2>
            <p>{t.qrText}</p>
            <div className="qrFrame">
              <img
                src={qrPath + "&format=svg"}
                alt={`QR for CraftID #${craftId}`}
                width="220"
                height="220"
              />
            </div>
            <div className="recordId">CraftID #{craftId}</div>
            <div className="markButtonRow">
              <a className="button" href={qrPngDownload}>
                {t.downloadQrPng}
              </a>
              <a className="button" href={qrSvgDownload}>
                {t.downloadQrSvg}
              </a>
            </div>
          </article>

          <article className="downloadKitCard">
            <div className="eyebrow">{t.printSheet}</div>
            <h2>{t.printSheet}</h2>
            <p>{t.printSheetText}</p>
            <div className="printSheetMiniPreview" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <img src={stickerPath} alt="" key={index} />
              ))}
            </div>
            <Link
              className="button markAssetButton"
              href={`/my-craftid/mark/print${q}`}
            >
              {t.openPrintSheet}
            </Link>
          </article>

          <article className="downloadKitCard downloadKitCardWide">
            <div className="eyebrow">{t.website}</div>
            <h2>{t.website}</h2>
            <p>{t.websiteText}</p>
            <div className="websiteBadgeLayout">
              <img
                className="roundStickerPreview"
                src={stickerPath}
                alt={`CraftID #${craftId} website badge`}
              />
              <div className="markUrlBlock">
                <strong>{t.canonical}</strong>
                <code>{profileUrl}</code>
                {entity.public_status === "published" ? (
                  <Link
                    className="button"
                    href={`/id/${craftId}${locale === "uk" ? "?lang=uk" : ""}`}
                  >
                    {t.openProfile}
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="markCodeSection">
              <div className="eyebrow">{t.embed}</div>
              <p className="fieldHelp">{t.copyHint}</p>
              <textarea
                className="embedCode"
                readOnly
                rows={5}
                value={embed}
              />
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
