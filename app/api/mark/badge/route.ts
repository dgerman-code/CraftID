import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseCraftId } from "@/lib/craftid-format";
import { getSiteUrl } from "@/lib/site-url";
import { parseCraftId } from "@/lib/craftid-format";

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

  // Published profiles resolve through the public projection, so the badge
  // carries the real name for anonymous visitors too.
  const { data: publicProfile } = await supabase.rpc("public_craftid_profile", {
    p_craftid_number: parsed.number,
    p_check_digits: parsed.check,
  });
  const published = publicProfile as { display_name: string } | null;

  // Owners and staff still get a badge for a CraftID that is not published yet.
  let ownName: string | null = null;
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
  }

  const displayName = esc(published?.display_name ?? ownName ?? "CraftID");
  const statusLabel = published ? "PROFILE AVAILABLE" : "PROFILE NOT PUBLIC";
  const canonical = new URL(`id/${parsed.formatted}`, getSiteUrl()).toString();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="120" viewBox="0 0 560 120" role="img" aria-label="CraftID ${parsed.formatted}">
    <rect width="560" height="120" fill="#ffffff"/>
    <rect x="1" y="1" width="558" height="118" fill="none" stroke="#cfd5d0"/>
    <rect x="1" y="1" width="558" height="4" fill="#1e3a5f"/>
    <text x="24" y="38" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#111412">CraftID</text>
    <text x="24" y="67" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="15" fill="#59615c">#${parsed.formatted}</text>
    <text x="230" y="40" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="#111412">${displayName}</text>
    <text x="230" y="67" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" letter-spacing="1" fill="#59615c">${statusLabel}</text>
    <text x="230" y="92" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#59615c">${esc(canonical)}</text>
  </svg>`;

  const download = request.nextUrl.searchParams.get("download") === "1";
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="craftid-badge-${parsed.formatted}.svg"`,
      "X-Robots-Tag": "noindex",
    },
  });
}
