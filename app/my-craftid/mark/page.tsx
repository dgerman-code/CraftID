/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom } from "@/components/site-shell";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string }> };

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
  },
} as const;

export default async function CraftIdMarkPage({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale];
  const q = locale === "uk" ? "?lang=uk" : "";

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect(`/login${q}`);

  const { data: entity } = await supabase
    .from("craftid_entities")
    .select("id, craftid_number, craftid_check_digits, entity_type, public_status")
    .eq("owner_user_id", userId)
    .limit(1)
    .single();

  if (!entity) redirect(`/onboarding${q}`);

  const profile = entity.entity_type === "professional"
    ? await supabase.from("professional_profiles").select("display_name").eq("entity_id", entity.id).single()
    : await supabase.from("workshop_profiles").select("display_name").eq("entity_id", entity.id).single();

  const craftId = formatCraftId(entity.craftid_number, entity.craftid_check_digits);
  const siteUrl = getSiteUrl();
  const profileUrl = new URL(`id/${craftId}`, siteUrl).toString();
  const badgeUrl = new URL(`api/mark/badge?craftId=${encodeURIComponent(craftId)}`, siteUrl).toString();
  const qrUrl = `/api/mark/qr?craftId=${encodeURIComponent(craftId)}`;
  const embed = `<a href="${profileUrl}" rel="me noopener" target="_blank"><img src="${badgeUrl}" alt="CraftID #${craftId}" width="560" height="120"></a>`;
  const displayName = profile.data?.display_name ?? "CraftID";

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

        <section className="markGrid">
          <article className="markPanel">
            <div className="eyebrow">{t.qr}</div>
            <p>{t.qrText}</p>
            <div className="qrFrame">
              <img src={qrUrl} alt={`QR for CraftID #${craftId}`} width="220" height="220" />
            </div>
            <div className="recordId">CraftID #{craftId}</div>
          </article>

          <article className="markPanel">
            <div className="eyebrow">{t.website}</div>
            <p>{t.websiteText}</p>
            <img className="craftIdBadgePreview" src={badgeUrl} alt={`CraftID #${craftId}`} />
            <div className="markUrlBlock">
              <strong>{t.canonical}</strong>
              <code>{profileUrl}</code>
            </div>
            {entity.public_status === "published" ? <Link className="button" href={`/id/${craftId}${q}`}>{t.openProfile}</Link> : null}
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
            <code>Professional identity: CraftID #{craftId}</code>
          </div>
        </section>
      </div>
    </main>
  );
}
