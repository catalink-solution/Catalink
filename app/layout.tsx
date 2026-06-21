import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Catalink — Crée ton catalogue. Partage ton lien.",
  description:
    "Transforme tes réseaux sociaux en une boutique professionnelle accessible depuis un simple lien.",
  applicationName: "Catalink",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Catalink",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icons/icon-192", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
