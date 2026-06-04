"use client";

/**
 * Plant Health Tool — AI-powered crop disease diagnosis & Disease Library
 *
 * Features:
 * - Disease Diagnosis tab with analyzer link & how-it-works guide
 * - Disease Library with 10 BD-specific diseases, search & filter
 * - Prevention Guide with seasonal calendar & emergency contacts
 * - Expandable disease cards with color-coded severity
 * - All text in Bengali
 */

import { useState, useMemo } from "react";
import Link from "next/link";

// ── Disease Database ──────────────────────────────────────────────────────────
interface Disease {
  id: number;
  name: string;
  en: string;
  crop: string;
  icon: string;
  severity: "গুরুতর" | "মাঝারি" | "হালকা";
  season: string;
  symptoms: string;
  treatment: string;
  prevention: string;
}

const DISEASES: Disease[] = [
  { id: 1, name: "ধানের ব্লাস্ট", en: "Rice Blast", crop: "ধান", icon: "🌾", severity: "গুরুতর", season: "সারাবছর", symptoms: "পাতায় হীরে আকৃতির বাদামি দাগ, গিটে পচন", treatment: "ট্রাইসাইক্লাজোল স্প্রে, রোগ প্রতিরোধী জাত ব্যবহার", prevention: "সুষম সার ব্যবহার, আগাছা পরিষ্কার, জল নিষ্কাশন" },
  { id: 2, name: "টুংরো রোগ", en: "Tungro Virus", crop: "ধান", icon: "🌾", severity: "গুরুতর", season: "বোরো/আউশ", symptoms: "পাতা হলুদ-কমলা হয়ে যাওয়া, গাছ বামন হওয়া", treatment: "সবুজ পাতার ফাঁদ, জাব পোকা নিয়ন্ত্রণ", prevention: "প্রতিরোধী জাত, চারা রোপণের সঠিক সময়" },
  { id: 3, name: "আলুর লেট ব্লাইট", en: "Late Blight", crop: "আলু", icon: "🥔", severity: "গুরুতর", season: "রবি", symptoms: "পাতায় জলজ দাগ, দ্রুত ছড়ায়, কান্ড পচে যায়", treatment: "ম্যানকোজেব/মেটাল্যাক্সিল স্প্রে", prevention: "প্রতিরোধী জাত, সঠিক সময়ে রোপণ" },
  { id: 4, name: "পেঁয়াজের পার্পল ব্লচ", en: "Purple Blotch", crop: "পেঁয়াজ", icon: "🧅", severity: "মাঝারি", season: "রবি", symptoms: "পাতায় বেগুনি দাগ, কেন্দ্রে হলুদ", treatment: "ম্যানকোজেব + ক্লোরোথ্যালোনিল স্প্রে", prevention: "ফসল আবর্তন, সঠিক দূরত্বে রোপণ" },
  { id: 5, name: "টমেটোর পাতামোড়া", en: "Leaf Curl Virus", crop: "টমেটো", icon: "🍅", severity: "গুরুতর", season: "সারাবছর", symptoms: "পাতা উপরের দিকে মুড়ে যাওয়া, হলুদ হওয়া", treatment: "সাদা মাছি নিয়ন্ত্রণ, ইমিডাক্লোপ্রিড স্প্রে", prevention: "প্রতিরোধী জাত, সাদা মাছি ফাঁদ" },
  { id: 6, name: "সরিষার অলটারনেরিয়া দাগ", en: "Alternaria Blight", crop: "সরিষা", icon: "🟡", severity: "মাঝারি", season: "রবি", symptoms: "পাতায় গোল বাদামি দাগ, ক্রমশ বড় হয়", treatment: "ম্যানকোজেব স্প্রে ১৫ দিন অন্তর", prevention: "বীজ শোধন, পরিষ্কার চাষ" },
  { id: 7, name: "পাটের মারমোরিক রোগ", en: "Mosaic Disease", crop: "পাট", icon: "🪢", severity: "মাঝারি", season: "খরিফ", symptoms: "পাতায় সবুজ-হলুদ মোজাইক প্যাটার্ন", treatment: "আক্রান্ত গাছ তুলে ফেলা, জাব পোকা নিয়ন্ত্রণ", prevention: "প্রতিরোধী জাত, জাব পোকা দমন" },
  { id: 8, name: "গমের পাউডারি মিলডিউ", en: "Powdery Mildew", crop: "গম", icon: "🌾", severity: "হালকা", season: "রবি", symptoms: "পাতায় সাদা পাউডারের মত আবরণ", treatment: "প্রোপিকোনাজোল স্প্রে", prevention: "প্রতিরোধী জাত, সঠিক সার ব্যবস্থা" },
  { id: 9, name: "বেগুনের ফুট রট", en: "Fruit Rot", crop: "বেগুন", icon: "🍆", severity: "মাঝারি", season: "সারাবছর", symptoms: "ফলে পানিসদৃশ দাগ, দ্রুত পচে যাওয়া", treatment: "কপার অক্সিক্লোরাইড স্প্রে", prevention: "ফসল আবর্তন, জল নিষ্কাশন" },
  { id: 10, name: "মরিচের অ্যানথ্রাকনোজ", en: "Anthracnose", crop: "মরিচ", icon: "🌶️", severity: "মাঝারি", season: "সারাবছর", symptoms: "ফলে গোল কালো দাগ, শুকিয়ে যাওয়া", treatment: "ক্লোরোথ্যালোনিল স্প্রে", prevention: "বীজ শোধন, আক্রান্ত ফল তুলে ফেলা" },
];

