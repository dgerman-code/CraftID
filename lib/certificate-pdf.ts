import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import type { PublicCraftIdCertificate } from "@/lib/certificate";
import { formatCraftId } from "@/lib/certificate";

type CertificateLocale = "en" | "uk";

const A4_LANDSCAPE: [number, number] = [841.89, 595.28];

const copy = {
  en: {
    professionalTitle: "CRAFTID PROFESSIONAL IDENTITY CERTIFICATE",
    workshopTitle: "CRAFTID WORKSHOP IDENTITY CERTIFICATE",
    confirms: "This certificate confirms that the identity record shown below is registered within CraftID under the permanent identifier stated.",
    craftId: "CraftID",
    certificateId: "Certificate ID",
    recordType: "Record type",
    professional: "Professional",
    workshop: "Workshop",
    country: "Country at issue",
    firstRegistered: "CraftID first registered",
    issued: "Certificate issued",
    verify: "Scan to verify this certificate and view the current CraftID status.",
    disclaimer: "This certificate confirms registration and identity within the CraftID professional identity infrastructure. It is not a professional qualification, statutory licence, quality certification, accreditation, or EU institutional endorsement.",
    instrument: "CraftID - professional identity, skills and evidence infrastructure",
  },
  uk: {
    professionalTitle: "СЕРТИФІКАТ ПРОФЕСІЙНОЇ ІДЕНТИЧНОСТІ CRAFTID",
    workshopTitle: "СЕРТИФІКАТ ІДЕНТИЧНОСТІ МАЙСТЕРНІ CRAFTID",
    confirms: "Цей сертифікат підтверджує, що наведений нижче запис ідентичності зареєстрований у CraftID під зазначеним постійним ідентифікатором.",
    craftId: "CraftID",
    certificateId: "Certificate ID",
    recordType: "Тип запису",
    professional: "Професіонал",
    workshop: "Майстерня",
    country: "Країна на момент випуску",
    firstRegistered: "Перша реєстрація CraftID",
    issued: "Дата випуску сертифіката",
    verify: "Скануйте QR-код, щоб перевірити сертифікат і поточний статус CraftID.",
    disclaimer: "Цей сертифікат підтверджує реєстрацію та ідентичність у професійній інфраструктурі CraftID. Він не є професійною кваліфікацією, законодавчою ліцензією, сертифікацією якості, акредитацією чи інституційним схваленням ЄС.",
    instrument: "CraftID - інфраструктура професійної ідентичності, навичок і доказів",
  },
} as const;

function fitTextSize(font: PDFFont, text: string, maxWidth: number, startSize: number, minSize: number) {
  let size = startSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.5;
  }
  return size;
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? current + " " + word : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
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

