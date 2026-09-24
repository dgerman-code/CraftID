import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";
import { parseCraftId } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const craftId = parseCraftId(request.nextUrl.searchParams.get("craftId"));
  if (!craftId) return new NextResponse("Invalid CraftID", { status: 400 });

  const target = new URL(`id/${craftId.formatted}`, getSiteUrl()).toString();
  const format =
    request.nextUrl.searchParams.get("format") === "svg" ? "svg" : "png";

  const endpoint = new URL("https://quickchart.io/qr");
  endpoint.searchParams.set("text", target);
  endpoint.searchParams.set("size", "420");
  endpoint.searchParams.set("margin", "1");
  endpoint.searchParams.set("ecLevel", "M");
  endpoint.searchParams.set("format", format);

  const response = await fetch(endpoint, {
    headers: { "User-Agent": "CraftID QR generator" },
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    return new NextResponse("QR generation unavailable", { status: 502 });
  }

  const body = await response.arrayBuffer();
  const download = request.nextUrl.searchParams.get("download") === "1";

  return new NextResponse(body, {
    headers: {
      "Content-Type":
        response.headers.get("content-type") ??
        (format === "svg" ? "image/svg+xml; charset=utf-8" : "image/png"),
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Content-Disposition":
        `${download ? "attachment" : "inline"}; filename="craftid-qr-${craftId.formatted}.${format}"`,
      "X-Robots-Tag": "noindex",
    },
  });
}
