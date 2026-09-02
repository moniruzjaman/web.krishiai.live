import type { Metadata } from "next";
import { WeatherIntelligence } from "@/components/kwi/weather-intelligence";

export const metadata: Metadata = {
  title: "আবহাওয়া বুদ্ধিমত্তা | KrishiAI",
  description:
    "কৃষি-ভিত্তিক স্মার্ট আবহাওয়া বুদ্ধিমত্তা — ১৪ শ্রেণির ঝুঁকি বিশ্লেষণ, রোগের পূর্বাভাস, ফসল ক্যালেন্ডার ও AI সুপারিশ। বাংলাদেশের কৃষকদের জন্য বিনামূল্যে।",
  keywords: [
    "আবহাওয়া বুদ্ধিমত্তা",
    "কৃষি আবহাওয়া",
    "ফসল ঝুঁকি",
    "রোগ পূর্বাভাস",
    "weather intelligence",
    "agricultural weather",
    "crop risk",
    "KrishiAI",
  ],
  alternates: { canonical: "/weather-intelligence" },
  openGraph: {
    title: "আবহাওয়া বুদ্ধিমত্তা | KrishiAI",
    description:
      "১৪ শ্রেণির ঝুঁকি বিশ্লেষণ, রোগের পূর্বাভাস, ফসল ক্যালেন্ডার ও AI সুপারিশ — সম্পূর্ণ বিনামূল্যে।",
    type: "website",
    url: "/weather-intelligence",
    siteName: "KrishiAI",
  },
};

export default function WeatherIntelligencePage() {
  return <WeatherIntelligence />;
}
