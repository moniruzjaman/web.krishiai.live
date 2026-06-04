"use client";

import Link from "next/link";

const TOOLS = [
  {
    icon: "🌿",
    title: "উদ্ভিদ স্বাস্থ্য বিশেষজ্ঞ",
    sub: "ছবি তুলে রোগ সনাক্ত করুন",
    cat: "PLANT HEALTH",
    catColor: "#ca8a04",
    bg: "linear-gradient(135deg,#fef9c3,#fef3c7)",
    to: "/tools/plant-health",
    badge: "AI চালিত",
  },
  {
    icon: "🧪",
    title: "বালাইনাশক বিশেষজ্ঞ",
    sub: "মিক্সিং চেক, IRAC রোটেশন ও সতর্কতা",
    cat: "PESTICIDE",
    catColor: "#b91c1c",
    bg: "linear-gradient(135deg,#fee2e2,#fce7f3)",
    to: "/tools/pesticide",
    badge: "সক্রিয়",
  },
  {
    icon: "🏺",
    title: "মৃত্তিকা অডিট",
    sub: "সার ক্যালকুলেটর, pH বিশ্লেষণ ও মাটি নির্ণয়",
    cat: "SOIL SCIENCE",
    catColor: "#9d174d",
    bg: "linear-gradient(135deg,#fce7f3,#ede9fe)",
    to: "/tools/soil",
    badge: "সক্রিয়",
  },
  {
    icon: "🌾",
    title: "শস্য সুরক্ষা লাইব্রেরি",
    sub: "১৫+ ফসলের বিস্তারিত চাষ পদ্ধতি ও পরামর্শ",
    cat: "CROP LIBRARY",
    catColor: "#166534",
    bg: "linear-gradient(135deg,#dcfce7,#d1fae5)",
    to: "/tools/crop-library",
    badge: "সক্রিয়",
  },
  {
    icon: "📈",
    title: "ফলন পূর্বাভাস",
    sub: "ফলন অনুমান, আয় হিসাব ও মৌসুম ক্যালেন্ডার",
    cat: "YIELD FORECAST",
    catColor: "#6d28d9",
    bg: "linear-gradient(135deg,#ede9fe,#dbeafe)",
    to: "/tools/yield",
    badge: "সক্রিয়",
  },
  {
    icon: "💧",
    title: "স্মার্ট সেচ ব্যবস্থাপনা",
    sub: "সেচ সময়সূচি, পানি ক্যালকুলেটর ও সাশ্রয়ী প্রযুক্তি",
    cat: "IRRIGATION",
    catColor: "#0e7490",
    bg: "linear-gradient(135deg,#ecfeff,#cffafe)",
    to: "/tools/irrigation",
    badge: "সক্রিয়",
  },
  {
    icon: "🛰️",
    title: "স্যাটেলাইট মনিটরিং",
    sub: "জমির স্বাস্থ্য পর্যবেক্ষণ",
    cat: "SATELLITE",
    catColor: "#1d4ed8",
    bg: "linear-gradient(135deg,#dbeafe,#ede9fe)",
    to: "/tools/satellite",
    badge: "শীঘ্রই",
  },
];

const ECOSYSTEM = [
  {
    url: "https://cabi.krishiai.live/",
    icon: "🌿",
    title: "CABI Plant Analyzer",
    badge: "সংযুক্ত",
    badgeColor: "#16a34a",
    desc: "এখনই ব্যবহার করুন →",
  },
  {
    url: "https://soil.krishiai.live/",
    icon: "🏺",
    title: "Soil Expert",
    badge: "শীঘ্রই",
    badgeColor: "#9ca3af",
    desc: "শীঘ্রই চালু হবে",
  },
  {
    url: "https://satellite.krishiai.live/",
    icon: "🛰️",
    title: "Satellite Monitor",
    badge: "শীঘ্রই",
    badgeColor: "#9ca3af",
    desc: "শীঘ্রই চালু হবে",
  },
  {
    url: "https://market.krishiai.live/",
    icon: "💰",
    title: "Market Prices",
    badge: "শীঘ্রই",
    badgeColor: "#9ca3af",
    desc: "শীঘ্রই চালু হবে",
  },
  {
    url: "https://weather.krishiai.live/",
    icon: "🌤️",
    title: "Weather Advisory",
    badge: "শীঘ্রই",
    badgeColor: "#9ca3af",
    desc: "শীঘ্রই চালু হবে",
  },
];

export default function ToolsPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div
        className="relative px-4 pt-5 pb-7"
        style={{
          background: "linear-gradient(135deg,#1b4332,#2d6a4f)",
        }}
      >
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">
          KRISHI AI
        </div>
        <h1 className="text-[22px] font-bold text-white mb-1">কৃষি টুলস</h1>
        <p className="text-xs text-white/70">
          AI-চালিত স্মার্ট কৃষি সরঞ্জাম — রোগ নির্ণয় থেকে ফলন পূর্বাভাস পর্যন্ত
        </p>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* Tool cards */}
        <div className="grid grid-cols-1 gap-3 mb-7">
          {TOOLS.map((t, i) => {
            const isDisabled = t.badge === "শীঘ্রই";
            return (
              <Link
                key={i}
                href={isDisabled ? "#" : t.to}
                className="flex items-center gap-3.5 p-[18px] rounded-2xl transition-all duration-200 no-underline"
                style={{
                  background: t.bg,
                  cursor: isDisabled ? "default" : "pointer",
                  opacity: isDisabled ? 0.7 : 1,
                  boxShadow: "0 2px 12px rgba(0,0,0,.06)",
                }}
                onClick={(e) => isDisabled && e.preventDefault()}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-[26px] shrink-0"
                  style={{
                    background: "rgba(255,255,255,.7)",
                    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                  }}
                >
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[10px] font-bold tracking-wider uppercase mb-[3px]"
                    style={{ color: t.catColor }}
                  >
                    {t.cat}
                  </div>
                  <div className="text-[15px] font-bold text-gray-900 mb-[2px]">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-gray-500">{t.sub}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className="text-[10px] font-bold px-2 py-[3px] rounded-full whitespace-nowrap"
                    style={{
                      background:
                        t.badge === "শীঘ্রই" ? "#e5e7eb" : "rgba(27,138,62,.12)",
                      color:
                        t.badge === "শীঘ্রই" ? "#9ca3af" : "#1b8a3e",
                    }}
                  >
                    {t.badge}
                  </span>
                  {!isDisabled && (
                    <span className="text-lg" style={{ color: t.catColor }}>
                      →
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Ecosystem apps */}
        <div className="border-t border-gray-200 pt-5">
          <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3.5">
            🔗 ইকোসিস্টেম অ্যাপস
          </div>
          <div className="flex flex-col gap-2.5">
            {ECOSYSTEM.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-green-50/30 transition-colors no-underline"
              >
                <div className="text-2xl">{a.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">
                    {a.title}
                  </div>
                  <div className="text-[11px] text-gray-500">{a.desc}</div>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{
                    background:
                      a.badgeColor === "#9ca3af" ? "#e5e7eb" : "rgba(27,138,62,.12)",
                    color: a.badgeColor,
                  }}
                >
                  {a.badge}
                </span>
              </a>
            ))}
          </div>
          <div className="text-[10px] text-gray-400 text-center mt-3.5 leading-relaxed">
            কৃষি AI ইকোসিস্টেমের সকল অ্যাপ একসাথে কাজ করে কৃষকদের জন্য সম্পূর্ণ
            ডিজিটাল সমাধান তৈরি করে।
          </div>
        </div>
      </div>
    </div>
  );
}
