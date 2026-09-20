import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

function parseCraftId(value: string | null) {
  if (!value) return null;
  const match = value.match(/^(?:#)?0*(\d+)-(\d{2})$/);
  if (!match) return null;
  const number = Number(match[1]);
  if (!Number.isSafeInteger(number) || number < 1) return null;
  return `${String(number).padStart(8, "0")}-${match[2]}`;
}

export async function GET(request: NextRequest) {
  const craftId = parseCraftId(request.nextUrl.searchParams.get("craftId"));
  if (!craftId) return new NextResponse("Invalid CraftID", { status: 400 });

  const target = new URL(`id/${craftId}`, getSiteUrl()).toString();
  const endpoint = new URL("https://quickchart.io/qr");
  endpoint.searchParams.set("text", target);
  endpoint.searchParams.set("size", "420");
  endpoint.searchParams.set("margin", "1");
  endpoint.searchParams.set("ecLevel", "M");

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
      "Content-Type": response.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="craftid-qr-${craftId}.png"`,
      "X-Robots-Tag": "noindex",
    },
  });
}
