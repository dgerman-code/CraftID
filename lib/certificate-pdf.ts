import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { PublicCraftIdCertificate } from "@/lib/certificate";
import { formatCraftId } from "@/lib/certificate";
import { formatCertificateNumber } from "@/lib/craftid-format";

type CertificateLocale = "en" | "uk";

const A4_PORTRAIT: [number, number] = [595.28, 841.89];

const copy = {
  en: {
    certificate: "CERTIFICATE",
    professionalSubtitle: "PROFESSIONAL IDENTITY",
    workshopSubtitle: "WORKSHOP IDENTITY",
    certifies: "This certifies that",
    professionalStatement:
      "This certificate confirms the existence of a CraftID professional identity record. It provides a persistent reference to the public CraftID profile, including information about the maker, their craft and professional background.",
    workshopStatement:
      "This certificate confirms the existence of a CraftID workshop identity record. It provides a persistent reference to the public CraftID profile, including information about the workshop, its craft and professional background.",
    craftId: "CraftID",
    type: "Type",
    professional: "Professional",
    workshop: "Workshop",
    craft: "Craft / Specialisation",
    country: "Country (profile)",
    registered: "Initial registration",
    certificateNo: "Certificate No.",
    issued: "Date of issue",
    scan: "SCAN TO VERIFY CERTIFICATE",
    profile: "PUBLIC CRAFTID PROFILE",
    disclaimer:
      "This certificate confirms a CraftID record and a versioned issue of that record. It is not a qualification, statutory licence, accreditation, quality certification or EU institutional endorsement.",
    revoked: "REVOKED",
    footer: "CRAFTID · A MORE VISIBLE CRAFT WORLD",
    side: ["A GLOBAL", "IDENTITY", "FOR CRAFT", "AND MAKERS"],
  },
  uk: {
    certificate: "СЕРТИФІКАТ",
    professionalSubtitle: "PROFESSIONAL IDENTITY",
    workshopSubtitle: "WORKSHOP IDENTITY",
    certifies: "Цим підтверджується, що",
    professionalStatement:
      "Цей сертифікат підтверджує існування запису професійної ідентичності CraftID та надає постійне посилання на публічний профіль CraftID з інформацією про майстра, його ремесло та професійний досвід.",
    workshopStatement:
      "Цей сертифікат підтверджує існування запису майстерні CraftID та надає постійне посилання на публічний профіль CraftID з інформацією про майстерню, її ремесло та професійний контекст.",
    craftId: "CraftID",
    type: "Тип",
    professional: "Professional",
    workshop: "Workshop",
    craft: "Ремесло / Спеціалізація",
    country: "Країна (профіль)",
    registered: "Початкова реєстрація",
    certificateNo: "Certificate No.",
    issued: "Дата випуску",
    scan: "СКАНУЙТЕ ДЛЯ ПЕРЕВІРКИ",
    profile: "ПУБЛІЧНИЙ ПРОФІЛЬ CRAFTID",
    disclaimer:
      "Сертифікат підтверджує запис CraftID та його версійний випуск. Він не є кваліфікацією, законодавчою ліцензією, акредитацією, сертифікацією якості чи інституційним схваленням ЄС.",
    revoked: "ВІДКЛИКАНО",
    footer: "CRAFTID · A MORE VISIBLE CRAFT WORLD",
    side: ["A GLOBAL", "IDENTITY", "FOR CRAFT", "AND MAKERS"],
  },
} as const;

