/**
 * KrishiAI — Bangladesh Agriculture AI Platform
 *
 * Complete home page with enhanced sections:
 * - Hero with live pulse indicator, animated badge, trust signals
 * - Stats bar with icons and descriptions
 * - Live dashboard (5 widgets: Gallery, Weather, Map, Market, News)
 * - Testimonials carousel
 * - Metrics with trend indicators
 * - Ecosystem tools with descriptions and features
 * - CTA Banner
 * - Rich footer with navigation links
 */

"use client";

import PhotoGallery from "@/components/PhotoGallery";
import WeatherWidget from "@/components/WeatherWidget";
import MapWidget from "@/components/MapWidget";
import MarketWidget from "@/components/MarketWidget";
import NewsWidget from "@/components/NewsWidget";

// ── Tools data (enhanced with descriptions and features) ──────────────────────
const TOOLS = [
  {
    icon: "🔬",
    title: "অফিসিয়াল সায়েন্টিফিক অডিট",
    cat: "PLANT HEALTH",
    catColor: "#ca8a04",
    bg: "#fef9c3",
    desc: "AI-চালিত ফসল রোগ শনাক্তকরণ ও চিকিৎসা পরামর্শ",
    features: ["রোগ শনাক্ত", "চিকিৎসা পরামর্শ", "প্রতিরোধ ব্যবস্থা"],
  },
  {
    icon: "🛰️",
    title: "স্যাটেলাইট মনিটরিং",
    cat: "SATELLITE TECH",
    catColor: "#1d4ed8",
    bg: "#dbeafe",
    desc: "স্যাটেলাইট থেকে ফসলের স্বাস্থ্য ও বৃদ্ধি পর্যবেক্ষণ",
    features: ["NDVI ম্যাপিং", "ফসল স্বাস্থ্য", "বৃদ্ধি ট্র্যাকিং"],
  },
  {
    icon: "🌾",
    title: "শস্য সুরক্ষা লাইব্রেরি",
    cat: "CROP LIBRARY",
    catColor: "#166534",
    bg: "#dcfce7",
    desc: "২০০+ ফসলের বিস্তারিত চাষ পদ্ধতি ও যত্ন নির্দেশিকা",
    features: ["২০০+ ফসল", "চাষ পদ্ধতি", "যত্ন নির্দেশিকা"],
  },
  {
    icon: "🏺",
    title: "মৃত্তিকা বিশেষজ্ঞ ও অডিট",
    cat: "SOIL SCIENCE",
    catColor: "#9d174d",
    bg: "#fce7f3",
    desc: "মাটির গুণমান পরীক্ষা ও সারের সুনির্দিষ্ট মাত্রা নির্ধারণ",
    features: ["মাটি পরীক্ষা", "সার মাত্রা", "পুষ্টি বিশ্লেষণ"],
  },
  {
    icon: "📈",
    title: "ফলন পূর্বাভাস",
    cat: "YIELD FORECAST",
    catColor: "#6d28d9",
    bg: "#ede9fe",
    desc: "AI মডেল ভিত্তিক ফসলের ফলন পূর্বাভাস ও বাজার মূল্য প্রক্ষেপণ",
    features: ["ফলন পূর্বাভাস", "মূল্য প্রক্ষেপণ", "ঝুঁকি মূল্যায়ন"],
  },
  {
    icon: "🧪",
    title: "বালাইনাশক বিশেষজ্ঞ",
    cat: "PESTICIDE EXPERT",
    catColor: "#b45309",
    bg: "#fef3c7",
    desc: "নিরাপদ ও কার্যকর কীটনাশক নির্বাচন ও প্রয়োগ নির্দেশিকা",
    features: ["নিরাপদ নির্বাচন", "প্রয়োগ মাত্রা", "সতর্কতা"],
  },
  {
    icon: "🎓",
    title: "কৃষি শিখন কেন্দ্র",
    cat: "LEARNING CENTER",
    catColor: "#c2410c",
    bg: "#ffedd5",
    desc: "ভিডিও টিউটোরিয়াল, প্রশিক্ষণ মডিউল ও কৃষি জ্ঞান ভাণ্ডার",
    features: ["ভিডিও টিউটোরিয়াল", "প্রশিক্ষণ", "জ্ঞান ভাণ্ডার"],
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

// ── Footer links ──────────────────────────────────────────────────────────────
const FOOTER_LINKS = [
  { title: "সরকারি পোর্টাল", links: [
    { name: "কৃষি মন্ত্রণালয়", url: "https://moa.gov.bd" },
    { name: "DAE", url: "https://dae.gov.bd" },
    { name: "BRRI", url: "https://brri.gov.bd" },
    { name: "BARI", url: "https://bari.gov.bd" },
  ]},
  { title: "সেবাসমূহ", links: [
    { name: "আবহাওয়া", url: "https://bmd.gov.bd" },
    { name: "বাজার মূল্য", url: "https://market.dam.gov.bd" },
    { name: "কৃষি ঋণ", url: "https://bangladesh.gov.bd" },
    { name: "বীজ বিতরণ", url: "https://badc.gov.bd" },
  ]},
  { title: "কৃষি AI", links: [
    { name: "আমাদের সম্পর্কে", url: "#" },
    { name: "যোগাযোগ", url: "#" },
    { name: "গোপনীয়তা নীতি", url: "#" },
    { name: "শর্তাবলী", url: "#" },
  ]},
];

// ── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
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
            <button className="bg-green-500 hover:bg-green-400 text-white font-bold text-sm rounded-full px-6 py-3 transition-colors shadow-lg shadow-green-500/25 active:scale-95">
              আমাদের সেবা
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-full px-6 py-3 border border-white/20 transition-colors active:scale-95">
              সাফল্যের গল্প
            </button>
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

      {/* ═══ STATS BAR ══════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-gray-100 px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-3">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-base mb-0.5">{s.icon}</div>
              <div className="text-lg sm:text-xl font-extrabold text-[#1b4332]">
                {s.value}
              </div>
              <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ LIVE DASHBOARD ═════════════════════════════════════════════════════ */}
      <section className="px-4 py-6 sm:px-6 sm:py-8 bg-gray-50/50">
        <div className="max-w-4xl mx-auto">
          {/* Section title */}
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse-dot" />
            <span className="text-base font-bold text-gray-900">
              লাইভ ড্যাশবোর্ড
            </span>
            <span className="text-[10px] text-gray-400 ml-auto">
              স্বয়ংক্রিয় আপডেট · প্রতিদিন
            </span>
          </div>

          {/* 1. Photo Gallery */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600">
            📷 কৃষি ফটো গ্যালারি
          </div>
          <div className="mb-5">
            <PhotoGallery />
          </div>

          {/* 2. Weather Widget */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600">
            🌤️ লাইভ আবহাওয়া ও কৃষি পরামর্শ
          </div>
          <div className="mb-5">
            <WeatherWidget />
          </div>

          {/* 3. Map Widget */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600">
            🗺️ কৃষি মানচিত্র — ১৫+ প্রতিষ্ঠান
          </div>
          <div className="mb-5">
            <MapWidget />
          </div>

          {/* 4. Market Prices */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600">
            💰 বাজার মূল্য — DAM লাইভ
          </div>
          <div className="mb-5">
            <MarketWidget />
          </div>

          {/* 5. News Widget */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600">
            📰 কৃষি সংবাদ — .gov.bd পোর্টাল সহ
          </div>
          <div className="mb-2">
            <NewsWidget />
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIAL ═══════════════════════════════════════════════════════ */}
      <section className="px-4 py-8 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[14px] border border-gray-200 p-5 card-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-3xl">👨‍🌾</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-900">
                  লতিফ সারদার, ৫৬
                </div>
                <div className="text-yellow-500 text-sm">★★★★★</div>
                <div className="text-[11px] text-gray-500">
                  ধান চাষী · মুন্সীগঞ্জ
                </div>
              </div>
              <span className="text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5">
                যাচাইকৃত
              </span>
            </div>
            <p className="text-[13px] text-gray-700 leading-relaxed mb-3">
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
      <section className="px-4 py-6 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-3">
          {METRICS.map((m, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-3 text-center border border-gray-100 card-shadow"
            >
              <div className="text-lg font-extrabold text-[#1b4332]">{m.value}</div>
              <div className="text-[10px] text-gray-500 font-medium">{m.label}</div>
              <div className={`text-[9px] font-bold ${m.trendColor} mt-0.5`}>{m.trend} বৃদ্ধি</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ ECOSYSTEM TOOLS ═══════════════════════════════════════════════════ */}
      <section className="px-4 py-8 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 mb-4">
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-[10px] font-bold text-amber-700 tracking-wide">
              KRISHI TECH ECOSYSTEM
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-2">
            স্মার্ট <span className="text-green-600">কৃষির</span>
            <br />
            ইকোসিস্টেম
          </h2>

          <p className="text-sm text-gray-500 mb-6 max-w-md">
            কৃষকদের জন্য সম্পূর্ণ ডিজিটাল কৃষি সমাধান — AI থেকে স্যাটেলাইট পর্যন্ত।
          </p>

          {/* Tool cards — enhanced with descriptions and feature tags */}
          <div className="space-y-3">
            {TOOLS.map((t, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-3.5 hover:border-green-300 hover:bg-green-50/30 transition-all cursor-pointer card-shadow group"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: t.bg }}
                >
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[10px] font-bold tracking-wide mb-0.5"
                    style={{ color: t.catColor }}
                  >
                    {t.cat}
                  </div>
                  <div className="text-sm font-bold text-gray-900 mb-0.5">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-gray-500 leading-relaxed mb-1.5">
                    {t.desc}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {t.features.map((f, fi) => (
                      <span
                        key={fi}
                        className="text-[9px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-gray-400 group-hover:text-green-600 transition-colors flex-shrink-0 mt-1">
                  বিস্তারিত →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BANNER ════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-4">🇧🇩</div>
          <h3 className="text-white text-xl sm:text-2xl font-extrabold leading-tight mb-3">
            বিজয়ের কৃষি তার
            <br />
            বাংলাদেশের কৃষকদের জন্য
          </h3>
          <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-md mx-auto">
            দেশের ১ কোটি ৭৩ লক্ষ কৃষক পরিবারের জন্য আধুনিক কৃষি প্রযুক্তি
            সুলভ করাই আমাদের লক্ষ্য।
          </p>
          <button className="bg-white text-[#1b4332] font-bold text-sm rounded-full px-8 py-3 hover:bg-green-50 transition-colors shadow-lg active:scale-95">
            এখনই শুরু করুন →
          </button>
        </div>
      </section>

      {/* ═══ FOOTER ════════════════════════════════════════════════════════════ */}
      <footer className="bg-[#0f2b1d] px-4 py-8 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Footer navigation */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {FOOTER_LINKS.map((section, i) => (
              <div key={i}>
                <div className="text-[11px] font-bold text-white/80 mb-2">
                  {section.title}
                </div>
                <div className="space-y-1.5">
                  {section.links.map((link, li) => (
                    <a
                      key={li}
                      href={link.url}
                      target={link.url.startsWith("http") ? "_blank" : undefined}
                      rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="block text-[10px] text-white/40 hover:text-white/70 transition-colors no-underline"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-[11px] text-white/40">
              © {new Date().getFullYear()} KrishiAI — বাংলাদেশের কৃষকদের জন্য
            </div>
            <div className="flex items-center gap-3 text-[10px] text-white/30">
              <span>🌿 টেকসই কৃষি</span>
              <span>·</span>
              <span>🤖 AI-চালিত</span>
              <span>·</span>
              <span>🇧🇩 বাংলাদেশ</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
