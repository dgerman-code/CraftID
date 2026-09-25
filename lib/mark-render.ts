import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const NAVY = "#111a33";
const GOLD = "#b9914f";
const GREY = "#777981";
const PAPER = "#fffdf8";

function esc(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char] ?? char));
}

export async function fetchQrPng(target: string, size = 520) {
  const endpoint = new URL("https://quickchart.io/qr");
  endpoint.searchParams.set("text", target);
  endpoint.searchParams.set("size", String(size));
  endpoint.searchParams.set("margin", "1");
  endpoint.searchParams.set("ecLevel", "M");

  const response = await fetch(endpoint, {
    headers: { "User-Agent": "CraftID Download Kit" },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    throw new Error("QR generation unavailable");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    bytes: new Uint8Array(buffer),
    dataUri: "data:image/png;base64," + buffer.toString("base64"),
  };
}

export function renderRoundStickerSvg(input: {
  craftId: string;
  qrDataUri: string;
}) {
  const craftId = esc(input.craftId);
  const qr = input.qrDataUri;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000" role="img" aria-label="CraftID #${craftId}">
    <defs>
      <path id="topArc" d="M 138 514 A 362 362 0 0 1 862 514"/>
      <path id="bottomArc" d="M 830 674 A 362 362 0 0 1 170 674"/>
      <pattern id="fineLines" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(24)">
        <line x1="0" y1="0" x2="0" y2="18" stroke="${GOLD}" stroke-width="1" opacity=".18"/>
      </pattern>
    </defs>
    <circle cx="500" cy="500" r="474" fill="${PAPER}" stroke="${GOLD}" stroke-width="18"/>
    <circle cx="500" cy="500" r="449" fill="none" stroke="${NAVY}" stroke-width="5"/>
    <circle cx="500" cy="500" r="437" fill="none" stroke="${GOLD}" stroke-width="2"/>
    <circle cx="500" cy="500" r="423" fill="url(#fineLines)" stroke="${GOLD}" stroke-width="1.5"/>
    <circle cx="500" cy="500" r="350" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity=".32"/>
    <circle cx="465" cy="500" r="250" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity=".16"/>
    <circle cx="535" cy="500" r="250" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity=".16"/>
    <circle cx="500" cy="465" r="250" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity=".16"/>
    <circle cx="500" cy="535" r="250" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity=".16"/>

    <text font-family="Arial, Helvetica, sans-serif" font-size="32" letter-spacing="9" fill="${GREY}">
      <textPath href="#topArc" startOffset="50%" text-anchor="middle">CREATIVITY · TECHNOLOGY · INNOVATION · IDENTITY</textPath>
    </text>
    <text font-family="Arial, Helvetica, sans-serif" font-size="30" letter-spacing="8" fill="${GREY}">
      <textPath href="#bottomArc" startOffset="50%" text-anchor="middle">INVENTION · ENGINEERING · HERITAGE</textPath>
    </text>

    <text x="500" y="388" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="118" font-weight="700" fill="${NAVY}">Craft<tspan fill="${GOLD}">ID</tspan></text>
    <line x1="370" y1="438" x2="630" y2="438" stroke="${GOLD}" stroke-width="2"/>
    <text x="500" y="500" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="31" letter-spacing="5" fill="${NAVY}">CRAFTID</text>
    <text x="500" y="555" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="47" font-weight="700" fill="${NAVY}">#${craftId}</text>

    <rect x="394" y="610" width="212" height="212" rx="8" fill="#ffffff" stroke="${GOLD}" stroke-width="2"/>
    <image href="${qr}" x="407" y="623" width="186" height="186"/>
    <text x="500" y="856" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" letter-spacing="4" fill="${NAVY}">CRAFTID.EU</text>
  </svg>`;
}

export function renderQrLabelSvg(input: {
  craftId: string;
  qrDataUri: string;
}) {
  const craftId = esc(input.craftId);
  const qr = input.qrDataUri;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="900" viewBox="0 0 720 900" role="img" aria-label="CraftID #${craftId} QR label">
    <rect width="720" height="900" rx="36" fill="${PAPER}"/>
    <rect x="18" y="18" width="684" height="864" rx="28" fill="none" stroke="${GOLD}" stroke-width="8"/>
    <rect x="34" y="34" width="652" height="832" rx="22" fill="none" stroke="${NAVY}" stroke-width="3"/>
    <text x="360" y="145" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="78" font-weight="700" fill="${NAVY}">Craft<tspan fill="${GOLD}">ID</tspan></text>
    <line x1="205" y1="185" x2="515" y2="185" stroke="${GOLD}" stroke-width="3"/>
    <text x="360" y="248" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="${NAVY}">#${craftId}</text>
    <rect x="138" y="300" width="444" height="444" rx="12" fill="#ffffff" stroke="${GOLD}" stroke-width="2"/>
    <image href="${qr}" x="158" y="320" width="404" height="404"/>
    <text x="360" y="812" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" letter-spacing="4" fill="${NAVY}">CRAFTID.EU</text>
  </svg>`;
}

function centeredX(text: string, size: number, font: { widthOfTextAtSize: (value: string, size: number) => number }, cx: number) {
  return cx - font.widthOfTextAtSize(text, size) / 2;
}

export async function renderPrintSheetPdf(input: {
  craftId: string;
  qrPng: Uint8Array;
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const qr = await pdf.embedPng(input.qrPng);

  const navy = rgb(17 / 255, 26 / 255, 51 / 255);
  const gold = rgb(185 / 255, 145 / 255, 79 / 255);
  const paper = rgb(1, 253 / 255, 248 / 255);

  const diameter = 154;
  const radius = diameter / 2;
  const cols = 3;
  const rows = 4;
  const gapX = (page.getWidth() - cols * diameter) / (cols + 1);
  const gapY = (page.getHeight() - rows * diameter) / (rows + 1);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = gapX + radius + col * (diameter + gapX);
      const cy = page.getHeight() - (gapY + radius + row * (diameter + gapY));

      page.drawCircle({ x: cx, y: cy, size: radius, color: paper, borderColor: gold, borderWidth: 3 });
      page.drawCircle({ x: cx, y: cy, size: radius - 7, borderColor: navy, borderWidth: 1.2 });
      page.drawCircle({ x: cx, y: cy, size: radius - 12, borderColor: gold, borderWidth: 0.7 });

      const logo = "CraftID";
      page.drawText(logo, {
        x: centeredX(logo, 15, bold, cx),
        y: cy + 41,
        size: 15,
        font: bold,
        color: navy,
      });

      const id = "#" + input.craftId;
      page.drawText(id, {
        x: centeredX(id, 8.6, bold, cx),
        y: cy + 23,
        size: 8.6,
        font: bold,
        color: navy,
      });

      page.drawImage(qr, {
        x: cx - 31,
        y: cy - 48,
        width: 62,
        height: 62,
      });

      const domain = "craftid.eu";
      page.drawText(domain, {
        x: centeredX(domain, 6.6, regular, cx),
        y: cy - 61,
        size: 6.6,
        font: regular,
        color: navy,
      });
    }
  }

  return pdf.save();
}
