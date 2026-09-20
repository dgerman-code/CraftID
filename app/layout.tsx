import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CraftID",
  description:
    "Professional identity, skills and evidence infrastructure for craftspeople and workshops.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
