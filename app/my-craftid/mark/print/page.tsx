import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { formatCraftId } from "@/lib/craftid-format";
import PrintSheetClient from "./print-sheet-client";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ lang?: string; entity?: string }>;
};

const copy = {
  en: {
    eyebrow: "CraftID Print Sheet",
    title: "Round Sticker / Seal — A4",
    intro:
      "This print sheet repeats the same dynamic Round Sticker / Seal for the selected CraftID. Print at 100% scale or save as PDF from the browser print dialog.",
    back: "Back to Download Kit",
    print: "Print / Save as PDF",
    sheet: "12 stickers · 50 mm · A4 portrait",
  },
  uk: {
    eyebrow: "CraftID Print Sheet",
    title: "Round Sticker / Seal — A4",
    intro:
      "Цей аркуш повторює той самий динамічний Round Sticker / Seal для вибраного CraftID. Друкуйте у масштабі 100% або збережіть як PDF через діалог друку браузера.",
    back: "Назад до Download Kit",
    print: "Друк / Зберегти як PDF",
    sheet: "12 стікерів · 50 мм · A4 portrait",
  },
} as const;

export default async function CraftIdPrintSheetPage({ searchParams }: Props) {
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
  const stickerUrl = `/api/mark/sticker?craftId=${encodeURIComponent(craftId)}`;

  return (
    <main className="workspacePage printSheetPage">
      <div className="container workspaceNarrow">
        <div className="printSheetChrome">
          <Link className="backLink" href={`/my-craftid/mark${q}`}>
            ← {t.back}
          </Link>
          <div className="eyebrow">{t.eyebrow}</div>
          <h1>{t.title}</h1>
          <p className="workspaceIntro">{t.intro}</p>
        </div>

        <PrintSheetClient
          craftId={craftId}
          stickerUrl={stickerUrl}
          printLabel={t.print}
          sheetLabel={t.sheet}
        />
      </div>
    </main>
  );
}
