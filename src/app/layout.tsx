import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import TopNavbar from "@/components/TopNavbar";
import BottomNav from "@/components/BottomNav";
import { LocationProvider } from "@/context/LocationContext";
import { LanguageProvider } from "@/context/LanguageContext";
import ClientShell from "@/components/ClientShell";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "KrishiAI – কৃষি AI প্ল্যাটফর্ম",
  description:
    "চাষাবাদের জন্য স্মার্ট ও নির্ভরযোগ্য",
  keywords: [
    "কৃষি",
    "KrishiAI",
    "বাংলাদেশ",
    "কৃষক",
    "ফসল",
    "ধান",
    "AI",
    "কৃষি প্রযুক্তি",
    "smart farming",
    "crop diagnosis",
    "agri-tech",
  ],
  authors: [{ name: "KrishiAI Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "64x64" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KrishiAI",
  },
  metadataBase: new URL("https://web.krishiai.live"),
  openGraph: {
    title: "KrishiAI – কৃষি AI প্ল্যাটফর্ম",
    description: "চাষাবাদের জন্য স্মার্ট ও নির্ভরযোগ্য",
    type: "website",
    url: "/",
    siteName: "KrishiAI",
    images: [
      {
        url: "/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "KrishiAI – কৃষি AI প্ল্যাটফর্ম",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KrishiAI – কৃষি AI প্ল্যাটফর্ম",
    description: "চাষাবাদের জন্য স্মার্ট ও নির্ভরযোগ্য",
    images: ["/logo.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@300;400;500;600;700;800&display=swap"
        />
        <meta name="theme-color" content="#0b6623" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className="antialiased bg-background text-foreground"
        style={{ fontFamily: "var(--font-bengali), sans-serif" }}
      >
        <Providers>
          <LanguageProvider>
          <LocationProvider>
            {/* Mobile shell — max-width centered, sticky nav */}
            <div className="flex flex-col min-h-dvh mx-auto w-full max-w-[768px] md:max-w-[768px] lg:max-w-[900px] xl:max-w-[1024px] bg-white dark:bg-gray-900 relative">
              <TopNavbar />
              <main className="flex-1 pb-16">
                {children}
              </main>
              <BottomNav />
            </div>
          </LocationProvider>
          </LanguageProvider>
          <ClientShell />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
