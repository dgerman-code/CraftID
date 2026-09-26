import { NextRequest, NextResponse } from "next/server";
import { getOwnedDownloadKitEntity } from "@/lib/download-kit";
import {
  countryNameFromCode,
  fetchBinaryAsset,
  fetchCraftedInTemplateSvg,
  fetchQrPng,
  renderCraftedInMarkSvg,
  renderSvgToPng,
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
  if (result.entity.entityType !== "workshop") {
    return new NextResponse("Crafted in Mark is available for Workshop CraftID only", {
      status: 403,
    });
  }

  const countryCode = result.entity.countryCode?.trim().toUpperCase() ?? "";
  const country = countryNameFromCode(countryCode);
  if (!country) {
    return new NextResponse("Workshop country is required", { status: 422 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "svg";
  if (format !== "svg" && format !== "png") {
    return new NextResponse("Unsupported format", { status: 400 });
  }

  try {
    const assetOrigin = request.nextUrl.origin;
    const [templateSvg, qr, mediumFont, regularFont] = await Promise.all([
      fetchCraftedInTemplateSvg(assetOrigin),
      fetchQrPng(result.entity.profileUrl, 620, 0),
      fetchBinaryAsset(
        new URL("/templates/cid-sans-500.woff2", assetOrigin).toString(),
        "Crafted in medium font",
      ),
      fetchBinaryAsset(
        new URL("/templates/cid-sans-400.woff2", assetOrigin).toString(),
        "Crafted in regular font",
      ),
    ]);

    const svg = renderCraftedInMarkSvg({
      templateSvg,
      country,
      craftId: result.entity.craftId,
      qrDataUri: qr.dataUri,
      mediumFontDataUri: mediumFont.dataUri,
      regularFontDataUri: regularFont.dataUri,
    });

    const download = request.nextUrl.searchParams.get("download") === "1";
    const safeCountry = countryCode || "country";
    const baseName = `craftid-crafted-in-${safeCountry}-${result.entity.craftId}`;

    if (format === "png") {
      const png = await renderSvgToPng(svg);
      return new NextResponse(Buffer.from(png), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${baseName}.png"`,
          "Cache-Control": "private, max-age=0, must-revalidate",
          "X-Robots-Tag": "noindex",
        },
      });
    }

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${baseName}.svg"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    console.error("CraftID Crafted in Mark generation failed", error);
    return new NextResponse("Crafted in Mark generation unavailable", {
      status: 502,
    });
  }
}