function fitTextSize(
  font: PDFFont,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
) {
  let size = startSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5;
  return size;
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? current + " " + word : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function dateLabel(value: string, locale: CertificateLocale) {
  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function countryLabel(code: string | null, locale: CertificateLocale) {
  if (!code) return "—";
  try {
    return new Intl.DisplayNames([locale === "uk" ? "uk" : "en"], {
      type: "region",
    }).of(code) ?? code;
  } catch {
    return code;
  }
}

function drawGuilloche(page: PDFPage) {
  const gold = rgb(185 / 255, 145 / 255, 79 / 255);
  const cx = 280;
  const cy = 365;

  for (let i = 0; i < 15; i += 1) {
    const offset = (i - 7) * 10;
    page.drawCircle({
      x: cx + offset,
      y: cy,
      size: 112,
      borderColor: gold,
      borderWidth: 0.35,
      opacity: 0.13,
    });
    page.drawCircle({
      x: cx,
      y: cy + offset,
      size: 112,
      borderColor: gold,
      borderWidth: 0.35,
      opacity: 0.11,
    });
  }
}

function drawFact(
  page: PDFPage,
  regular: PDFFont,
  bold: PDFFont,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
) {
  const muted = rgb(89 / 255, 97 / 255, 92 / 255);
  const ink = rgb(17 / 255, 26 / 255, 51 / 255);
  const gold = rgb(185 / 255, 145 / 255, 79 / 255);

  page.drawText(label, { x, y, size: 7.4, font: regular, color: muted });
  const size = fitTextSize(bold, value, width, 9.5, 7.2);
  page.drawText(value, { x, y: y - 14, size, font: bold, color: ink });
  page.drawLine({
    start: { x, y: y - 20 },
    end: { x: x + width, y: y - 20 },
    color: gold,
    thickness: 0.45,
    opacity: 0.65,
  });
}


function svgX(value: number, pageWidth: number) {
  return value * (pageWidth / 446.25);
}

function svgY(value: number, pageHeight: number) {
  return pageHeight - value * (pageHeight / 631.499985);
}

async function renderApprovedProfessionalCertificatePdf(input: {
  certificate: PublicCraftIdCertificate;
  profileUrl: string;
  qrPng: Uint8Array;
  regularFontBytes: Uint8Array;
  boldFontBytes: Uint8Array;
  backgroundJpeg: Uint8Array;
}) {
  const {
    certificate,
    profileUrl,
    qrPng,
    regularFontBytes,
    boldFontBytes,
    backgroundJpeg,
  } = input;

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const regular = await pdf.embedFont(regularFontBytes, { subset: true });
  const bold = await pdf.embedFont(boldFontBytes, { subset: true });
  const background = await pdf.embedJpg(backgroundJpeg);
  const qr = await pdf.embedPng(qrPng);

  const craftId = formatCraftId(
    certificate.craftid_number,
    certificate.craftid_check_digits,
  );
  const certificateNumber = formatCertificateNumber(
    certificate.craftid_number,
    certificate.craftid_check_digits,
    certificate.version_no,
  );

  pdf.setTitle(certificateNumber + " - CraftID Certificate");
  pdf.setAuthor("CraftID");
  pdf.setSubject("CraftID professional identity record certificate");
  pdf.setCreator("CraftID");
  pdf.setProducer("CraftID");

  const page = pdf.addPage(A4_PORTRAIT);
  const width = page.getWidth();
  const height = page.getHeight();
  const sx = width / 446.25;
  const sy = height / 631.499985;
  const ink = rgb(30 / 255, 42 / 255, 64 / 255);

  page.drawImage(background, {
    x: 0,
    y: 0,
    width,
    height,
  });

  function drawSourceText(
    value: string,
    x: number,
    y: number,
    sourceSize: number,
    font: PDFFont,
    maxSourceWidth: number,
    minSourceSize = sourceSize * 0.72,
  ) {
    let size = sourceSize * sy;
    const minSize = minSourceSize * sy;
    const maxWidth = maxSourceWidth * sx;

    while (size > minSize && font.widthOfTextAtSize(value, size) > maxWidth) {
      size -= 0.25;
    }

    page.drawText(value, {
      x: svgX(x, width),
      y: svgY(y, height),
      size,
      font,
      color: ink,
    });
  }

  drawSourceText(
    certificate.issued_display_name,
    42.9,
    210.05,
    17.8,
    bold,
    350,
    12.8,
  );

  drawSourceText("#" + craftId, 142.5, 276.1, 9.2, bold, 118, 7.8);
  drawSourceText("Professional", 142.6, 295.4, 7.15, regular, 120, 6.2);
  drawSourceText(
    certificate.issued_role_label || "—",
    142.6,
    314.15,
    7.15,
    regular,
    142,
    5.8,
  );
  drawSourceText(
    countryLabel(certificate.issued_country_code, "en"),
    142.6,
    332.35,
    7.15,
    regular,
    142,
    6,
  );
  drawSourceText(
    dateLabel(certificate.entity_created_at, "en"),
    142.6,
    350.8,
    7.15,
    regular,
    142,
    6,
  );
  drawSourceText(certificateNumber, 142.6, 369.25, 7.15, regular, 142, 6);
  drawSourceText(
    dateLabel(certificate.issued_at, "en"),
    142.6,
    387.5,
    7.15,
    regular,
    142,
    6,
  );

  const displayProfileUrl = profileUrl
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  drawSourceText(displayProfileUrl, 309.8, 356.95, 5.85, regular, 88, 4.45);

  const qrFrameX = 309.8;
  const qrFrameY = 262.6;
  const qrFrameSize = 63.2;
  page.drawRectangle({
    x: svgX(qrFrameX, width),
    y: height - (qrFrameY + qrFrameSize) * sy,
    width: qrFrameSize * sx,
    height: qrFrameSize * sy,
    color: rgb(1, 1, 1),
    borderColor: rgb(220 / 255, 202 / 255, 160 / 255),
    borderWidth: 0.6 * sx,
  });

  const qrX = 314.3;
  const qrY = 267.1;
  const qrSize = 54.2;
  page.drawImage(qr, {
    x: svgX(qrX, width),
    y: height - (qrY + qrSize) * sy,
    width: qrSize * sx,
    height: qrSize * sy,
  });

  if (certificate.certificate_status === "revoked") {
    const revoked = "REVOKED";
    const stampColor = rgb(139 / 255, 45 / 255, 45 / 255);
    const stampWidth = 94;
    const stampHeight = 22;
    const stampX = width - 42 - stampWidth;
    const stampY = 100;

    page.drawRectangle({
      x: stampX,
      y: stampY,
      width: stampWidth,
      height: stampHeight,
      borderColor: stampColor,
      borderWidth: 1.2,
      opacity: 0.92,
    });
    page.drawText(revoked, {
      x: stampX + (stampWidth - bold.widthOfTextAtSize(revoked, 10)) / 2,
      y: stampY + 6,
      size: 10,
      font: bold,
      color: stampColor,
    });
  }

  return pdf.save();
}

export async function renderCraftIdCertificatePdf(input: {
  certificate: PublicCraftIdCertificate;
  locale: CertificateLocale;
  verificationUrl: string;
  profileUrl: string;
  qrPng: Uint8Array;
  regularFontBytes: Uint8Array;
  boldFontBytes: Uint8Array;
  backgroundJpeg?: Uint8Array;
}) {
  const {
    certificate,
    locale,
    verificationUrl,
    profileUrl,
    qrPng,
    regularFontBytes,
    boldFontBytes,
    backgroundJpeg,
  } = input;

  if (certificate.entity_type === "professional" && backgroundJpeg) {
    return renderApprovedProfessionalCertificatePdf({
      certificate,
      profileUrl,
      qrPng,
      regularFontBytes,
      boldFontBytes,
      backgroundJpeg,
    });
  }

  const t = copy[locale];
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const regular = await pdf.embedFont(regularFontBytes, { subset: true });
  const bold = await pdf.embedFont(boldFontBytes, { subset: true });
  const qr = await pdf.embedPng(qrPng);

  const craftId = formatCraftId(
    certificate.craftid_number,
    certificate.craftid_check_digits,
  );
  const certificateNumber = formatCertificateNumber(
    certificate.craftid_number,
    certificate.craftid_check_digits,
    certificate.version_no,
  );

  pdf.setTitle(certificateNumber + " - CraftID Certificate");
  pdf.setAuthor("CraftID");
  pdf.setSubject("CraftID identity record certificate");
  pdf.setCreator("CraftID");
  pdf.setProducer("CraftID");

  const page = pdf.addPage(A4_PORTRAIT);
  const width = page.getWidth();
  const height = page.getHeight();

  const navy = rgb(17 / 255, 26 / 255, 51 / 255);
  const gold = rgb(185 / 255, 145 / 255, 79 / 255);
  const muted = rgb(91 / 255, 94 / 255, 104 / 255);
  const paper = rgb(1, 253 / 255, 248 / 255);

  page.drawRectangle({ x: 0, y: 0, width, height, color: paper });
  page.drawRectangle({
    x: 17,
    y: 17,
    width: width - 34,
    height: height - 34,
    borderColor: gold,
    borderWidth: 3.2,
  });
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: navy,
    borderWidth: 0.8,
  });
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: gold,
    borderWidth: 0.45,
  });

  drawGuilloche(page);

  page.drawText("Craft", { x: 55, y: 760, size: 31, font: bold, color: navy });
  page.drawText("ID", {
    x: 129,
    y: 760,
    size: 31,
    font: bold,
    color: gold,
  });
  page.drawText(
    "CREATIVITY · TECHNOLOGY · INNOVATION · IDENTITY · INVENTION · ENGINEERING · HERITAGE",
    { x: 55, y: 742, size: 5.2, font: regular, color: navy },
  );

  t.side.forEach((line, index) => {
    page.drawText(line, {
      x: 470,
      y: 778 - index * 10,
      size: 6.2,
      font: regular,
      color: navy,
    });
  });
  page.drawLine({
    start: { x: 470, y: 732 },
    end: { x: 505, y: 732 },
    color: gold,
    thickness: 1.5,
  });

  if (certificate.certificate_status === "revoked") {
    page.drawRectangle({
      x: 407,
      y: 690,
      width: 122,
      height: 28,
      borderColor: rgb(139 / 255, 45 / 255, 45 / 255),
      borderWidth: 1.2,
    });
    const stamp = t.revoked;
    const stampWidth = bold.widthOfTextAtSize(stamp, 10);
    page.drawText(stamp, {
      x: 468 - stampWidth / 2,
      y: 699,
      size: 10,
      font: bold,
      color: rgb(139 / 255, 45 / 255, 45 / 255),
    });
  }

  page.drawText(t.certificate, {
    x: 55,
    y: 675,
    size: locale === "uk" ? 28 : 34,
    font: regular,
    color: navy,
  });
  page.drawText(
    certificate.entity_type === "professional"
      ? t.professionalSubtitle
      : t.workshopSubtitle,
    { x: 56, y: 645, size: 10, font: bold, color: navy },
  );

  page.drawText(t.certifies, { x: 55, y: 600, size: 9, font: regular, color: muted });
  const nameSize = fitTextSize(bold, certificate.issued_display_name, 430, 23, 15);
  page.drawText(certificate.issued_display_name, {
    x: 55,
    y: 570,
    size: nameSize,
    font: bold,
    color: navy,
  });

  const statement =
    certificate.entity_type === "professional"
      ? t.professionalStatement
      : t.workshopStatement;
  const statementLines = wrapText(regular, statement, 8.4, 455);
  statementLines.slice(0, 4).forEach((line, index) => {
    page.drawText(line, {
      x: 55,
      y: 545 - index * 11,
      size: 8.4,
      font: regular,
      color: navy,
    });
  });

  page.drawLine({
    start: { x: 55, y: 492 },
    end: { x: 380, y: 492 },
    color: gold,
    thickness: 1.1,
  });

  const facts: Array<[string, string]> = [
    [t.craftId, "#" + craftId],
    [t.type, certificate.entity_type === "professional" ? t.professional : t.workshop],
    [t.craft, certificate.issued_role_label || "—"],
    [t.country, countryLabel(certificate.issued_country_code, locale)],
    [t.registered, dateLabel(certificate.entity_created_at, locale)],
    [t.certificateNo, certificateNumber],
    [t.issued, dateLabel(certificate.issued_at, locale)],
  ];

  let factY = 472;
  for (const [label, value] of facts) {
    drawFact(page, regular, bold, label, value, 55, factY, 320);
    factY -= 41;
  }

  page.drawLine({
    start: { x: 397, y: 492 },
    end: { x: 397, y: 260 },
    color: gold,
    thickness: 1,
  });

  page.drawImage(qr, { x: 425, y: 350, width: 105, height: 105 });
  page.drawText(t.scan, {
    x: 425,
    y: 335,
    size: 5.5,
    font: bold,
    color: navy,
  });

  const verifyLines = wrapText(regular, verificationUrl, 5.1, 112);
  verifyLines.slice(0, 3).forEach((line, index) => {
    page.drawText(line, {
      x: 425,
      y: 321 - index * 7,
      size: 5.1,
      font: regular,
      color: muted,
    });
  });

  page.drawText(t.profile, {
    x: 425,
    y: 284,
    size: 5.5,
    font: bold,
    color: navy,
  });
  const profileLines = wrapText(regular, profileUrl, 5.1, 112);
  profileLines.slice(0, 3).forEach((line, index) => {
    page.drawText(line, {
      x: 425,
      y: 270 - index * 7,
      size: 5.1,
      font: regular,
      color: muted,
    });
  });

  page.drawLine({
    start: { x: 55, y: 175 },
    end: { x: 540, y: 175 },
    color: gold,
    thickness: 0.8,
  });

  const disclaimerLines = wrapText(regular, t.disclaimer, 6.7, 480);
  disclaimerLines.slice(0, 4).forEach((line, index) => {
    page.drawText(line, {
      x: 55,
      y: 156 - index * 9,
      size: 6.7,
      font: regular,
      color: muted,
    });
  });

  page.drawText("CraftID Platform", {
    x: 55,
    y: 91,
    size: 8.5,
    font: bold,
    color: navy,
  });
  page.drawText(t.footer, {
    x: 55,
    y: 66,
    size: 5.8,
    font: regular,
    color: navy,
  });
  page.drawText("CRAFTID.EU", {
    x: 470,
    y: 66,
    size: 5.8,
    font: bold,
    color: navy,
  });

  return pdf.save();
}
