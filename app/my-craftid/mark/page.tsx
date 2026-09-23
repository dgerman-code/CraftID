/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; entity?: string; origin?: string }> };

function formatCraftId(value: number | string, checkDigits: string) {
  return `${String(value).padStart(8, "0")}-${checkDigits}`;
}

const copy = {
  en: {
    eyebrow: "CraftID Mark",
    title: "Use your CraftID beyond the platform.",
    intro: "Add your CraftID to your website, product cards, workshop signage or printed material. The mark links to your professional identity record; it is not a quality certification.",
    back: "Back to My CraftID",
    qr: "QR for your CraftID",
    qrText: "Use this QR on product cards, packaging, workshop signage and exhibition material.",
    website: "Website badge",
    websiteText: "Embed a compact CraftID badge on your own website.",
    embed: "Embed code",
    print: "Print-ready maker label",
    printText: "Use this layout as a neutral maker identity label. Do not present it as an EU certification or quality seal.",
    canonical: "Canonical profile URL",
    publicWarning: "Your profile is not published yet. The mark can be prepared now, but the public profile will not resolve until publication criteria are met.",
    publicReady: "Your public CraftID profile is available.",
    openProfile: "Open public profile",
    copyHint: "Copy this HTML into your website.",
    physical: "Suggested physical wording",
    downloadQr: "Download QR (PNG)",
    downloadBadge: "Download badge (SVG)",
    downloadLabel: "Download maker label (SVG)",
    origin: "Crafted in country label",
    originText: "Add a country-of-production statement to a CraftID label. This does not create a separate product record.",
    originCountry: "Country wording",
    originPlaceholder: "Belgium",
    originGenerate: "Generate label",
    originDownload: "Download Crafted in label (SVG)",
    originNote: "The country wording is added to the label separately from the CraftID identity. It is not shown as Verified or certified by CraftID.",
    domainWarning: "Important: this is still running on a temporary technical domain. Do not print permanent QR labels at scale until the final CraftID production domain is connected.",
  },
  uk: {
    eyebrow: "CraftID Mark",
    title: "Використовуйте свій CraftID поза платформою.",
    intro: "Додавайте CraftID на свій вебсайт, картки виробів, вивіску майстерні або друковані матеріали. Позначка веде до запису професійної ідентичності й не є сертифікацією якості.",
    back: "Назад до Мій CraftID",
    qr: "QR вашого CraftID",
    qrText: "Використовуйте цей QR на картках виробів, пакуванні, вивісці майстерні та матеріалах виставок.",
    website: "Позначка для вебсайту",
    websiteText: "Додайте компактну позначку CraftID на власний вебсайт.",
    embed: "Код для вставки",
    print: "Макет для друку",
    printText: "Використовуйте цей макет як нейтральну позначку професійної ідентичності. Не подавайте її як сертифікацію ЄС або знак якості.",
    canonical: "Канонічна адреса профілю",
    publicWarning: "Ваш профіль ще не опублікований. Позначку можна підготувати вже зараз, але публічний профіль відкриється лише після виконання критеріїв публікації.",
    publicReady: "Ваш публічний профіль CraftID доступний.",
    openProfile: "Відкрити публічний профіль",
    copyHint: "Скопіюйте цей HTML у свій вебсайт.",
    physical: "Рекомендований текст на виробі",
    downloadQr: "Завантажити QR (PNG)",
    downloadBadge: "Завантажити badge (SVG)",
    downloadLabel: "Завантажити макет (SVG)",
    origin: "Лейбл Crafted in [Country]",
    originText: "Додайте до CraftID-лейбла зазначення країни виготовлення. Це не створює окремий запис виробу.",
    originCountry: "Назва країни",
    originPlaceholder: "Belgium",
    originGenerate: "Створити лейбл",
    originDownload: "Завантажити Crafted in лейбл (SVG)",
    originNote: "Назва країни додається до лейбла окремо від професійної ідентичності CraftID. Вона не позначається як Verified або сертифікована CraftID.",
    domainWarning: "Важливо: зараз CraftID ще працює на тимчасовому технічному домені. Не друкуйте постійні QR-етикетки масово, доки не буде підключено фінальний production-домен CraftID.",
  },
} as const;

