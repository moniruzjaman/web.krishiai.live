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
 */

"use client";

import { useMemo } from "react";
import PhotoGallery from "@/components/PhotoGallery";
import WeatherWidget from "@/components/WeatherWidget";
import MapWidget from "@/components/MapWidget";
import MarketWidget from "@/components/MarketWidget";
import NewsWidget from "@/components/NewsWidget";
import AIChatWidget from "@/components/AIChatWidget";

// ── Tools data (enhanced with descriptions and features) ──────────────────────
const TOOLS = [
  {
    icon: "🔬",
    title: "ফসল রোগ নির্ণয়",
    cat: "PLANT HEALTH",
    catColor: "#ca8a04",
    bg: "#fef9c3",
    desc: "CABI Plantwise পদ্ধতিতে পেশাদার রোগ নির্ণয় — বর্জন বিশ্লেষণ, রোগ ত্রিভুজ, IPM পরামর্শ",
    features: ["CABI বর্জন পদ্ধতি", "রোগ ত্রিভুজ", "IPM পরামর্শ"],
    url: "/analyzer",
  },
  {
    icon: "🛰️",
    title: "স্যাটেলাইট মনিটরিং",
    cat: "SATELLITE TECH",
    catColor: "#1d4ed8",
    bg: "#dbeafe",
    desc: "স্যাটেলাইট থেকে ফসলের স্বাস্থ্য, NDVI ম্যাপিং ও বৃদ্ধি পর্যবেক্ষণ",
    features: ["NDVI ম্যাপিং", "ফসল স্বাস্থ্য", "বৃদ্ধি ট্র্যাকিং"],
    url: "/tools/satellite",
  },
  {
    icon: "🌾",
    title: "শস্য তথ্যভাণ্ডার",
    cat: "CROP LIBRARY",
    catColor: "#166534",
    bg: "#dcfce7",
    desc: "২০০+ ফসলের বিস্তারিত চাষ পদ্ধতি, রোগ প্রতিকার ও যত্ন নির্দেশিকা",
    features: ["২০০+ ফসল", "চাষ পদ্ধতি", "রোগ প্রতিকার"],
    url: "/tools/crop-library",
  },
  {
    icon: "🏺",
    title: "মৃত্তিকা বিশেষজ্ঞ",
    cat: "SOIL SCIENCE",
    catColor: "#9d174d",
    bg: "#fce7f3",
    desc: "মাটির গুণমান পরীক্ষা, পুষ্টি বিশ্লেষণ ও সারের সুনির্দিষ্ট মাত্রা নির্ধারণ",
    features: ["সার ক্যালকুলেটর", "pH বিশ্লেষণ", "মাটি নির্ণয়"],
    url: "/tools/soil",
  },
  {
    icon: "📈",
    title: "ফলন পূর্বাভাস",
    cat: "YIELD FORECAST",
    catColor: "#6d28d9",
    bg: "#ede9fe",
    desc: "ফসল ভিত্তিক ফলন অনুমান, আয় হিসাব, মৌসুম ক্যালেন্ডার ও ঝুঁকি মূল্যায়ন",
    features: ["ফলন অনুমান", "আয় হিসাব", "মৌসুম ক্যালেন্ডার"],
    url: "/tools/yield",
  },
  {
    icon: "🧪",
    title: "বালাইনাশক বিশেষজ্ঞ",
    cat: "PESTICIDE EXPERT",
    catColor: "#b45309",
    bg: "#fef3c7",
    desc: "কীটনাশক নির্বাচন, মিক্সিং চেকার, IRAC রোটেশন ও সতর্কতা নির্দেশিকা",
    features: ["মিক্সিং চেকার", "IRAC রোটেশন", "সতর্কতা"],
    url: "/tools/pesticide",
  },
  {
    icon: "📅",
    title: "ফসল ক্যালেন্ডার",
    cat: "CROP CALENDAR",
    catColor: "#0891b2",
    bg: "#ecfeff",
    desc: "বাংলাদেশের ১০টি প্রধান ফসলের মৌসুম ক্যালেন্ডার, রোগ ও পোকার ঝুঁকি সতর্কতা",
    features: ["মৌসুম ক্যালেন্ডার", "রোগ ঝুঁকি", "চাষ পরামর্শ"],
    url: "/tools/crop-calendar",
  },
  {
    icon: "🧠",
    title: "স্মার্ট সিদ্ধান্ত",
    cat: "SMART DECISION",
    catColor: "#7c3aed",
    bg: "#f5f3ff",
    desc: "আবহাওয়া, বাজার মূল্য ও মৌসুম তথ্য মিলিয়ে সেরা ফসল নির্বাচন ও সেচ পরিকল্পনা",
    features: ["ফসল সুপারিশ", "মূল্য পূর্বাভাস", "সেচ পরিকল্পনা"],
    url: "/tools/smart-decision",
  },
  {
    icon: "🎓",
    title: "কৃষি শিখন কেন্দ্র",
    cat: "LEARNING CENTER",
    catColor: "#c2410c",
    bg: "#ffedd5",
    desc: "কৃষি টিপস, প্রশিক্ষণ মডিউল, কুইজ ও কৃষি জ্ঞান ভাণ্ডার",
    features: ["কৃষি টিপস", "প্রশিক্ষণ", "কুইজ"],
    url: "/learn",
  },
  {
    icon: "🏛️",
    title: "সরকারি সেবা ও ভর্তুকি",
    cat: "GOVT SERVICES",
    catColor: "#065f46",
    bg: "#ecfdf5",
    desc: "সরকারি কৃষি প্রকল্প, সার-বীজ ভর্তুকি, প্রণোদনা ও ঋণ সুবিধার তথ্য",
    features: ["সার ভর্তুকি", "প্রণোদনা", "কৃষি ঋণ"],
    url: "https://dae.gov.bd",
  },
  {
    icon: "💧",
    title: "স্মার্ট সেচ ব্যবস্থাপনা",
    cat: "IRRIGATION",
    catColor: "#0e7490",
    bg: "#ecfeff",
    desc: "আবহাওয়া ভিত্তিক সেচ সময়সূচি, পানি ক্যালকুলেটর ও পানি সাশ্রয়ী প্রযুক্তি",
    features: ["সেচ সময়সূচি", "পানি ক্যালকুলেটর", "পানি সাশ্রয়"],
    url: "/tools/irrigation",
  },
  {
    icon: "🛡️",
    title: "ফসল বীমা ও ঋণ",
    cat: "FINANCE",
    catColor: "#6d28d9",
    bg: "#f5f3ff",
    desc: "ফসল বীমা, কৃষি ঋণ, সরকারি প্রণোদনা ও আর্থিক সুরক্ষা সংক্রান্ত নির্দেশিকা",
    features: ["ফসল বীমা", "কৃষি ঋণ", "আর্থিক সুরক্ষা"],
    url: "https://moa.gov.bd",
  },
];

