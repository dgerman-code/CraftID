import { NextRequest, NextResponse } from "next/server";
import { parseCraftId } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const craftId = parseCraftId(request.nextUrl.searchParams.get("craftId"));
  if (!craftId) return new NextResponse("Invalid CraftID", { status: 400 });

  const target = new URL("/api/mark/sticker", request.nextUrl.origin);
  target.searchParams.set("craftId", craftId.formatted);

  if (request.nextUrl.searchParams.get("download") === "1") {
    target.searchParams.set("download", "1");
  }

  return NextResponse.redirect(target, 307);
}
