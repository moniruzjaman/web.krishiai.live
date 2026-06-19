import type { Metadata, Viewport } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import TopNavbar from "@/components/TopNavbar";
import BottomNav from "@/components/BottomNav";
import { LocationProvider } from "@/context/LocationContext";
import ClientShell from "@/components/ClientShell";
import { ThemeProvider } from "@/components/ThemeProvider";

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1b4332",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "KrishiAI — চাষিদের জন্য স্মার্ট ও নির্ভরযোগ্য",
  description:
    "বাংলাদেশের কৃষকদের জন্য তথ্য-প্রযুক্তি নির্ভর কৃষি সেবা — ফসলের রোগ চিহ্নিত করুন, সার ও বীজের পরামর্শ নিন।",
  keywords: [
    "কৃষি",
    "KrishiAI",
    "বাংলাদেশ",
    "কৃষক",
    "ফসল",
    "ধান",
    "AI",
    "কৃষি প্রযুক্তি",
  ],
  authors: [{ name: "KrishiAI Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KrishiAI",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    title: "KrishiAI — চাষিদের জন্য স্মার্ট ও নির্ভরযোগ্য",
    description: "বাংলাদেশের কৃষকদের জন্য AI-চালিত কৃষি প্ল্যাটফর্ম",
    type: "website",
    siteName: "KrishiAI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body
        className={`${notoSansBengali.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: "var(--font-bengali), sans-serif" }}
      >
        <ThemeProvider>
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
          <ClientShell />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
