/**
 * KrishiAI — Bangladesh Agriculture AI Platform
 *
 * Complete home page with enhanced sections:
 * - Hero with live pulse indicator, animated badge, trust signals
 * - Seasonal tip banner (dynamic based on current month)
 * - Stats bar with icons and descriptions
 * - Live dashboard (5 widgets: Gallery, Weather, Map, Market, News)
 * - Testimonials carousel
 * - Metrics with trend indicators
 * - Ecosystem tools with descriptions and features
 * - Bilingual support (Bengali / English) via LanguageContext
 */

"use client";

import { useMemo } from "react";
import PhotoGallery from "@/components/PhotoGallery";
import WeatherWidget from "@/components/WeatherWidget";
import MapWidget from "@/components/MapWidget";
import MarketWidget from "@/components/MarketWidget";
import NewsWidget from "@/components/NewsWidget";
import AIChatWidget from "@/components/AIChatWidget";
import { useLanguage } from "@/context/LanguageContext";

// ── Bilingual helper ─────────────────────────────────────────────────────────
type Lang = "bn" | "en";
function t(bn: string, en: string, lang: Lang): string {
  return lang === "en" ? en : bn;
}

// ── Tool type ──────────────────────────────────────────────────────────────────
interface Tool {
  icon: string;
  title: { bn: string; en: string };
  cat: string;
  catColor: string;
  bg: string;
  desc: { bn: string; en: string };
  features: { bn: string; en: string }[];
  url: string;
  comingSoon?: boolean;
}

