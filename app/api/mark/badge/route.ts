import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseCraftId } from "@/lib/craftid-format";
import { getSiteUrl } from "@/lib/site-url";
import {
  fetchBinaryAsset,
  fetchQrPng,
  renderRoundStickerSvg,
} from "@/lib/mark-render";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const parsed = parseCraftId(request.nextUrl.searchParams.get("craftId"));
  if (!parsed) return new NextResponse("Invalid CraftID", { status: 400 });

  const supabase = await createClient();
  const { data: publicProfile, error } = await supabase.rpc("public_craftid_profile", {
    p_craftid_number: parsed.number,
    p_check_digits: parsed.check,
  });

  if (error) return new NextResponse("CraftID lookup unavailable", { status: 502 });
  if (!publicProfile) return new NextResponse("Published CraftID not found", { status: 404 });

  const record = publicProfile as { entity_type?: "professional" | "workshop" };
  const entityType = record.entity_type === "workshop" ? "workshop" : "professional";
  const siteUrl = getSiteUrl();
  const profileUrl = new URL("id/" + parsed.formatted, siteUrl).toString();

  try {
    const qrPromise = fetchQrPng(profileUrl, 620, 0);
    const [qr, background, font] =
      entityType === "professional"
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
      craftId: parsed.formatted,
      qrDataUri: qr.dataUri,
      entityType,
      backgroundDataUri: background?.dataUri,
      fontDataUri: font?.dataUri,
    });
    const download = request.nextUrl.searchParams.get("download") === "1";

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="craftid-round-badge-${parsed.formatted}.svg"`,
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    console.error("CraftID public badge generation failed", error);
    return new NextResponse("Badge generation unavailable", { status: 502 });
  }
}
