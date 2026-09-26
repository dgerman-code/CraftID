import { NextRequest, NextResponse } from "next/server";
import { getOwnedDownloadKitEntity } from "@/lib/download-kit";
import {
  countryNameFromCode,
  fetchBinaryAsset,
  fetchCraftedInTemplateSvg,
  fetchQrPng,
  renderCraftedInMarkPngSvg,
  renderCraftedInPrintSheetPdf,
} from "@/lib/mark-render";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const entityId = request.nextUrl.searchParams.get("entity") ?? "";
  const result = await getOwnedDownloadKitEntity(entityId);

  if (result.status === 401) {
    return new NextResponse("Authentication required", { status: 401 });
  }
  if (result.status === 400) {
    return new NextResponse("Entity is required", { status: 400 });
  }
  if (result.status !== 200 || !result.entity) {
    return new NextResponse("CraftID entity not found", { status: 404 });
  }

  const countryCode = result.entity.countryCode?.trim().toUpperCase() ?? "";
  const country = countryNameFromCode(countryCode);
  if (!country) {
    return new NextResponse("CraftID country is required", { status: 422 });
  }

  try {
    const assetOrigin = request.nextUrl.origin;
    const [templateSvg, qr, mediumFont, regularFont] = await Promise.all([
      fetchCraftedInTemplateSvg(assetOrigin),
      fetchQrPng(result.entity.profileUrl, 620, 0),
      fetchBinaryAsset(
        new URL("/templates/cid-sans-500.ttf", assetOrigin).toString(),
        "Crafted in medium TTF",
      ),
      fetchBinaryAsset(
        new URL("/templates/cid-sans-400.ttf", assetOrigin).toString(),
        "Crafted in regular TTF",
      ),
    ]);

    const markSvg = renderCraftedInMarkPngSvg({
      templateSvg,
      country,
      craftId: result.entity.craftId,
      qrDataUri: qr.dataUri,
      mediumFontBytes: mediumFont.bytes,
      regularFontBytes: regularFont.bytes,
    });

    const pdf = await renderCraftedInPrintSheetPdf(markSvg);
    const safeCountry = countryCode || "country";

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="craftid-crafted-in-print-sheet-${safeCountry}-${result.entity.craftId}.pdf"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    console.error("CraftID Crafted in print sheet generation failed", error);
    return new NextResponse("Crafted in print sheet generation unavailable", {
      status: 502,
    });
  }
}
