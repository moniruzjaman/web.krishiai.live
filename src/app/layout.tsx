import type { Metadata } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

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
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌾</text></svg>",
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
