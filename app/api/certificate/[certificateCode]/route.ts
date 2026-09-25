import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import {
  isCertificateCode,
  normalizeCertificateCode,
  type PublicCraftIdCertificate,
} from "@/lib/certificate";
import { formatCraftId } from "@/lib/craftid-format";
import { renderCraftIdCertificatePdf } from "@/lib/certificate-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REGULAR_FONT_URL =
  "https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf";
const BOLD_FONT_URL =
  "https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf";

async function fetchBinary(url: string, label: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "CraftID certificate generator" },
    next: { revalidate: 60 * 60 * 24 * 30 },
  });

  if (!response.ok) {
    throw new Error(label + " unavailable");
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ certificateCode: string }> },
) {
  const code = normalizeCertificateCode(
    decodeURIComponent((await context.params).certificateCode),
  );

  if (!isCertificateCode(code)) {
    return new NextResponse("Invalid Certificate No.", { status: 400 });
  }

  const locale =
    request.nextUrl.searchParams.get("lang") === "uk" ? "uk" : "en";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_craftid_certificate", {
    p_certificate_code: code,
  });

  if (error) {
    return new NextResponse("Certificate lookup unavailable", { status: 502 });
  }

  const certificate = data as PublicCraftIdCertificate | null;
  if (!certificate) {
    return new NextResponse("Certificate not found", { status: 404 });
  }

  const siteUrl = getSiteUrl();
  const verificationUrl = new URL(
    "certificate/" + encodeURIComponent(certificate.certificate_code),
    siteUrl,
  ).toString();

  const craftId = formatCraftId(
    certificate.craftid_number,
    certificate.craftid_check_digits,
  );
  const profileUrl = new URL("id/" + craftId, siteUrl).toString();

  const qrEndpoint = new URL("https://quickchart.io/qr");
  qrEndpoint.searchParams.set("text", verificationUrl);
  qrEndpoint.searchParams.set("size", "520");
  qrEndpoint.searchParams.set("margin", "1");
  qrEndpoint.searchParams.set("ecLevel", "M");

  try {
    const [regularFontBytes, boldFontBytes, qrPng] = await Promise.all([
      fetchBinary(REGULAR_FONT_URL, "Certificate font"),
      fetchBinary(BOLD_FONT_URL, "Certificate font"),
      fetchBinary(qrEndpoint.toString(), "Certificate QR"),
    ]);

    const pdf = await renderCraftIdCertificatePdf({
      certificate,
      locale,
      verificationUrl,
      profileUrl,
      qrPng,
      regularFontBytes,
      boldFontBytes,
    });

    const download = request.nextUrl.searchParams.get("download") === "1";
    const filename =
      "craftid-certificate-" +
      certificate.certificate_code +
      "-" +
      locale +
      ".pdf";

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          (download ? "attachment" : "inline") + '; filename="' + filename + '"',
        "Cache-Control": "private, max-age=0, must-revalidate",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (pdfError) {
    console.error("CraftID certificate PDF generation failed", pdfError);
    return new NextResponse("Certificate generation unavailable", {
      status: 502,
    });
  }
}