// ── Tools data (enhanced with bilingual descriptions and features) ──────────
const TOOLS: Tool[] = [
  {
    icon: "🔬",
    title: { bn: "ফসল রোগ নির্ণয়", en: "Crop Disease Diagnosis" },
    cat: "PLANT HEALTH",
    catColor: "#ca8a04",
    bg: "#fef9c3",
    desc: { bn: "CABI Plantwise পদ্ধতিতে পেশাদার রোগ নির্ণয় — বর্জন বিশ্লেষণ, রোগ ত্রিভুজ, IPM পরামর্শ", en: "Professional disease diagnosis using CABI Plantwise method — exclusion analysis, disease triangle, IPM advice" },
    features: [{ bn: "CABI বর্জন পদ্ধতি", en: "CABI Exclusion" }, { bn: "রোগ ত্রিভুজ", en: "Disease Triangle" }, { bn: "IPM পরামর্শ", en: "IPM Advice" }],
    url: "/analyzer",
  },
  {
    icon: "🛰️",
    title: { bn: "স্যাটেলাইট মনিটরিং", en: "Satellite Monitoring" },
    cat: "SATELLITE TECH",
    catColor: "#1d4ed8",
    bg: "#dbeafe",
    desc: { bn: "স্যাটেলাইট থেকে ফসলের স্বাস্থ্য, NDVI ম্যাপিং ও বৃদ্ধি পর্যবেক্ষণ", en: "Crop health from satellite, NDVI mapping & growth monitoring" },
    features: [{ bn: "NDVI ম্যাপিং", en: "NDVI Mapping" }, { bn: "ফসল স্বাস্থ্য", en: "Crop Health" }, { bn: "বৃদ্ধি ট্র্যাকিং", en: "Growth Tracking" }],
    url: "/tools/satellite",
  },
  {
    icon: "🌾",
    title: { bn: "শস্য তথ্যভাণ্ডার", en: "Crop Library" },
    cat: "CROP LIBRARY",
    catColor: "#166534",
    bg: "#dcfce7",
    desc: { bn: "২০০+ ফসলের বিস্তারিত চাষ পদ্ধতি, রোগ প্রতিকার ও যত্ন নির্দেশিকা", en: "Detailed cultivation methods, disease remedies & care guides for 200+ crops" },
    features: [{ bn: "২০০+ ফসল", en: "200+ Crops" }, { bn: "চাষ পদ্ধতি", en: "Cultivation Methods" }, { bn: "রোগ প্রতিকার", en: "Disease Remedies" }],
    url: "/tools/crop-library",
  },
  {
    icon: "🏺",
    title: { bn: "মৃত্তিকা বিশেষজ্ঞ", en: "Soil Expert" },
    cat: "SOIL SCIENCE",
    catColor: "#9d174d",
    bg: "#fce7f3",
    desc: { bn: "মাটির গুণমান পরীক্ষা, পুষ্টি বিশ্লেষণ ও সারের সুনির্দিষ্ট মাত্রা নির্ধারণ", en: "Soil quality testing, nutrient analysis & precise fertilizer rate calculation" },
    features: [{ bn: "সার ক্যালকুলেটর", en: "Fertilizer Calc" }, { bn: "pH বিশ্লেষণ", en: "pH Analysis" }, { bn: "মাটি নির্ণয়", en: "Soil Diagnosis" }],
    url: "/tools/soil",
  },
  {
    icon: "📈",
    title: { bn: "ফলন পূর্বাভাস", en: "Yield Forecast" },
    cat: "YIELD FORECAST",
    catColor: "#6d28d9",
    bg: "#ede9fe",
    desc: { bn: "ফসল ভিত্তিক ফলন অনুমান, আয় হিসাব, মৌসুম ক্যালেন্ডার ও ঝুঁকি মূল্যায়ন", en: "Crop-based yield estimation, income calculation, season calendar & risk assessment" },
    features: [{ bn: "ফলন অনুমান", en: "Yield Estimation" }, { bn: "আয় হিসাব", en: "Income Calc" }, { bn: "মৌসুম ক্যালেন্ডার", en: "Season Calendar" }],
    url: "/tools/yield",
  },
  {
    icon: "🧪",
    title: { bn: "বালাইনাশক বিশেষজ্ঞ", en: "Pesticide Expert" },
    cat: "PESTICIDE EXPERT",
    catColor: "#b45309",
    bg: "#fef3c7",
    desc: { bn: "কীটনাশক নির্বাচন, মিক্সিং চেকার, IRAC রোটেশন ও সতর্কতা নির্দেশিকা", en: "Pesticide selection, mixing checker, IRAC rotation & safety guidelines" },
    features: [{ bn: "মিক্সিং চেকার", en: "Mixing Checker" }, { bn: "IRAC রোটেশন", en: "IRAC Rotation" }, { bn: "সতর্কতা", en: "Safety Guide" }],
    url: "/tools/pesticide",
  },
  {
    icon: "📅",
    title: { bn: "ফসল ক্যালেন্ডার", en: "Crop Calendar" },
    cat: "CROP CALENDAR",
    catColor: "#0891b2",
    bg: "#ecfeff",
    desc: { bn: "বাংলাদেশের ১০টি প্রধান ফসলের মৌসুম ক্যালেন্ডার, রোগ ও পোকার ঝুঁকি সতর্কতা", en: "Season calendar for 10 major Bangladesh crops, disease & pest risk alerts" },
    features: [{ bn: "মৌসুম ক্যালেন্ডার", en: "Season Calendar" }, { bn: "রোগ ঝুঁকি", en: "Disease Risk" }, { bn: "চাষ পরামর্শ", en: "Cultivation Tips" }],
    url: "/tools/crop-calendar",
  },
  {
    icon: "🧠",
    title: { bn: "স্মার্ট সিদ্ধান্ত", en: "Smart Decision" },
    cat: "SMART DECISION",
    catColor: "#7c3aed",
    bg: "#f5f3ff",
    desc: { bn: "আবহাওয়া, বাজার মূল্য ও মৌসুম তথ্য মিলিয়ে সেরা ফসল নির্বাচন ও সেচ পরিকল্পনা", en: "Best crop selection & irrigation planning based on weather, market prices & seasonal data" },
    features: [{ bn: "ফসল সুপারিশ", en: "Crop Recs" }, { bn: "মূল্য পূর্বাভাস", en: "Price Forecast" }, { bn: "সেচ পরিকল্পনা", en: "Irrigation Plan" }],
    url: "/tools/smart-decision",
  },
  {
    icon: "🎓",
    title: { bn: "কৃষি শিখন কেন্দ্র", en: "Learning Center" },
    cat: "LEARNING CENTER",
    catColor: "#c2410c",
    bg: "#ffedd5",
    desc: { bn: "কৃষি টিপস, প্রশিক্ষণ মডিউল, কুইজ ও কৃষি জ্ঞান ভাণ্ডার", en: "Agriculture tips, training modules, quizzes & knowledge base" },
    features: [{ bn: "কৃষি টিপস", en: "Agri Tips" }, { bn: "প্রশিক্ষণ", en: "Training" }, { bn: "কুইজ", en: "Quiz" }],
    url: "/learn",
  },
  {
    icon: "🏛️",
    title: { bn: "সরকারি সেবা ও ভর্তুকি", en: "Govt Services & Subsidy" },
    cat: "GOVT SERVICES",
    catColor: "#065f46",
    bg: "#ecfdf5",
    desc: { bn: "সরকারি কৃষি প্রকল্প, সার-বীজ ভর্তুকি, প্রণোদনা ও ঋণ সুবিধার তথ্য", en: "Govt agriculture programs, fertilizer-seed subsidies, incentives & loan info" },
    features: [{ bn: "সার ভর্তুকি", en: "Fertilizer Subsidy" }, { bn: "প্রণোদনা", en: "Incentives" }, { bn: "কৃষি ঋণ", en: "Agri Loans" }],
    url: "https://dae.gov.bd",
  },
  {
    icon: "💧",
    title: { bn: "স্মার্ট সেচ ব্যবস্থাপনা", en: "Smart Irrigation" },
    cat: "IRRIGATION",
    catColor: "#0e7490",
    bg: "#ecfeff",
    desc: { bn: "আবহাওয়া ভিত্তিক সেচ সময়সূচি, পানি ক্যালকুলেটর ও পানি সাশ্রয়ী প্রযুক্তি", en: "Weather-based irrigation schedule, water calculator & water-saving technology" },
    features: [{ bn: "সেচ সময়সূচি", en: "Irrigation Schedule" }, { bn: "পানি ক্যালকুলেটর", en: "Water Calc" }, { bn: "পানি সাশ্রয়", en: "Water Saving" }],
    url: "/tools/irrigation",
  },
  {
    icon: "🛡️",
    title: { bn: "ফসল বীমা ও ঋণ", en: "Crop Insurance & Loan" },
    cat: "FINANCE",
    catColor: "#6d28d9",
    bg: "#f5f3ff",
    desc: { bn: "ফসল বীমা, কৃষি ঋণ, সরকারি প্রণোদনা ও আর্থিক সুরক্ষা সংক্রান্ত নির্দেশিকা", en: "Crop insurance, agri loans, govt incentives & financial protection guidelines" },
    features: [{ bn: "ফসল বীমা", en: "Crop Insurance" }, { bn: "কৃষি ঋণ", en: "Agri Loans" }, { bn: "আর্থিক সুরক্ষা", en: "Financial Protection" }],
    url: "https://moa.gov.bd",
  },
];

