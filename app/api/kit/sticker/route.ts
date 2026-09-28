import { NextRequest, NextResponse } from "next/server";
import { getOwnedDownloadKitEntity } from "@/lib/download-kit";
import {
  fetchBinaryAsset,
  fetchQrPng,
  renderRoundStickerPngSvg,
  renderRoundStickerSvg,
  renderSvgToPng,
} from "@/lib/mark-render";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const entityId = request.nextUrl.searchParams.get("entity") ?? "";
  const result = await getOwnedDownloadKitEntity(entityId);

  if (result.status === 401) return new NextResponse("Authentication required", { status: 401 });
  if (result.status === 400) return new NextResponse("Entity is required", { status: 400 });
  if (result.status !== 200 || !result.entity) return new NextResponse("CraftID entity not found", { status: 404 });

  const format = (request.nextUrl.searchParams.get("format") ?? "svg").toLowerCase();
  if (format !== "svg" && format !== "png") {
    return new NextResponse("Unsupported sticker format", { status: 400 });
  }

  try {
    const assetOrigin = request.nextUrl.origin;
    const qr = await fetchQrPng(result.entity.profileUrl, 620, 0);

    if (format === "png") {
      const [background, mediumFont] = await Promise.all([
        fetchBinaryAsset(
          new URL("/templates/craftid-sticker-original-bg.jpg", assetOrigin).toString(),
          "Sticker template",
        ),
        fetchBinaryAsset(
          new URL("/templates/cid-sans-500.ttf", assetOrigin).toString(),
          "Sticker font",
        ),
      ]);

      const pngSvg = renderRoundStickerPngSvg({
        craftId: result.entity.craftId,
        qrDataUri: qr.dataUri,
        entityType: result.entity.entityType,
        backgroundDataUri: background?.dataUri,
        mediumFontBytes: mediumFont?.bytes,
      });
      const png = await renderSvgToPng(pngSvg);

      return new NextResponse(Buffer.from(png), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="craftid-round-sticker-${result.entity.craftId}.png"`,
          "Cache-Control": "private, max-age=0, must-revalidate",
          "X-Robots-Tag": "noindex",
        },
      });
    }

    const [background, font] = await Promise.all([
      fetchBinaryAsset(
        new URL("/templates/craftid-sticker-original-bg.jpg", assetOrigin).toString(),
        "Sticker template",
      ),
      fetchBinaryAsset(
        new URL("/templates/cid-sans-500.woff2", assetOrigin).toString(),
        "Sticker font",
      ),
    ]);

    const svg = renderRoundStickerSvg({
      craftId: result.entity.craftId,
      qrDataUri: qr.dataUri,
      entityType: result.entity.entityType,
      backgroundDataUri: background?.dataUri,
      fontDataUri: font?.dataUri,
    });

    const download = request.nextUrl.searchParams.get("download") === "1";

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="craftid-round-sticker-${result.entity.craftId}.svg"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    console.error("CraftID sticker generation failed", error);
    return new NextResponse("Sticker generation unavailable", { status: 502 });
  }
}
