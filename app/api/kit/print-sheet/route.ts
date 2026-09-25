import { NextRequest, NextResponse } from "next/server";
import { getOwnedDownloadKitEntity } from "@/lib/download-kit";
import { fetchQrPng, renderPrintSheetPdf } from "@/lib/mark-render";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const entityId = request.nextUrl.searchParams.get("entity") ?? "";
  const result = await getOwnedDownloadKitEntity(entityId);

  if (result.status === 401) return new NextResponse("Authentication required", { status: 401 });
  if (result.status === 400) return new NextResponse("Entity is required", { status: 400 });
  if (result.status !== 200 || !result.entity) return new NextResponse("CraftID entity not found", { status: 404 });

  try {
    const qr = await fetchQrPng(result.entity.profileUrl, 520);
    const pdf = await renderPrintSheetPdf({
      craftId: result.entity.craftId,
      qrPng: qr.bytes,
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
