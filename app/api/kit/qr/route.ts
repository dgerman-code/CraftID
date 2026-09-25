import { NextRequest, NextResponse } from "next/server";
import { getOwnedDownloadKitEntity } from "@/lib/download-kit";
import { fetchQrPng } from "@/lib/mark-render";

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

  try {
    const qr = await fetchQrPng(result.entity.profileUrl, 1200, 16);
    const download = request.nextUrl.searchParams.get("download") === "1";

    return new NextResponse(Buffer.from(qr.bytes), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="craftid-qr-${result.entity.craftId}.png"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    console.error("CraftID standalone QR generation failed", error);
    return new NextResponse("QR generation unavailable", { status: 502 });
  }
}