// ── Severity colors ───────────────────────────────────────────────────────────
const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "গুরুতর": { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", dot: "bg-red-500" },
  "মাঝারি": { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", dot: "bg-amber-500" },
  "হালকা": { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", dot: "bg-green-500" },
};

// ── Crop filter options ───────────────────────────────────────────────────────
const ALL_CROPS = ["সব", "ধান", "আলু", "পেঁয়াজ", "টমেটো", "সরিষা", "পাট", "গম", "বেগুন", "মরিচ"];
const SEVERITY_FILTERS = ["সব", "গুরুতর", "মাঝারি", "হালকা"];

// ── Common diseases quick list ────────────────────────────────────────────────
const COMMON_DISEASES = [
  { name: "ধানের ব্লাস্ট", icon: "🌾", crop: "ধান" },
  { name: "আলুর লেট ব্লাইট", icon: "🥔", crop: "আলু" },
  { name: "পেঁয়াজের পার্পল ব্লচ", icon: "🧅", crop: "পেঁয়াজ" },
  { name: "টমেটোর পাতামোড়া", icon: "🍅", crop: "টমেটো" },
  { name: "মরিচের অ্যানথ্রাকনোজ", icon: "🌶️", crop: "মরিচ" },
  { name: "পাটের মারমোরিক রোগ", icon: "🪢", crop: "পাট" },
];

// ── Seasonal prevention calendar ──────────────────────────────────────────────
const SEASONAL_CALENDAR = [
  {
    season: "রবি (নভেম্বর-মার্চ)",
    icon: "❄️",
    color: "bg-blue-50 border-blue-200",
    titleColor: "text-blue-900",
    diseases: ["আলুর লেট ব্লাইট", "পেঁয়াজের পার্পল ব্লচ", "সরিষার অলটারনেরিয়া দাগ", "গমের পাউডারি মিলডিউ"],
    actions: ["বীজ শোধন করুন", "সঠিক সময়ে রোপণ করুন", "ছত্রাকনাশক স্প্রে নিয়মিত করুন", "জল নিষ্কাশন নিশ্চিত করুন"],
  },
  {
    season: "খরিফ-১ (এপ্রিল-জুন)",
    icon: "🌧️",
    color: "bg-green-50 border-green-200",
    titleColor: "text-green-900",
    diseases: ["পাটের মারমোরিক রোগ", "বেগুনের ফুট রট"],
    actions: ["জাব পোকা নিয়ন্ত্রণ করুন", "আক্রান্ত গাছ তুলে ফেলুন", "ফসল আবর্তন করুন", "সেচ ব্যবস্থাপনা করুন"],
  },
  {
    season: "খরিফ-২ (জুলাই-অক্টোবর)",
    icon: "🌊",
    color: "bg-teal-50 border-teal-200",
    titleColor: "text-teal-900",
    diseases: ["ধানের ব্লাস্ট", "টুংরো রোগ", "মরিচের অ্যানথ্রাকনোজ"],
    actions: ["প্রতিরোধী জাত ব্যবহার করুন", "সবুজ পাতার ফাঁদ বসান", "সুষম সার প্রয়োগ করুন", "আগাছা পরিষ্কার রাখুন"],
  },
  {
    season: "সারাবছর",
    icon: "🔄",
    color: "bg-amber-50 border-amber-200",
    titleColor: "text-amber-900",
    diseases: ["টমেটোর পাতামোড়া", "বেগুনের ফুট রট", "মরিচের অ্যানথ্রাকনোজ", "ধানের ব্লাস্ট"],
    actions: ["নিয়মিত পরিদর্শন করুন", "সাদা মাছি ফাঁদ ব্যবহার করুন", "স্বাস্থ্যকর চারা ব্যবহার করুন", "জমি পরিষ্কার রাখুন"],
  },
];

// ── Tab type ──────────────────────────────────────────────────────────────────
type TabKey = "diagnosis" | "library" | "prevention";

// ── Component ─────────────────────────────────────────────────────────────────
export default function PlantHealthPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("diagnosis");
  const [expandedDisease, setExpandedDisease] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState("সব");
  const [severityFilter, setSeverityFilter] = useState("সব");

  // Filter diseases
  const filtered = useMemo(() => {
    return DISEASES.filter((d) => {
      const matchCrop = cropFilter === "সব" || d.crop === cropFilter;
      const matchSeverity = severityFilter === "সব" || d.severity === severityFilter;
      const matchSearch =
        search === "" ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.en.toLowerCase().includes(search.toLowerCase()) ||
        d.crop.includes(search);
      return matchCrop && matchSeverity && matchSearch;
    });
  }, [cropFilter, severityFilter, search]);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="relative px-4 pt-5 pb-7" style={{ background: "linear-gradient(135deg,#ca8a04,#a16207)" }}>
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] text-white/50 tracking-widest font-bold">PLANT HEALTH</div>
          <Link
            href="/analyzer"
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors no-underline border border-white/20"
          >
            📷 এনালাইজারে যান
          </Link>
        </div>
        <h1 className="text-[22px] font-bold text-white mb-1">🌿 উদ্ভিদ স্বাস্থ্য বিশেষজ্ঞ</h1>
        <p className="text-xs text-white/70">রোগ নির্ণয়, রোগ ভাণ্ডার ও প্রতিরোধ গাইড — বাংলাদেশের ফসলের জন্য</p>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-none bg-gray-100 rounded-xl p-1">
          {[
            { key: "diagnosis" as TabKey, label: "🔬 রোগ নির্ণয়" },
            { key: "library" as TabKey, label: "📚 রোগ ভাণ্ডার" },
            { key: "prevention" as TabKey, label: "🛡️ প্রতিরোধ গাইড" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 text-[11px] font-bold py-2 px-2 rounded-lg transition-all cursor-pointer border-none whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-white text-amber-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: রোগ নির্ণয় (Disease Diagnosis)
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "diagnosis" && (
          <div className="space-y-4">
            {/* Analyzer CTA */}
            <Link
              href="/analyzer"
              className="flex items-center gap-3 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 no-underline hover:bg-amber-100 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center text-white text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                📷
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-gray-900">এনালাইজার ব্যবহার করুন</div>
                <div className="text-[11px] text-gray-600 leading-relaxed">
                  ফসলের আক্রান্ত অংশের ছবি তুলে AI-চালিত রোগ শনাক্তকরণ করুন
                </div>
              </div>
              <span className="text-[14px] font-semibold text-amber-600 group-hover:translate-x-1 transition-transform">→</span>
            </Link>

            {/* How it works — 4 step guide */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-gray-900 mb-3">কীভাবে কাজ করে?</div>
              <div className="space-y-3">
                {[
                  { step: "১", icon: "📷", title: "ছবি তুলুন", desc: "ফসলের আক্রান্ত পাতা, কান্ড বা ফলের স্পষ্ট ছবি তুলুন" },
                  { step: "২", icon: "🤖", title: "AI বিশ্লেষণ", desc: "আমাদের AI মডেল ছবি বিশ্লেষণ করে রোগ শনাক্ত করবে" },
                  { step: "৩", icon: "💊", title: "চিকিৎসা পরামর্শ", desc: "রোগের জন্য নির্দিষ্ট চিকিৎসা ও ওষুধের তথ্য পান" },
                  { step: "৪", icon: "🛡️", title: "প্রতিরোধ ব্যবস্থা", desc: "ভবিষ্যতে রোগ প্রতিরোধে পদক্ষেপ জানুন" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{item.icon}</span>
                        <span className="text-[12px] font-bold text-gray-900">{item.title}</span>
                      </div>
                      <div className="text-[11px] text-gray-600 leading-relaxed mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Common diseases quick-list */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-green-900 mb-3">🦠 সাধারণ রোগসমূহ</div>
              <div className="grid grid-cols-2 gap-2">
                {COMMON_DISEASES.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveTab("library");
                      setSearch(d.name);
                    }}
                    className="flex items-center gap-2 bg-white rounded-xl p-2.5 border border-green-100 hover:border-amber-300 hover:bg-amber-50 transition-all cursor-pointer text-left"
                  >
                    <span className="text-lg">{d.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-gray-900 truncate">{d.name}</div>
                      <div className="text-[9px] text-gray-500">{d.crop}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick tip */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
              <div className="flex items-start gap-2">
                <span className="text-base">💡</span>
                <div className="text-[11px] text-amber-900 leading-relaxed">
                  <span className="font-bold">টিপ:</span> ছবি তোলার সময় আক্রান্ত অংশের পাশাপাশি স্বাস্থ্যকর অংশও রাখুন — এতে AI আরও নির্ভুল ফলাফল দিতে পারে।
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: রোগ ভাণ্ডার (Disease Library)
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "library" && (
          <div className="space-y-3">
            {/* Search */}
            <div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 রোগের নাম বা ফসল দিয়ে খুঁজুন..."
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
              />
            </div>

            {/* Crop filter */}
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1.5">ফসল অনুযায়ী</div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {ALL_CROPS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCropFilter(c)}
                    className={`whitespace-nowrap text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                      cropFilter === c
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
                    }`}
                  >
                    {c === "সব" ? "📊" : ""} {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity filter */}
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1.5">মাত্রা অনুযায়ী</div>
              <div className="flex gap-1.5">
                {SEVERITY_FILTERS.map((s) => {
                  const sColor = SEVERITY_COLORS[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setSeverityFilter(s)}
                      className={`whitespace-nowrap text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                        severityFilter === s
                          ? sColor
                            ? `${sColor.bg} ${sColor.text} ${sColor.border}`
                            : "bg-amber-600 text-white border-amber-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
                      }`}
                    >
                      {s === "সব" ? "📊" : s === "গুরুতর" ? "🔴" : s === "মাঝারি" ? "🟡" : "🟢"} {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results count */}
            <div className="text-[10px] text-gray-400">{filtered.length} টি রোগ পাওয়া গেছে</div>

            {/* Disease cards */}
            <div className="space-y-2.5">
              {filtered.map((disease) => {
                const isExpanded = expandedDisease === disease.id;
                const severityStyle = SEVERITY_COLORS[disease.severity];
                return (
                  <div
                    key={disease.id}
                    className={`rounded-xl border-2 transition-all overflow-hidden ${
                      isExpanded
                        ? `${severityStyle.border} bg-white`
                        : "border-gray-200 bg-white hover:border-amber-300"
                    }`}
                  >
                    {/* Collapsed view */}
                    <button
                      onClick={() => setExpandedDisease(isExpanded ? null : disease.id)}
                      className="w-full flex items-center gap-3 p-3.5 cursor-pointer text-left bg-transparent border-none"
                    >
                      <div className="text-2xl">{disease.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-gray-900">{disease.name}</div>
                        <div className="text-[10px] text-gray-500">{disease.en}</div>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            🌱 {disease.crop}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${severityStyle.bg} ${severityStyle.text}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${severityStyle.dot} mr-1`} />
                            {disease.severity}
                          </span>
                          <span className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            📅 {disease.season}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold transition-transform ${isExpanded ? "text-amber-600 rotate-90" : "text-gray-400"}`}>
                        ▶
                      </span>
                    </button>

                    {/* Expanded view */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3">
                        {/* Brief symptoms */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                          <div className="text-[11px] font-bold text-red-900 mb-1">🩺 লক্ষণসমূহ</div>
                          <div className="text-[11px] text-red-800 leading-relaxed">{disease.symptoms}</div>
                        </div>

                        {/* Treatment */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                          <div className="text-[11px] font-bold text-blue-900 mb-1">💊 চিকিৎসা</div>
                          <div className="text-[11px] text-blue-800 leading-relaxed">{disease.treatment}</div>
                        </div>

                        {/* Prevention */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                          <div className="text-[11px] font-bold text-green-900 mb-1">🛡️ প্রতিরোধ</div>
                          <div className="text-[11px] text-green-800 leading-relaxed">{disease.prevention}</div>
                        </div>

                        {/* Action links */}
                        <div className="flex gap-2 flex-wrap">
                          <Link
                            href="/analyzer"
                            className="text-[10px] font-bold text-white bg-amber-600 rounded-full px-3 py-1.5 no-underline hover:bg-amber-700 transition-colors"
                          >
                            📷 এনালাইজারে যান
                          </Link>
                          <Link
                            href="/tools/pesticide"
                            className="text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 rounded-full px-3 py-1.5 no-underline hover:bg-red-200 transition-colors"
                          >
                            🧪 কীটনাশক পরামর্শ
                          </Link>
                          <Link
                            href="/chat"
                            className="text-[10px] font-bold text-green-700 bg-green-100 border border-green-200 rounded-full px-3 py-1.5 no-underline hover:bg-green-200 transition-colors"
                          >
                            🤖 AI থেকে জানুন
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                কোনো রোগ পাওয়া যায়নি
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: প্রতিরোধ গাইড (Prevention Guide)
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "prevention" && (
          <div className="space-y-4">
            {/* Seasonal disease prevention calendar */}
            <div>
              <div className="text-[13px] font-bold text-gray-900 mb-3">📅 মৌসুমী রোগ প্রতিরোধ ক্যালেন্ডার</div>
              <div className="space-y-3">
                {SEASONAL_CALENDAR.map((cal, i) => (
                  <div key={i} className={`rounded-xl border p-3.5 ${cal.color}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{cal.icon}</span>
                      <span className={`text-[12px] font-bold ${cal.titleColor}`}>{cal.season}</span>
                    </div>
                    <div className="mb-2">
                      <div className="text-[10px] font-bold text-gray-600 mb-1">সম্ভাব্য রোগ:</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {cal.diseases.map((d, j) => (
                          <span key={j} className="text-[9px] bg-white/80 text-red-700 px-2 py-0.5 rounded-full font-medium border border-red-200">
                            🦠 {d}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-600 mb-1">প্রতিরোধমূলক পদক্ষেপ:</div>
                      <div className="space-y-1">
                        {cal.actions.map((a, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <span className="text-[10px] text-green-600 mt-0.5 flex-shrink-0">✓</span>
                            <span className="text-[10px] text-gray-700 leading-relaxed">{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best practices */}
            <div>
              <div className="text-[13px] font-bold text-gray-900 mb-3">✅ রোগ প্রতিরোধের সেরা অভ্যাস</div>
              <div className="space-y-2">
                {[
                  { icon: "🌱", title: "প্রতিরোধী জাত ব্যবহার", desc: "বারি/ব্রি উন্নত জাত ব্যবহার করুন যা রোগ প্রতিরোধী।" },
                  { icon: "🔄", title: "ফসল আবর্তন", desc: "একই জমিতে পরপর একই ফসল চাষ করবেন না। আবর্তন করুন।" },
                  { icon: "🧪", title: "বীজ শোধন", desc: "বপনের আগে বীজ শোধন করুন। ভিটাভেক্স-২০০ দিয়ে বীজ শোধন করা যায়।" },
                  { icon: "🧹", title: "জমি পরিষ্কার", desc: "আগাছা, রোগাক্রান্ত অবশিষ্ট ফসল তুলে ফেলুন ও ধ্বংস করুন।" },
                  { icon: "💧", title: "সেচ ব্যবস্থাপনা", desc: "জল নিষ্কাশন নিশ্চিত করুন। জলজমি অনেক ছত্রাক রোগের কারণ।" },
                  { icon: "⚖️", title: "সুষম সার ব্যবহার", desc: "মাটি পরীক্ষা করে সুপারিশকৃত মাত্রায় সার প্রয়োগ করুন।" },
                  { icon: "👀", title: "নিয়মিত পরিদর্শন", desc: "সপ্তাহে অন্তত ২ বার জমি পরিদর্শন করুন। প্রথম লক্ষণেই ব্যবস্থা নিন।" },
                  { icon: "🌡️", title: "আবহাওয়া পর্যবেক্ষণ", desc: "আবহাওয়ার পূর্বাভাস অনুযায়ী আগেভাগে প্রতিরোধমূলক স্প্রে করুন।" },
                ].map((item, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                    <div className="flex items-start gap-2.5">
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      <div>
                        <div className="text-[12px] font-bold text-gray-900">{item.title}</div>
                        <div className="text-[11px] text-gray-600 leading-relaxed mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* When to consult an expert */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-amber-900 mb-3">👨‍⚕️ কখন বিশেষজ্ঞের পরামর্শ নেবেন?</div>
              <div className="space-y-2">
                {[
                  "রোগের লক্ষণ দ্রুত ছড়ালে ও চিহ্নিত করতে না পারলে",
                  "একাধিক রোগ একসাথে আক্রমণ করলে",
                  "প্রস্তাবিত চিকিৎসায় ফলাফল না পেলে",
                  "ফসলের ব্যাপক ক্ষয়ক্ষতি হওয়ার আশঙ্কা থাকলে",
                  "নতুন বা অপরিচিত রোগের লক্ষণ দেখা দিলে",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[11px] text-amber-600 mt-0.5 flex-shrink-0">⚠️</span>
                    <span className="text-[11px] text-amber-900 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency contacts */}
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-red-900 mb-3">🚨 জরুরি সংযোগ</div>
              <div className="space-y-2.5">
                {[
                  { name: "কৃষি সম্প্রসারণ অধিদপ্তর (DAE)", number: "১৬১২৩", icon: "🏛️", desc: "কৃষি হটলাইন — সকাল ৯টা থেকে সন্ধ্যা ৫টা" },
                  { name: "কৃষি কল সেন্টার", number: "১৬১২৩", icon: "📞", desc: "ফসলের রোগ ও কীটপতঙ্গ সম্পর্কে পরামর্শ" },
                  { name: "স্বাস্থ্য সেবা হটলাইন", number: "১৬২৬৩", icon: "🏥", desc: "বিষক্রিয়া বা স্বাস্থ্য জরুরি" },
                  { name: "বিষক্রিয়া নিয়ন্ত্রণ কেন্দ্র", number: "০২-৯১৩০০৬৬", icon: "☠️", desc: "কীটনাশক বিষক্রিয়ায় জরুরি সহায়তা" },
                ].map((contact, i) => (
                  <div key={i} className="bg-white rounded-lg p-2.5 border border-red-200">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{contact.icon}</span>
                      <div className="flex-1">
                        <div className="text-[11px] font-bold text-gray-900">{contact.name}</div>
                        <div className="text-[10px] text-gray-500">{contact.desc}</div>
                      </div>
                      <div className="text-[13px] font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-lg">
                        {contact.number}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI consultation link */}
            <a
              href="/chat"
              className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-green-50 border border-amber-200 rounded-xl p-3.5 no-underline hover:from-amber-100 hover:to-green-100 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-white text-lg">🤖</div>
              <div className="flex-1">
                <div className="text-[13px] font-bold text-gray-900">AI থেকে রোগ সম্পর্কে জানুন</div>
                <div className="text-[11px] text-gray-500">আপনার ফসলের রোগ সম্পর্কে বিস্তারিত প্রশ্ন করুন</div>
              </div>
              <span className="text-[11px] font-semibold text-amber-600">→</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
