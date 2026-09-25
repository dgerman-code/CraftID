import { NextRequest, NextResponse } from "next/server";
import { getOwnedDownloadKitEntity } from "@/lib/download-kit";
import {
  fetchBinaryAsset,
  fetchQrPng,
  renderRoundStickerSvg,
} from "@/lib/mark-render";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const entityId = request.nextUrl.searchParams.get("entity") ?? "";
  const result = await getOwnedDownloadKitEntity(entityId);

  if (result.status === 401) return new NextResponse("Authentication required", { status: 401 });
  if (result.status === 400) return new NextResponse("Entity is required", { status: 400 });
  if (result.status !== 200 || !result.entity) return new NextResponse("CraftID entity not found", { status: 404 });

  try {
    const assetOrigin = request.nextUrl.origin;
    const qrPromise = fetchQrPng(result.entity.profileUrl, 620, 0);

    const [qr, background, font] =
      result.entity.entityType === "professional"
        ? await Promise.all([
            qrPromise,
            fetchBinaryAsset(
              new URL("/templates/craftid-sticker-original-bg.jpg", assetOrigin).toString(),
              "Sticker template",
            ),
            fetchBinaryAsset(
              new URL("/templates/cid-sans-500.woff2", assetOrigin).toString(),
              "Sticker font",
            ),
          ])
        : [await qrPromise, null, null];

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