// ── Stats data (bilingual) ───────────────────────────────────────────────────
const STATS = [
  { icon: "🆓", value: "১০০%", valueEn: "100%", label: { bn: "বিনামূল্যে সেবা", en: "Free Service" } },
  { icon: "🤖", value: "১৫+", valueEn: "15+", label: { bn: "AI মডেল সক্রিয়", en: "AI Models Active" } },
  { icon: "🌾", value: "২০০+", valueEn: "200+", label: { bn: "ফসলের তথ্যভাণ্ডার", en: "Crop Database" } },
  { icon: "📍", value: "৬৪", valueEn: "64", label: { bn: "জেলা কভারেজ", en: "District Coverage" } },
];

// ── Metrics (bilingual) ───────────────────────────────────────────────────────
const METRICS = [
  { value: "১০+", valueEn: "10+", label: { bn: "AI টুলস", en: "AI Tools" } },
  { value: "৩০+", valueEn: "30+", label: { bn: "AEZ জোন", en: "AEZ Zones" } },
  { value: "২০০+", valueEn: "200+", label: { bn: "ফসল তথ্য", en: "Crop Info" } },
  { value: "৭×২৪", valueEn: "7×24", label: { bn: "সহায়তা", en: "Support" } },
];

// ── Seasonal Tip Banner (bilingual) ──────────────────────────────────────────
const SEASONAL_TIPS: Record<number, { season: { bn: string; en: string }; tip: { bn: string; en: string }; icon: string; color: string; bg: string }> = {
  1:  { season: { bn: "শীত", en: "Winter" }, tip: { bn: "রবি মৌসুমের ফসল চাষের সঠিক সময় — গম, সরিষা, আলু লাগান", en: "Right time for Rabi season crops — plant wheat, mustard, potato" }, icon: "❄️", color: "text-blue-700", bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" },
  2:  { season: { bn: "শীত", en: "Winter" }, tip: { bn: "বীজতলা তৈরি করুন, সার প্রয়োগ ও সেচ ব্যবস্থা নিশ্চিত করুন", en: "Prepare seedbeds, apply fertilizer & ensure irrigation" }, icon: "🌱", color: "text-blue-700", bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" },
  3:  { season: { bn: "বসন্ত", en: "Spring" }, tip: { bn: "বোরো ধানের যত্ন নিন, সেচ ও সার ব্যবস্থা নিশ্চিত করুন", en: "Take care of Boro rice, ensure irrigation & fertilizer" }, icon: "🌸", color: "text-pink-700", bg: "bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800" },
  4:  { season: { bn: "বসন্ত", en: "Spring" }, tip: { bn: "বোরো ধানের রোগবালাই প্রতিরোধ ও পরামর্শ নিন", en: "Prevent & get advice for Boro rice diseases" }, icon: "🌾", color: "text-pink-700", bg: "bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800" },
  5:  { season: { bn: "গ্রীষ্ম", en: "Summer" }, tip: { bn: "আউশ ধান চাষের প্রস্তুতি ও গ্রীষ্মকালীন সবজি লাগান", en: "Prepare for Aus rice & plant summer vegetables" }, icon: "☀️", color: "text-amber-700", bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" },
  6:  { season: { bn: "গ্রীষ্ম", en: "Summer" }, tip: { bn: "আমন ধানের বীজতলা তৈরি ও জমি প্রস্তুত করুন", en: "Prepare Aman rice seedbed & get land ready" }, icon: "🌤️", color: "text-amber-700", bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" },
  7:  { season: { bn: "বর্ষা", en: "Monsoon" }, tip: { bn: "আমন ধান রোপণ, পাট চাষ ও বন্যা প্রতিরোধ ব্যবস্থা নিন", en: "Plant Aman rice, cultivate jute & take flood prevention measures" }, icon: "🌧️", color: "text-teal-700", bg: "bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800" },
  8:  { season: { bn: "বর্ষা", en: "Monsoon" }, tip: { bn: "সার প্রয়োগ, আগাছা পরিষ্কার ও পোকামাকড় দমন করুন", en: "Apply fertilizer, clear weeds & control pests" }, icon: "💦", color: "text-teal-700", bg: "bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800" },
  9:  { season: { bn: "বর্ষা", en: "Monsoon" }, tip: { bn: "আমন ধানের যত্ন, রোগ প্রতিরোধ ও ফসল সংরক্ষণ", en: "Care for Aman rice, prevent diseases & preserve crops" }, icon: "🍃", color: "text-teal-700", bg: "bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800" },
  10: { season: { bn: "শরৎ", en: "Autumn" }, tip: { bn: "আমন ধান কাটার প্রস্তুতি, রবি মৌসুমের পরিকল্পনা করুন", en: "Prepare for Aman rice harvest, plan Rabi season" }, icon: "🍂", color: "text-orange-700", bg: "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800" },
  11: { season: { bn: "হেমন্ত", en: "Late Autumn" }, tip: { bn: "রবি মৌসুমের ফসল চাষ শুরু — আলু, পেঁয়াজ, রসুন লাগান", en: "Start Rabi season crops — plant potato, onion, garlic" }, icon: "🌾", color: "text-amber-700", bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" },
  12: { season: { bn: "হেমন্ত", en: "Late Autumn" }, tip: { bn: "শীতকালীন সবজি চাষ, বীজতলা প্রস্তুত ও সারের ব্যবস্থা করুন", en: "Grow winter vegetables, prepare seedbeds & arrange fertilizer" }, icon: "🌱", color: "text-amber-700", bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" },
};

// ── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { lang } = useLanguage();
  const month = useMemo(() => new Date().getMonth() + 1, []);
  const seasonalTip = SEASONAL_TIPS[month];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* ═══ HERO ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] px-4 pt-8 pb-10 sm:px-6 sm:pt-12 sm:pb-14 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 text-[120px]">🌾</div>
          <div className="absolute bottom-10 right-10 text-[100px]">🌿</div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse-dot" />
            <span className="text-white/90 text-[11px] font-semibold">
              {t("AI-চালিত কৃষি প্ল্যাটফর্ম · লাইভ", "AI-Powered Agri Platform · Live", lang)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
            {t("চাষিদের জন্য", "For Farmers", lang)}
            <br />
            <span className="text-green-300">{t("স্মার্ট ও নির্ভরযোগ্য", "Smart & Reliable", lang)}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/75 text-sm sm:text-base leading-relaxed mb-6 max-w-xl">
            {t(
              "বাংলাদেশের কৃষকদের জন্য তথ্য-প্রযুক্তি নির্ভর কৃষি সেবা — ফসলের রোগ চিহ্নিত করুন, আবহাওয়া ও বাজার মূল্য দেখুন, সার ও বীজের পরামর্শ নিন।",
              "IT-driven agriculture service for Bangladesh farmers — identify crop diseases, check weather & market prices, get fertilizer & seed advice.",
              lang
            )}
          </p>

          {/* CTA buttons */}
          <div className="flex gap-3 mb-6">
            <a href="#tools" className="bg-green-500 hover:bg-green-400 text-white font-bold text-sm rounded-full px-6 py-3 transition-colors shadow-lg shadow-green-500/25 active:scale-95 no-underline">
              {t("আমাদের সেবা", "Our Services", lang)}
            </a>
            <a href="#testimonial" className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-full px-6 py-3 border border-white/20 transition-colors active:scale-95 no-underline">
              {t("সাফল্যের গল্প", "Success Stories", lang)}
            </a>
          </div>

          {/* Trust signals */}
          <div className="flex gap-4 text-[10px] text-white/50">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              {t("কৃষি মন্ত্রণালয় অনুমোদিত", "Ministry of Agri Approved", lang)}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              {t("DAE সহযোগিতা", "DAE Partnership", lang)}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              {t("১০০% বিনামূল্যে", "100% Free", lang)}
            </span>
          </div>
        </div>
      </section>

      {/* ═══ SEASONAL TIP BANNER ═══════════════════════════════════════════════ */}
      {seasonalTip && (
        <section className="px-4 pt-3 pb-0 sm:px-6">
          <div className={`max-w-4xl mx-auto rounded-xl border p-3 flex items-start gap-2.5 ${seasonalTip.bg}`}>
            <span className="text-xl flex-shrink-0 mt-0.5">{seasonalTip.icon}</span>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] font-bold ${seasonalTip.color} mb-0.5`}>
                {seasonalTip.season[lang]} {t("মৌসুম · এই মাসের পরামর্শ", "Season · This Month's Tip", lang)}
              </div>
              <div className="text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed">
                {seasonalTip.tip[lang]}
              </div>
            </div>
            <a
              href="/chat"
              className={`text-[10px] font-bold ${seasonalTip.color} bg-white/60 dark:bg-gray-700/60 px-2.5 py-1 rounded-full border border-current/20 hover:bg-white dark:hover:bg-gray-600 transition-colors no-underline whitespace-nowrap flex-shrink-0`
              }
            >
              {t("AI জিজ্ঞাসা →", "Ask AI →", lang)}
            </a>
          </div>
        </section>
      )}

      {/* ═══ STATS BAR ══════════════════════════════════════════════════════════ */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-3">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-base mb-0.5">{s.icon}</div>
              <div className="text-lg sm:text-xl font-extrabold text-[#1b4332] dark:text-green-400">
                {lang === "en" ? s.valueEn : s.value}
              </div>
              <div className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                {s.label[lang]}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ LIVE DASHBOARD ═════════════════════════════════════════════════════ */}
      <section className="px-4 py-6 sm:px-6 sm:py-8 bg-gray-50/50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          {/* Section title */}
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse-dot" />
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">
              {t("লাইভ ড্যাশবোর্ড", "Live Dashboard", lang)}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">
              {t("স্বয়ংক্রিয় আপডেট · প্রতিদিন", "Auto Update · Daily", lang)}
            </span>
          </div>

          {/* 1. Photo Gallery */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600 dark:text-gray-400">
            📷 {t("কৃষি ফটো গ্যালারি", "Agriculture Photo Gallery", lang)}
          </div>
          <div className="mb-5">
            <PhotoGallery />
          </div>

          {/* 2. Weather Widget */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600 dark:text-gray-400">
            🌤️ {t("লাইভ আবহাওয়া ও কৃষি পরামর্শ", "Live Weather & Agri Advice", lang)}
          </div>
          <div className="mb-5">
            <WeatherWidget />
          </div>

          {/* 3. Map Widget */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600 dark:text-gray-400">
            🗺️ {t("কৃষি মানচিত্র — ১৫+ প্রতিষ্ঠান", "Agriculture Map — 15+ Institutions", lang)}
          </div>
          <div className="mb-5">
            <MapWidget />
          </div>

          {/* 4. Market Prices */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600 dark:text-gray-400">
            💰 {t("বাজার মূল্য — DAM লাইভ", "Market Prices — DAM Live", lang)}
          </div>
          <div className="mb-5">
            <MarketWidget />
          </div>

          {/* 5. News Widget */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600 dark:text-gray-400">
            📰 {t("কৃষি সংবাদ — .gov.bd পোর্টাল সহ", "Agriculture News — incl. .gov.bd", lang)}
          </div>
          <div className="mb-5">
            <NewsWidget />
          </div>

          {/* 6. AI Chat Widget */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600 dark:text-gray-400">
            🤖 {t("AI কৃষি সহকারী", "AI Agriculture Assistant", lang)}
          </div>
          <div className="mb-2">
            <AIChatWidget />
          </div>
        </div>
      </section>

      <div id="testimonial" />
      {/* ═══ TESTIMONIAL ═══════════════════════════════════════════════════════ */}
      <section className="px-4 py-8 sm:px-6 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-[14px] border border-gray-200 dark:border-gray-700 p-5 card-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-3xl">👨‍🌾</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {t("লতিফ সারদার, ৫৬", "Latif Sardar, 56", lang)}
                </div>
                <div className="text-yellow-500 text-sm">★★★★★</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t("ধান চাষী · মুন্সীগঞ্জ", "Rice Farmer · Munshiganj", lang)}
                </div>
              </div>
              <span className="text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5">
                {t("যাচাইকৃত", "Verified", lang)}
              </span>
            </div>
            <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              {lang === "en" ? (
                <>
                  &ldquo;Using Krishi AI, I quickly identified disease in my rice crop and took timely action. By checking weather forecasts and market prices, I sold my crop at the right time and the yield was much better than before.&rdquo;
                </>
              ) : (
                <>
                  &ldquo;কৃষি AI ব্যবহার করে আমার ধান ফসলের রোগ দ্রুত সনাক্ত করতে
                  পেরেছি এবং সঠিক সময়ে ব্যবস্থা নিতে পেরেছি। আবহাওয়া পূর্বাভাস ও বাজার মূল্য
                  দেখে সঠিক সময়ে ফসল বিক্রি করতে পেরে ফলন আগের চেয়ে অনেক ভালো।&rdquo;
                </>
              )}
            </p>
            <a href="/learn" className="text-[12px] font-semibold text-green-700 hover:text-green-600 transition-colors no-underline">
              {t("আরও সাফল্যের গল্প →", "More Success Stories →", lang)}
            </a>
          </div>
        </div>
      </section>

      {/* ═══ METRICS ═══════════════════════════════════════════════════════════ */}
      <section className="px-4 py-6 sm:px-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-3">
          {METRICS.map((m, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700 card-shadow"
            >
              <div className="text-lg font-extrabold text-[#1b4332] dark:text-green-400">
                {lang === "en" ? m.valueEn : m.value}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{m.label[lang]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ ECOSYSTEM TOOLS ═══════════════════════════════════════════════════ */}
      <div id="tools" />
      <section className="px-4 py-8 sm:px-6 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-full px-3 py-1 mb-4">
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 tracking-wide">
              KRISHI TECH ECOSYSTEM
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight mb-2">
            {t("স্মার্ট", "Smart", lang)} <span className="text-green-600">{t("কৃষির", "Agriculture", lang)}</span>
            <br />
            {t("ইকোসিস্টেম", "Ecosystem", lang)}
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            {t(
              "কৃষকদের জন্য সম্পূর্ণ ডিজিটাল কৃষি সমাধান — AI থেকে স্যাটেলাইট পর্যন্ত।",
              "Complete digital agriculture solution for farmers — from AI to Satellite.",
              lang
            )}
          </p>

          {/* Tool cards — enhanced with hover animations and status indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TOOLS.map((tool, i) => (
              <a
                key={i}
                href={tool.comingSoon ? undefined : tool.url}
                {...(tool.url.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`flex items-start gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50/30 dark:hover:bg-green-900/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 card-shadow group no-underline ${
                  tool.comingSoon ? "opacity-60 cursor-default" : "cursor-pointer"
                }`}
                onClick={(e) => tool.comingSoon && e.preventDefault()}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                  style={{ background: tool.bg }}
                >
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="text-[10px] font-bold tracking-wide"
                      style={{ color: tool.catColor }}
                    >
                      {tool.cat}
                    </span>
                    {tool.comingSoon ? (
                      <span className="text-[8px] font-bold bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">{t("শীঘ্রই", "Soon", lang)}</span>
                    ) : (
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    )}
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-0.5">
                    {tool.title[lang]}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-1.5">
                    {tool.desc[lang]}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {tool.features.map((f, fi) => (
                      <span
                        key={fi}
                        className="text-[9px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full group-hover:bg-green-100 dark:group-hover:bg-green-900/30 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors"
                      >
                        {f[lang]}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 mt-1">
                  {tool.comingSoon ? null : (
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors group-hover:translate-x-0.5 duration-200">
                      →
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
