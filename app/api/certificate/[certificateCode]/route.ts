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
  const assetOrigin = request.nextUrl.origin;
  const verificationUrl = new URL(
    "certificate/" + encodeURIComponent(certificate.certificate_code),
    siteUrl,
  ).toString();

  const craftId = formatCraftId(
    certificate.craftid_number,
    certificate.craftid_check_digits,
  );
  const profileUrl = new URL("id/" + craftId, siteUrl).toString();

  const qrTarget =
    certificate.entity_type === "professional" ? profileUrl : verificationUrl;
  const qrEndpoint = new URL("https://quickchart.io/qr");
  qrEndpoint.searchParams.set("text", qrTarget);
  qrEndpoint.searchParams.set("size", "620");
  qrEndpoint.searchParams.set("margin", "0");
  qrEndpoint.searchParams.set("ecLevel", "M");

  try {
    const [regularFontBytes, boldFontBytes, qrPng, backgroundJpeg] =
      certificate.entity_type === "professional"
        ? await Promise.all([
            fetchBinary(
              new URL("/templates/cid-sans-400.ttf", assetOrigin).toString(),
              "Certificate font",
            ),
            fetchBinary(
              new URL("/templates/cid-sans-600.ttf", assetOrigin).toString(),
              "Certificate font",
            ),
            fetchBinary(qrEndpoint.toString(), "Certificate QR"),
            fetchBinary(
              new URL(
                "/templates/craftid-certificate-original-bg.jpg",
                assetOrigin,
              ).toString(),
              "Certificate template",
            ),
          ])
        : await Promise.all([
            fetchBinary(
              new URL("/templates/cid-sans-400.ttf", assetOrigin).toString(),
              "Certificate font",
            ),
            fetchBinary(
              new URL("/templates/cid-sans-600.ttf", assetOrigin).toString(),
              "Certificate font",
            ),
            fetchBinary(qrEndpoint.toString(), "Certificate QR"),
            Promise.resolve(undefined),
          ]);

    const pdf = await renderCraftIdCertificatePdf({
      certificate,
      locale,
      verificationUrl,
      profileUrl,
      qrPng,
      regularFontBytes,
      boldFontBytes,
      backgroundJpeg,
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