// ── Stats data ────────────────────────────────────────────────────────────────
const STATS = [
  { icon: "🆓", value: "১০০%", label: "বিনামূল্যে সেবা" },
  { icon: "🤖", value: "১৫+", label: "AI মডেল সক্রিয়" },
  { icon: "🌾", value: "২০০+", label: "ফসলের তথ্যভাণ্ডার" },
  { icon: "📍", value: "৬৪", label: "জেলা কভারেজ" },
];

// ── Metrics ───────────────────────────────────────────────────────────────────
const METRICS = [
  { value: "১১.৫%", label: "ফলন বৃদ্ধি", trend: "↑", trendColor: "text-green-600" },
  { value: "৮.৭ টি", label: "প্রতিদিন পরামর্শ", trend: "↑", trendColor: "text-green-600" },
  { value: "১৪%", label: "খরচ সাশ্রয়", trend: "↑", trendColor: "text-green-600" },
  { value: "৫১ মি+", label: "ব্যবহারকারী", trend: "↑", trendColor: "text-green-600" },
];

// ── Seasonal Tip Banner ──────────────────────────────────────────────────────
const SEASONAL_TIPS: Record<number, { season: string; tip: string; icon: string; color: string; bg: string }> = {
  1:  { season: "শীত", tip: "রবি মৌসুমের ফসল চাষের সঠিক সময় — গম, সরিষা, আলু লাগান", icon: "❄️", color: "text-blue-700", bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" },
  2:  { season: "শীত", tip: "বীজতলা তৈরি করুন, সার প্রয়োগ ও সেচ ব্যবস্থা নিশ্চিত করুন", icon: "🌱", color: "text-blue-700", bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" },
  3:  { season: "বসন্ত", tip: "বোরো ধানের যত্ন নিন, সেচ ও সার ব্যবস্থা নিশ্চিত করুন", icon: "🌸", color: "text-pink-700", bg: "bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800" },
  4:  { season: "বসন্ত", tip: "বোরো ধানের রোগবালাই প্রতিরোধ ও পরামর্শ নিন", icon: "🌾", color: "text-pink-700", bg: "bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800" },
  5:  { season: "গ্রীষ্ম", tip: "আউশ ধান চাষের প্রস্তুতি ও গ্রীষ্মকালীন সবজি লাগান", icon: "☀️", color: "text-amber-700", bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" },
  6:  { season: "গ্রীষ্ম", tip: "আমন ধানের বীজতলা তৈরি ও জমি প্রস্তুত করুন", icon: "🌤️", color: "text-amber-700", bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" },
  7:  { season: "বর্ষা", tip: "আমন ধান রোপণ, পাট চাষ ও বন্যা প্রতিরোধ ব্যবস্থা নিন", icon: "🌧️", color: "text-teal-700", bg: "bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800" },
  8:  { season: "বর্ষা", tip: "সার প্রয়োগ, আগাছা পরিষ্কার ও পোকামাকড় দমন করুন", icon: "💦", color: "text-teal-700", bg: "bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800" },
  9:  { season: "বর্ষা", tip: "আমন ধানের যত্ন, রোগ প্রতিরোধ ও ফসল সংরক্ষণ", icon: "🍃", color: "text-teal-700", bg: "bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800" },
  10: { season: "শরৎ", tip: "আমন ধান কাটার প্রস্তুতি, রবি মৌসুমের পরিকল্পনা করুন", icon: "🍂", color: "text-orange-700", bg: "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800" },
  11: { season: "হেমন্ত", tip: "রবি মৌসুমের ফসল চাষ শুরু — আলু, পেঁয়াজ, রসুন লাগান", icon: "🌾", color: "text-amber-700", bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" },
  12: { season: "হেমন্ত", tip: "শীতকালীন সবজি চাষ, বীজতলা প্রস্তুত ও সারের ব্যবস্থা করুন", icon: "🌱", color: "text-amber-700", bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" },
};

// ── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
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
              AI-চালিত কৃষি প্ল্যাটফর্ম · লাইভ
            </span>
          </div>

          {/* Title */}
          <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
            চাষিদের জন্য
            <br />
            <span className="text-green-300">স্মার্ট ও নির্ভরযোগ্য</span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/75 text-sm sm:text-base leading-relaxed mb-6 max-w-xl">
            বাংলাদেশের কৃষকদের জন্য তথ্য-প্রযুক্তি নির্ভর কৃষি সেবা — ফসলের রোগ
            চিহ্নিত করুন, আবহাওয়া ও বাজার মূল্য দেখুন, সার ও বীজের পরামর্শ নিন।
          </p>

          {/* CTA buttons */}
          <div className="flex gap-3 mb-6">
            <a href="#tools" className="bg-green-500 hover:bg-green-400 text-white font-bold text-sm rounded-full px-6 py-3 transition-colors shadow-lg shadow-green-500/25 active:scale-95 no-underline">
              আমাদের সেবা
            </a>
            <a href="#testimonial" className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-full px-6 py-3 border border-white/20 transition-colors active:scale-95 no-underline">
              সাফল্যের গল্প
            </a>
          </div>

          {/* Trust signals */}
          <div className="flex gap-4 text-[10px] text-white/50">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              কৃষি মন্ত্রণালয় অনুমোদিত
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              DAE সহযোগিতা
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              ১০০% বিনামূল্যে
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
                {seasonalTip.season} মৌসুম · এই মাসের পরামর্শ
              </div>
              <div className="text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed">
                {seasonalTip.tip}
              </div>
            </div>
            <a
              href="/chat"
              className={`text-[10px] font-bold ${seasonalTip.color} bg-white/60 dark:bg-gray-700/60 px-2.5 py-1 rounded-full border border-current/20 hover:bg-white dark:hover:bg-gray-600 transition-colors no-underline whitespace-nowrap flex-shrink-0`
              }
            >
              AI জিজ্ঞাসা →
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
                {s.value}
              </div>
              <div className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ LIVE DASHBOARD ═════════════════════════════════════════════════════ */}
      <section className="px-4 py-6 sm:px-6 sm:py-8 bg-gray-50/50 dark:bg-gray-850">
        <div className="max-w-4xl mx-auto">
          {/* Section title */}
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse-dot" />
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">
              লাইভ ড্যাশবোর্ড
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">
              স্বয়ংক্রিয় আপডেট · প্রতিদিন
            </span>
          </div>

          {/* 1. Photo Gallery */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600 dark:text-gray-400">
            📷 কৃষি ফটো গ্যালারি
          </div>
          <div className="mb-5">
            <PhotoGallery />
          </div>

          {/* 2. Weather Widget */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600 dark:text-gray-400">
            🌤️ লাইভ আবহাওয়া ও কৃষি পরামর্শ
          </div>
          <div className="mb-5">
            <WeatherWidget />
          </div>

          {/* 3. Map Widget */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600 dark:text-gray-400">
            🗺️ কৃষি মানচিত্র — ১৫+ প্রতিষ্ঠান
          </div>
          <div className="mb-5">
            <MapWidget />
          </div>

          {/* 4. Market Prices */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600 dark:text-gray-400">
            💰 বাজার মূল্য — DAM লাইভ
          </div>
          <div className="mb-5">
            <MarketWidget />
          </div>

          {/* 5. News Widget */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600 dark:text-gray-400">
            📰 কৃষি সংবাদ — .gov.bd পোর্টাল সহ
          </div>
          <div className="mb-5">
            <NewsWidget />
          </div>

          {/* 6. AI Chat Widget */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600 dark:text-gray-400">
            🤖 AI কৃষি সহকারী
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
                  লতিফ সারদার, ৫৬
                </div>
                <div className="text-yellow-500 text-sm">★★★★★</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                  ধান চাষী · মুন্সীগঞ্জ
                </div>
              </div>
              <span className="text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5">
                যাচাইকৃত
              </span>
            </div>
            <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              &ldquo;কৃষি AI ব্যবহার করে আমার ধান ফসলের রোগ দ্রুত সনাক্ত করতে
              পেরেছি এবং সঠিক সময়ে ব্যবস্থা নিতে পেরেছি। আবহাওয়া পূর্বাভাস ও বাজার মূল্য
              দেখে সঠিক সময়ে ফসল বিক্রি করতে পেরে ফলন আগের চেয়ে অনেক ভালো।&rdquo;
            </p>
            <button className="text-[12px] font-semibold text-green-700 hover:text-green-600 transition-colors">
              আরও সাফল্যের গল্প →
            </button>
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
              <div className="text-lg font-extrabold text-[#1b4332] dark:text-green-400">{m.value}</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{m.label}</div>
              <div className={`text-[9px] font-bold ${m.trendColor} mt-0.5`}>{m.trend} বৃদ্ধি</div>
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
            স্মার্ট <span className="text-green-600">কৃষির</span>
            <br />
            ইকোসিস্টেম
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            কৃষকদের জন্য সম্পূর্ণ ডিজিটাল কৃষি সমাধান — AI থেকে স্যাটেলাইট পর্যন্ত।
          </p>

          {/* Tool cards — enhanced with hover animations and status indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TOOLS.map((t, i) => (
              <a
                key={i}
                href={(t as Record<string, unknown>).comingSoon ? undefined : t.url}
                className={`flex items-start gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50/30 dark:hover:bg-green-900/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 card-shadow group no-underline ${
                  (t as Record<string, unknown>).comingSoon ? "opacity-60 cursor-default" : "cursor-pointer"
                }`}
                onClick={(e) => (t as Record<string, unknown>).comingSoon && e.preventDefault()}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                  style={{ background: t.bg }}
                >
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="text-[10px] font-bold tracking-wide"
                      style={{ color: t.catColor }}
                    >
                      {t.cat}
                    </span>
                    {(t as Record<string, unknown>).comingSoon ? (
                      <span className="text-[8px] font-bold bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">শীঘ্রই</span>
                    ) : (
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    )}
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-0.5">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-1.5">
                    {t.desc}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {t.features.map((f, fi) => (
                      <span
                        key={fi}
                        className="text-[9px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full group-hover:bg-green-100 dark:group-hover:bg-green-900/30 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 mt-1">
                  {(t as Record<string, unknown>).comingSoon ? null : (
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
