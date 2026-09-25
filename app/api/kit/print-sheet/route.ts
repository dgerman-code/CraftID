import { NextRequest, NextResponse } from "next/server";
import { getOwnedDownloadKitEntity } from "@/lib/download-kit";
import {
  fetchBinaryAsset,
  fetchQrPng,
  renderPrintSheetPdf,
} from "@/lib/mark-render";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const entityId = request.nextUrl.searchParams.get("entity") ?? "";
  const result = await getOwnedDownloadKitEntity(entityId);

  if (result.status === 401) return new NextResponse("Authentication required", { status: 401 });
  if (result.status === 400) return new NextResponse("Entity is required", { status: 400 });
  if (result.status !== 200 || !result.entity) return new NextResponse("CraftID entity not found", { status: 404 });

  try {
    const siteUrl = getSiteUrl();
    const qrPromise = fetchQrPng(result.entity.profileUrl, 620, 0);

    const [qr, background, font] =
      result.entity.entityType === "professional"
        ? await Promise.all([
            qrPromise,
            fetchBinaryAsset(
              new URL("/templates/craftid-sticker-original-bg.jpg", siteUrl).toString(),
              "Sticker template",
            ),
            fetchBinaryAsset(
              new URL("/templates/cid-sans-500.ttf", siteUrl).toString(),
              "Sticker font",
            ),
          ])
        : [await qrPromise, null, null];

    const pdf = await renderPrintSheetPdf({
      craftId: result.entity.craftId,
      qrPng: qr.bytes,
      entityType: result.entity.entityType,
      backgroundJpeg: background?.bytes,
      mediumFontBytes: font?.bytes,
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="craftid-print-sheet-${result.entity.craftId}.pdf"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    console.error("CraftID print sheet generation failed", error);
    return new NextResponse("Print sheet generation unavailable", { status: 502 });
  }
}
