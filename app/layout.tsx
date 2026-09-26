import type { Metadata } from "next";
import { headers } from "next/headers";
import { localeFrom, type Locale } from "@/lib/i18n";
import "./globals.css";

const descriptions: Record<Locale, string> = {
  en: "Professional identity, skills and evidence infrastructure for craftspeople and workshops.",
  fr: "Infrastructure européenne d’identité professionnelle, de compétences et de preuves pour les artisans et les ateliers.",
  de: "Europäische Infrastruktur für berufliche Identität, Kompetenzen und Nachweise für Handwerkerinnen, Handwerker und Werkstätten.",
  nl: "Europese infrastructuur voor professionele identiteit, vaardigheden en bewijs voor ambachtsprofessionals en werkplaatsen.",
  pl: "Europejska infrastruktura tożsamości zawodowej, umiejętności i dowodów dla rzemieślników i pracowni.",
  it: "Infrastruttura europea per identità professionale, competenze ed evidenze per artigiani e laboratori.",
  es: "Infraestructura europea de identidad profesional, competencias y evidencias para profesionales de la artesanía y talleres.",
  uk: "Європейська інфраструктура професійної ідентичності, навичок і доказів для майстрів та майстерень.",
};

async function requestLocale() {
  const requestHeaders = await headers();
  return localeFrom(requestHeaders.get("x-craftid-locale"));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale();
  return {
    title: "CraftID",
    description: descriptions[locale],
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await requestLocale();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
