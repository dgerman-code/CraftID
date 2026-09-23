import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

function parseCraftId(value: string | null) {
  if (!value) return null;
  const match = value.match(/^(?:#)?0*(\d+)-(\d{2})$/);
  if (!match) return null;
  const number = Number(match[1]);
  if (!Number.isSafeInteger(number) || number < 1) return null;
  return {
    number,
    check: match[2],
    formatted: String(number).padStart(8, "0") + "-" + match[2],
  };
}

function normalizeOrigin(value: string | null) {
  const origin = (value ?? "").trim().replace(/\s+/g, " ");
  if (!origin || origin.length > 64) return null;
  return origin;
}

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
  const origin = normalizeOrigin(request.nextUrl.searchParams.get("origin"));

  if (!parsed) return new NextResponse("Invalid CraftID", { status: 400 });
  if (!origin) return new NextResponse("Origin is required", { status: 400 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub ?? null;
  if (!userId) return new NextResponse("Authentication required", { status: 401 });

  const { data: entity } = await supabase
    .from("craftid_entities")
    .select("id, entity_type")
    .eq("craftid_number", parsed.number)
    .eq("craftid_check_digits", parsed.check)
    .eq("owner_user_id", userId)
    .neq("public_status", "archived")
    .maybeSingle();

  if (!entity) return new NextResponse("CraftID not found or not owned by this account", { status: 404 });

  const profile = entity.entity_type === "professional"
    ? await supabase
        .from("professional_profiles")
        .select("display_name")
        .eq("entity_id", entity.id)
        .single()
    : await supabase
        .from("workshop_profiles")
        .select("display_name")
        .eq("entity_id", entity.id)
        .single();

  const displayName = esc(profile.data?.display_name ?? "CraftID");
  const entityLabel = entity.entity_type === "professional" ? "Professional" : "Workshop";
  const canonical = new URL("id/" + parsed.formatted, getSiteUrl()).toString();

  const qrEndpoint = new URL("https://quickchart.io/qr");
  qrEndpoint.searchParams.set("text", canonical);
  qrEndpoint.searchParams.set("size", "420");
  qrEndpoint.searchParams.set("margin", "1");
  qrEndpoint.searchParams.set("ecLevel", "M");

  const qrResponse = await fetch(qrEndpoint, {
    headers: { "User-Agent": "CraftID origin label generator" },
    next: { revalidate: 86400 },
  });

  if (!qrResponse.ok) {
    return new NextResponse("Origin label generation unavailable", { status: 502 });
  }

  const qrBytes = Buffer.from(await qrResponse.arrayBuffer());
  const qrData = "data:image/png;base64," + qrBytes.toString("base64");
  const originText = "CRAFTED IN " + esc(origin.toLocaleUpperCase("en-US"));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="420" viewBox="0 0 900 420" role="img" aria-label="CraftID ${entityLabel} origin label ${parsed.formatted}">
    <rect width="900" height="420" fill="#ffffff"/>
    <rect x="2" y="2" width="896" height="416" fill="none" stroke="#cfd5d0" stroke-width="2"/>
    <rect x="2" y="2" width="896" height="8" fill="#1e3a5f"/>

    <text x="42" y="70" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="#111412">CraftID</text>
    <text x="42" y="104" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" letter-spacing="1.5" fill="#59615c">${entityLabel.toUpperCase()}</text>
    <text x="42" y="142" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="22" fill="#1e3a5f">#${parsed.formatted}</text>

    <text x="42" y="202" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#111412">${displayName}</text>

    <line x1="42" y1="232" x2="565" y2="232" stroke="#cfd5d0" stroke-width="1"/>
    <text x="42" y="282" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="700" letter-spacing="1.2" fill="#1e3a5f">${originText}</text>

    <text x="42" y="342" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#59615c">${esc(canonical)}</text>

    <image href="${qrData}" x="620" y="62" width="220" height="220"/>
    <text x="620" y="313" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#59615c">Scan to view the CraftID record</text>
  </svg>`;

  const safeOrigin = origin
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "origin";

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="craftid-crafted-in-${safeOrigin}-${parsed.formatted}.svg"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
      "X-Robots-Tag": "noindex",
    },
  });
}
