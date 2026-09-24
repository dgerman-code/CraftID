import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseCraftId } from "@/lib/craftid-format";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

function esc(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char] ?? char));
}

export async function GET(request: NextRequest) {
  const parsed = parseCraftId(request.nextUrl.searchParams.get("craftId"));
  if (!parsed) return new NextResponse("Invalid CraftID", { status: 400 });

  const supabase = await createClient();

  const { data: publicProfile } = await supabase.rpc("public_craftid_profile", {
    p_craftid_number: parsed.number,
    p_check_digits: parsed.check,
  });
  const published = publicProfile as { display_name: string; entity_type: "professional" | "workshop" } | null;

  let ownName: string | null = null;
  let ownType: "professional" | "workshop" | null = null;
  if (!published) {
    const { data: entity } = await supabase
      .from("craftid_entities")
      .select("id, entity_type")
      .eq("craftid_number", parsed.number)
      .eq("craftid_check_digits", parsed.check)
      .maybeSingle();

    if (!entity) return new NextResponse("CraftID not found", { status: 404 });

    const profile = entity.entity_type === "professional"
      ? await supabase.from("professional_profiles").select("display_name").eq("entity_id", entity.id).single()
      : await supabase.from("workshop_profiles").select("display_name").eq("entity_id", entity.id).single();

    ownName = profile.data?.display_name ?? null;
    ownType = entity.entity_type as "professional" | "workshop";
  }

  const entityType = published?.entity_type ?? ownType ?? "professional";
  const recordLabel = entityType === "workshop" ? "Workshop identity record" : "Professional identity record";
  const displayName = esc(published?.display_name ?? ownName ?? "CraftID");
  const canonical = new URL(`id/${parsed.formatted}`, getSiteUrl()).toString();

  const qrEndpoint = new URL("https://quickchart.io/qr");
  qrEndpoint.searchParams.set("text", canonical);
  qrEndpoint.searchParams.set("size", "360");
  qrEndpoint.searchParams.set("margin", "1");
  qrEndpoint.searchParams.set("ecLevel", "M");

  const qrResponse = await fetch(qrEndpoint, {
    headers: { "User-Agent": "CraftID label generator" },
    next: { revalidate: 86400 },
  });

  if (!qrResponse.ok) return new NextResponse("Label generation unavailable", { status: 502 });

  const qrBytes = Buffer.from(await qrResponse.arrayBuffer());
  const qrData = `data:image/png;base64,${qrBytes.toString("base64")}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="360" viewBox="0 0 900 360" role="img" aria-label="CraftID maker label ${parsed.formatted}">
    <rect width="900" height="360" fill="#ffffff"/>
    <rect x="2" y="2" width="896" height="356" fill="none" stroke="#cfd5d0" stroke-width="2"/>
    <rect x="2" y="2" width="896" height="8" fill="#1e3a5f"/>
    <text x="42" y="82" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="#111412">CraftID</text>
    <text x="42" y="132" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="24" fill="#1e3a5f">#${parsed.formatted}</text>
    <text x="42" y="196" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#111412">${displayName}</text>
    <text x="42" y="242" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#59615c">${recordLabel}</text>
    <text x="42" y="292" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#59615c">${esc(canonical)}</text>
    <image href="${qrData}" x="610" y="52" width="238" height="238"/>
    <text x="610" y="318" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#59615c">Scan to view the CraftID record</text>
  </svg>`;

  const download = request.nextUrl.searchParams.get("download") === "1";

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="craftid-round-sticker-${parsed.formatted}.svg"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
      "X-Robots-Tag": "noindex",
    },
  });
}