export async function renderCraftIdCertificatePdf(input: {
  certificate: PublicCraftIdCertificate;
  locale: CertificateLocale;
  verificationUrl: string;
  qrPng: Uint8Array;
  regularFontBytes: Uint8Array;
  boldFontBytes: Uint8Array;
}) {
  const { certificate, locale, verificationUrl, qrPng, regularFontBytes, boldFontBytes } = input;
  const t = copy[locale];
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const regular = await pdf.embedFont(regularFontBytes, { subset: true });
  const bold = await pdf.embedFont(boldFontBytes, { subset: true });
  const qr = await pdf.embedPng(qrPng);

  pdf.setTitle(certificate.certificate_code + " - CraftID Identity Certificate");
  pdf.setAuthor("CraftID");
  pdf.setSubject("CraftID identity registration certificate");
  pdf.setCreator("CraftID");
  pdf.setProducer("CraftID");

  const page = pdf.addPage(A4_LANDSCAPE);
  const width = page.getWidth();
  const height = page.getHeight();
  const navy = rgb(30 / 255, 58 / 255, 95 / 255);
  const ink = rgb(17 / 255, 20 / 255, 18 / 255);
  const muted = rgb(89 / 255, 97 / 255, 92 / 255);
  const line = rgb(207 / 255, 213 / 255, 208 / 255);
  const soft = rgb(247 / 255, 249 / 255, 247 / 255);

  page.drawRectangle({ x: 18, y: 18, width: width - 36, height: height - 36, borderColor: line, borderWidth: 1 });
  page.drawRectangle({ x: 18, y: height - 26, width: width - 36, height: 8, color: navy });

  page.drawText("CraftID", { x: 52, y: height - 74, size: 24, font: bold, color: ink });
  page.drawText(certificate.certificate_code, {
    x: 52,
    y: height - 98,
    size: 9.5,
    font: regular,
    color: muted,
  });

  const title = certificate.entity_type === "professional" ? t.professionalTitle : t.workshopTitle;
  const titleSize = fitTextSize(bold, title, 520, 19, 14);
  page.drawText(title, { x: 52, y: height - 145, size: titleSize, font: bold, color: navy });

  const introLines = wrapText(regular, t.confirms, 10.5, 505);
  introLines.forEach((lineText, index) => {
    page.drawText(lineText, {
      x: 52,
      y: height - 171 - index * 14,
      size: 10.5,
      font: regular,
      color: muted,
    });
  });

  const name = certificate.issued_display_name;
  const nameSize = fitTextSize(bold, name, 520, 31, 19);
  page.drawText(name, { x: 52, y: height - 245, size: nameSize, font: bold, color: ink });

  if (certificate.issued_role_label) {
    const roleSize = fitTextSize(regular, certificate.issued_role_label, 520, 13, 10);
    page.drawText(certificate.issued_role_label, {
      x: 52,
      y: height - 270,
      size: roleSize,
      font: regular,
      color: muted,
    });
  }

  const craftId = "#" + formatCraftId(certificate.craftid_number, certificate.craftid_check_digits);
  page.drawRectangle({ x: 52, y: 192, width: 518, height: 98, color: soft, borderColor: line, borderWidth: 0.7 });

  const facts = [
    [t.craftId, craftId],
    [t.certificateId, certificate.certificate_code],
    [t.recordType, certificate.entity_type === "professional" ? t.professional : t.workshop],
    [t.country, certificate.issued_country_code ?? "-"],
    [t.firstRegistered, dateLabel(certificate.entity_created_at, locale)],
    [t.issued, dateLabel(certificate.issued_at, locale)],
  ];

  const colX = [70, 320];
  facts.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const y = 258 - row * 31;
    page.drawText(label, { x: colX[col], y, size: 7.8, font: bold, color: muted });
    page.drawText(value, { x: colX[col], y: y - 13, size: 10.5, font: regular, color: ink });
  });

  const qrSize = 150;
  page.drawImage(qr, { x: 635, y: 304, width: qrSize, height: qrSize });
  const verifyLines = wrapText(regular, t.verify, 8.5, 155);
  verifyLines.forEach((lineText, index) => {
    page.drawText(lineText, {
      x: 632,
      y: 286 - index * 11,
      size: 8.5,
      font: regular,
      color: muted,
    });
  });

  const urlLines = wrapText(regular, verificationUrl, 6.8, 165);
  urlLines.slice(0, 3).forEach((lineText, index) => {
    page.drawText(lineText, {
      x: 632,
      y: 245 - index * 9,
      size: 6.8,
      font: regular,
      color: navy,
    });
  });

  page.drawLine({ start: { x: 52, y: 148 }, end: { x: width - 52, y: 148 }, color: line, thickness: 0.7 });

  const disclaimerLines = wrapText(regular, t.disclaimer, 7.8, width - 104);
  disclaimerLines.forEach((lineText, index) => {
    page.drawText(lineText, {
      x: 52,
      y: 126 - index * 10,
      size: 7.8,
      font: regular,
      color: muted,
    });
  });

  page.drawText(t.instrument, {
    x: 52,
    y: 52,
    size: 7.5,
    font: regular,
    color: muted,
  });
  page.drawText("craftid", {
    x: width - 108,
    y: 52,
    size: 8,
    font: bold,
    color: navy,
  });

  return pdf.save();
}
