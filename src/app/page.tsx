/**
 * KrishiAI — Bangladesh Agriculture AI Platform
 *
 * Complete home page with:
 * - Hero section
 * - Stats bar
 * - Live dashboard (5 widgets: Gallery, Weather, Map, Market, News)
 * - Testimonial card
 * - Metrics section
 * - Ecosystem tools
 * - Banner
 */

"use client";

import PhotoGallery from "@/components/PhotoGallery";
import WeatherWidget from "@/components/WeatherWidget";
import MapWidget from "@/components/MapWidget";
import MarketWidget from "@/components/MarketWidget";
import NewsWidget from "@/components/NewsWidget";

// ── Tools data ───────────────────────────────────────────────────────────────
const TOOLS = [
  { icon: "🔬", title: "অফিসিয়াল সায়েন্টিফিক অডিট", cat: "PLANT HEALTH", catColor: "#ca8a04", bg: "#fef9c3" },
  { icon: "🛰️", title: "স্যাটেলাইট মনিটরিং", cat: "SATELLITE TECH", catColor: "#1d4ed8", bg: "#dbeafe" },
  { icon: "🌾", title: "শস্য সুরক্ষা লাইব্রেরি", cat: "CROP LIBRARY", catColor: "#166534", bg: "#dcfce7" },
  { icon: "🏺", title: "মৃত্তিকা বিশেষজ্ঞ ও অডিট", cat: "SOIL SCIENCE", catColor: "#9d174d", bg: "#fce7f3" },
  { icon: "📈", title: "ফলন পূর্বাভাস", cat: "YIELD FORECAST", catColor: "#6d28d9", bg: "#ede9fe" },
  { icon: "🧪", title: "বালাইনাশক বিশেষজ্ঞ", cat: "PESTICIDE EXPERT", catColor: "#b45309", bg: "#fef3c7" },
  { icon: "🎓", title: "কৃষি শিখন কেন্দ্র", cat: "LEARNING CENTER", catColor: "#c2410c", bg: "#ffedd5" },
];

// ── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ═══ HERO ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] px-4 pt-8 pb-10 sm:px-6 sm:pt-12 sm:pb-14 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse-dot" />
            <span className="text-white/90 text-[11px] font-semibold">
              AI-চালিত কৃষি প্ল্যাটফর্ম
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
            চিহ্নিত করুন, সার ও বীজের পরামর্শ নিন।
          </p>

          {/* CTA buttons */}
          <div className="flex gap-3">
            <button className="bg-green-500 hover:bg-green-400 text-white font-bold text-sm rounded-full px-6 py-3 transition-colors shadow-lg shadow-green-500/25 active:scale-95">
              আমাদের সেবা
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-full px-6 py-3 border border-white/20 transition-colors active:scale-95">
              সাফল্যের গল্প
            </button>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ══════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-gray-100 px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-3">
          {[
            ["১০০%", "বিনামূল্যে"],
            ["১৫+", "AI মডেল"],
            ["২০০+", "ফসলের তথ্য"],
            ["৬৪", "জেলা"],
          ].map(([v, l], i) => (
            <div key={i} className="text-center">
              <div className="text-lg sm:text-xl font-extrabold text-[#1b4332]">
                {v}
              </div>
              <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
                {l}
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
            🌤️ লাইভ আবহাওয়া — আপনার অবস্থান
          </div>
          <div className="mb-5">
            <WeatherWidget />
          </div>

          {/* 3. Map Widget */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600">
            🗺️ কৃষি মানচিত্র
          </div>
          <div className="mb-5">
            <MapWidget />
          </div>

          {/* 4. Market Prices */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600">
            💰 বাজার মূল্য — DAM
          </div>
          <div className="mb-5">
            <MarketWidget />
          </div>

          {/* 5. News Widget (ENHANCED) */}
          <div className="mb-3 text-[12px] font-semibold text-gray-600">
            📰 কৃষি সংবাদ
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
              পেরেছি এবং সঠিক সময়ে ব্যবস্থা নিতে পেরেছি। ফলন আগের চেয়ে অনেক
              ভালো।&rdquo;
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
          {[
            ["১১.৫%", "ফলন বৃদ্ধি"],
            ["৮.৭ টি", "পরামর্শ"],
            ["১৪%", "খরচ সাশ্রয়"],
            ["৫১ মি+", "ব্যবহারকারী"],
          ].map(([v, l], i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-3 text-center border border-gray-100 card-shadow"
            >
              <div className="text-lg font-extrabold text-[#1b4332]">{v}</div>
              <div className="text-[10px] text-gray-500 font-medium">{l}</div>
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
            কৃষকদের জন্য সম্পূর্ণ ডিজিটাল কৃষি সমাধান।
          </p>

          {/* Tool cards */}
          <div className="space-y-3">
            {TOOLS.map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3.5 hover:border-green-300 hover:bg-green-50/30 transition-all cursor-pointer card-shadow group"
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
                  <div className="text-sm font-bold text-gray-900">
                    {t.title}
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-gray-400 group-hover:text-green-600 transition-colors flex-shrink-0">
                  বিস্তারিত দেখুন →
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
      <footer className="bg-[#0f2b1d] text-white/50 text-[11px] px-4 py-4 text-center mt-auto">
        © {new Date().getFullYear()} KrishiAI — বাংলাদেশের কৃষকদের জন্য
      </footer>
    </div>
  );
}