export default async function CraftIdMarkPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const { supabase, userId, entity } = await getOwnedCraftId(sp.entity);
  const q = entity ? ownerWorkspaceQuery(locale, entity.id) : locale === "uk" ? "?lang=uk" : "";
  if (!userId) redirect(locale === "uk" ? "/login?lang=uk" : "/login");
  if (sp.entity && !entity) redirect(locale === "uk" ? "/my-craftid?lang=uk" : "/my-craftid");
  if (!entity) redirect(locale === "uk" ? "/onboarding?lang=uk" : "/onboarding");

  const profile = entity.entity_type === "professional"
    ? await supabase.from("professional_profiles").select("display_name, country_code").eq("entity_id", entity.id).single()
    : await supabase.from("workshop_profiles").select("display_name, country_code").eq("entity_id", entity.id).single();

  const craftId = formatCraftId(entity.craftid_number, entity.craftid_check_digits);
  const siteUrl = getSiteUrl();
  const profileUrl = new URL(`id/${craftId}`, siteUrl).toString();
  const badgeUrl = new URL(`api/mark/badge?craftId=${encodeURIComponent(craftId)}`, siteUrl).toString();
  const qrUrl = `/api/mark/qr?craftId=${encodeURIComponent(craftId)}`;
  const qrDownloadUrl = `${qrUrl}&download=1`;
  const badgeDownloadUrl = `/api/mark/badge?craftId=${encodeURIComponent(craftId)}&download=1`;
  const labelDownloadUrl = `/api/mark/label?craftId=${encodeURIComponent(craftId)}`;
  const isTemporaryDomain = siteUrl.includes("vercel.app") || siteUrl.includes("localhost");
  const embed = `<a href="${profileUrl}" rel="me noopener" target="_blank"><img src="${badgeUrl}" alt="CraftID #${craftId}" width="560" height="120"></a>`;
  const displayName = profile.data?.display_name ?? "CraftID";
  const displayNames = new Intl.DisplayNames([locale === "uk" ? "uk" : "en"], { type: "region" });
  const defaultOrigin = profile.data?.country_code
    ? displayNames.of(profile.data.country_code) ?? profile.data.country_code
    : "";
  const origin = (sp.origin ?? "").trim().replace(/\s+/g, " ").slice(0, 64);
  const originLabelUrl = origin
    ? `/api/mark/origin-label?craftId=${encodeURIComponent(craftId)}&origin=${encodeURIComponent(origin)}`
    : "";

  return (
    <main className="workspacePage markWorkspace">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={`/my-craftid${q}`}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="workspaceIntro">{t.intro}</p>

        <p className={entity.public_status === "published" ? "formMessage" : "privacyNote"}>
          {entity.public_status === "published" ? t.publicReady : t.publicWarning}
        </p>
        {isTemporaryDomain ? <p className="privacyNote markDomainWarning">{t.domainWarning}</p> : null}

        <section className="markGrid">
          <article className="markPanel">
            <div className="eyebrow">{t.qr}</div>
            <p>{t.qrText}</p>
            <div className="qrFrame">
              <img src={qrUrl} alt={`QR for CraftID #${craftId}`} width="220" height="220" />
            </div>
            <div className="recordId">CraftID #{craftId}</div>
            <a className="button markAssetButton" href={qrDownloadUrl}>{t.downloadQr}</a>
          </article>

          <article className="markPanel">
            <div className="eyebrow">{t.website}</div>
            <p>{t.websiteText}</p>
            <img className="craftIdBadgePreview" src={badgeUrl} alt={`CraftID #${craftId}`} />
            <div className="markUrlBlock">
              <strong>{t.canonical}</strong>
              <code>{profileUrl}</code>
            </div>
            <div className="markButtonRow">
              <a className="button" href={badgeDownloadUrl}>{t.downloadBadge}</a>
              {entity.public_status === "published" ? <Link className="button" href={`/id/${craftId}${locale === "uk" ? "?lang=uk" : ""}`}>{t.openProfile}</Link> : null}
            </div>
          </article>
        </section>

        <section className="markCodeSection">
          <div className="eyebrow">{t.embed}</div>
          <p className="fieldHelp">{t.copyHint}</p>
          <textarea className="embedCode" readOnly rows={5} value={embed} />
        </section>

        <section className="printLabelSection">
          <div className="eyebrow">{t.print}</div>
          <p className="fieldHelp">{t.printText}</p>
          <div className="printLabel">
            <div>
              <strong>CraftID</strong>
              <span>#{craftId}</span>
              <small>{displayName}</small>
            </div>
            <img src={qrUrl} alt="" width="128" height="128" />
          </div>
          <div className="markPhysicalText">
            <div className="eyebrow">{t.physical}</div>
            <code>{entity.entity_type === "professional" ? "Professional" : "Workshop"} identity: CraftID #{craftId}</code>
          </div>
          <a className="button markAssetButton" href={labelDownloadUrl}>{t.downloadLabel}</a>
        </section>

        <section className="originLabelSection">
          <div className="eyebrow">{t.origin}</div>
          <h2>{t.origin}</h2>
          <p className="fieldHelp">{t.originText}</p>

          <form className="originLabelForm" action="/my-craftid/mark" method="get">
            {locale === "uk" ? <input type="hidden" name="lang" value="uk" /> : null}
            <input type="hidden" name="entity" value={entity.id} />
            <label>
              {t.originCountry}
              <input
                name="origin"
                defaultValue={origin || defaultOrigin}
                placeholder={t.originPlaceholder}
                maxLength={64}
                required
              />
            </label>
            <button className="button buttonPrimary" type="submit">{t.originGenerate}</button>
          </form>

          <p className="privacyNote">{t.originNote}</p>

          {origin ? (
            <div className="originLabelResult">
              <img
                className="originLabelPreview"
                src={originLabelUrl}
                alt={`CraftID Crafted in ${origin} label`}
              />
              <a className="button markAssetButton" href={originLabelUrl + "&download=1"}>
                {t.originDownload}
              </a>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
