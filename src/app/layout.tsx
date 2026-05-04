import type { Metadata } from "next";
import { Archivo, Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "kizu — witness what you're witnessing",
  description:
    "A private place for 5–20 friends. One back-camera photo a day. One wall, building slowly across the year.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plusJakarta.variable} ${spaceMono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
