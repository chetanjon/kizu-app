import type { Metadata, Viewport } from "next";
import { Archivo, Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import PwaRegister from "@/components/pwa-register";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const DESC =
  "A private taste space for you and your people. Drop the movies, music, and places you love — and let an AI read your group's vibe back to you.";

export const metadata: Metadata = {
  metadataBase: new URL("https://kizu.app"),
  title: {
    default: "kizu — good taste runs in the group",
    template: "%s · kizu",
  },
  description: DESC,
  applicationName: "kizu",
  keywords: ["kizu", "taste", "group", "movies", "music", "places", "recommendations", "friends"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://kizu.app",
    siteName: "kizu",
    title: "kizu — good taste runs in the group",
    description: DESC,
  },
  twitter: {
    card: "summary_large_image",
    title: "kizu — good taste runs in the group",
    description: DESC,
  },
  appleWebApp: { capable: true, title: "kizu", statusBarStyle: "default" },
};

// Lock the viewport so the installed PWA can't pinch / double-tap zoom — an
// accidental sideways gesture on the horizontal card rows was zooming the whole
// app with nothing to snap back to. viewportFit=cover keeps it under the notch.
export const viewport: Viewport = {
  themeColor: "#16130E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
      <body>{children}<PwaRegister /></body>
    </html>
  );
}
