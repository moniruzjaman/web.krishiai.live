"use client";

/**
 * Plant Health Tool — AI-powered crop disease diagnosis & Disease Library
 *
 * Features:
 * - Disease Diagnosis tab with analyzer link & how-it-works guide
 * - Disease Library with 50 BD-specific diseases (10 crops × 5 diseases), search & filter
 * - Prevention Guide with seasonal calendar & emergency contacts
 * - Expandable disease cards with color-coded severity
 * - All text in Bengali
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CROP_DISEASES,
  getAllDiseases,
  getCropNames,
  type CropDisease,
} from "@/lib/cropDiseases";

// ── Severity colors ───────────────────────────────────────────────────────────
const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "গুরুতর": { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", dot: "bg-red-500" },
  "মাঝারি": { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", dot: "bg-amber-500" },
  "হালকা": { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", dot: "bg-green-500" },
};

// ── Cause type icons and Bengali labels ────────────────────────────────────────
const CAUSE_INFO: Record<string, { icon: string; label: string }> = {
  fungal: { icon: "🍄", label: "ছত্রাক" },
  bacterial: { icon: "🦠", label: "ব্যাকটেরিয়া" },
  viral: { icon: "🧬", label: "ভাইরাস" },
  insect: { icon: "🐛", label: "পোকামাকড়" },
  nematode: { icon: "🪱", label: "নিমাটোড" },
  deficiency: { icon: "⚗️", label: "পুষ্টি ঘাটতি" },
};

// ── Crop icons ────────────────────────────────────────────────────────────────
const CROP_ICONS: Record<string, string> = {
  "ধান": "🌾", "পাট": "🪢", "আলু": "🥔", "টমেটো": "🍅",
  "বেগুন": "🍆", "সরিষা": "🟡", "কলা": "🍌", "আম": "🥭",
  "গম": "🌾", "ভুট্টা": "🌽",
};

// ── Build flat disease list for the library ──────────────────────────────────
interface FlatDisease extends CropDisease {
  id: number;
  crop: string;
  cropEn: string;
  icon: string;
  severityBn: string;
}

function buildFlatDiseases(): FlatDisease[] {
  const all = getAllDiseases();
  let id = 1;
  return all.map((d) => ({
    ...d,
    id: id++,
    crop: d.crop,
    cropEn: d.cropEn,
    icon: CROP_ICONS[d.crop] || "🌱",
    severityBn: d.severity === "severe" ? "গুরুতর" : d.severity === "moderate" ? "মাঝারি" : "হালকা",
  }));
}

const FLAT_DISEASES = buildFlatDiseases();

// ── Crop filter options ───────────────────────────────────────────────────────
const ALL_CROPS = ["সব", ...getCropNames()];
const CAUSE_FILTERS = ["সব", "ছত্রাক", "ব্যাকটেরিয়া", "ভাইরাস", "পোকামাকড়"];
const SEVERITY_FILTERS = ["সব", "গুরুতর", "মাঝারি", "হালকা"];

// ── Common diseases quick list ────────────────────────────────────────────────
const COMMON_DISEASES = [
  { name: "ধানের ব্লাস্ট", icon: "🌾", crop: "ধান" },
  { name: "আলুর লেট ব্লাইট", icon: "🥔", crop: "আলু" },
  { name: "টমেটোর পাতামোড়া", icon: "🍅", crop: "টমেটো" },
  { name: "সরিষার অলটারনেরিয়া ব্লাইট", icon: "🟡", crop: "সরিষা" },
  { name: "বেগুনের ডগা ও ফল ছিদ্রকারী", icon: "🍆", crop: "বেগুন" },
  { name: "কলার পানামা উইল্ট", icon: "🍌", crop: "কলা" },
  { name: "গমের পাতায় মরচে রোগ", icon: "🌾", crop: "গম" },
  { name: "আমের অ্যানথ্রাকনোজ", icon: "🥭", crop: "আম" },
];

// ── Seasonal prevention calendar ──────────────────────────────────────────────
const SEASONAL_CALENDAR = [
  {
    season: "রবি (নভেম্বর-মার্চ)",
    icon: "❄️",
    color: "bg-blue-50 border-blue-200",
    titleColor: "text-blue-900",
    diseases: ["আলুর লেট ব্লাইট", "সরিষার অলটারনেরিয়া ব্লাইট", "গমের পাতায় মরচে রোগ", "টমেটোর লেট ব্লাইট"],
    actions: ["বীজ শোধন করুন", "সঠিক সময়ে রোপণ করুন", "ছত্রাকনাশক স্প্রে নিয়মিত করুন", "জল নিষ্কাশন নিশ্চিত করুন"],
  },
  {
    season: "খরিফ-১ (এপ্রিল-জুন)",
    icon: "🌧️",
    color: "bg-green-50 border-green-200",
    titleColor: "text-green-900",
    diseases: ["পাটের মোজাইক রোগ", "বেগুনের ফুট রট", "ভুট্টার মেডিস লিফ ব্লাইট", "আমের অ্যানথ্রাকনোজ"],
    actions: ["জাব পোকা নিয়ন্ত্রণ করুন", "আক্রান্ত গাছ তুলে ফেলুন", "ফসল আবর্তন করুন", "সেচ ব্যবস্থাপনা করুন"],
  },
  {
    season: "খরিফ-২ (জুলাই-অক্টোবর)",
    icon: "🌊",
    color: "bg-teal-50 border-teal-200",
    titleColor: "text-teal-900",
    diseases: ["ধানের ব্লাস্ট", "টুংরো রোগ", "শিথ ব্লাইট", "ভুট্টার স্টক রট"],
    actions: ["প্রতিরোধী জাত ব্যবহার করুন", "সবুজ পাতার ফাঁদ বসান", "সুষম সার প্রয়োগ করুন", "আগাছা পরিষ্কার রাখুন"],
  },
  {
    season: "সারাবছর",
    icon: "🔄",
    color: "bg-amber-50 border-amber-200",
    titleColor: "text-amber-900",
    diseases: ["টমেটোর পাতামোড়া", "বেগুনের ডগা ও ফল ছিদ্রকারী", "কলার পানামা উইল্ট", "কলার সিগাটোকা"],
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
  const [causeFilter, setCauseFilter] = useState("সব");
  const [severityFilter, setSeverityFilter] = useState("সব");

  // Filter diseases
  const filtered = useMemo(() => {
    return FLAT_DISEASES.filter((d) => {
      const matchCrop = cropFilter === "সব" || d.crop === cropFilter;
      const matchSeverity = severityFilter === "সব" || d.severityBn === severityFilter;
      const matchCause = causeFilter === "সব" ||
        (causeFilter === "ছত্রাক" && d.cause === "fungal") ||
        (causeFilter === "ব্যাকটেরিয়া" && d.cause === "bacterial") ||
        (causeFilter === "ভাইরাস" && d.cause === "viral") ||
        (causeFilter === "পোকামাকড়" && d.cause === "insect");
      const matchSearch =
        search === "" ||
        d.nameBn.toLowerCase().includes(search.toLowerCase()) ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.crop.includes(search) ||
        d.pathogen.toLowerCase().includes(search.toLowerCase());
      return matchCrop && matchSeverity && matchCause && matchSearch;
    });
  }, [cropFilter, severityFilter, causeFilter, search]);

  // Stats
  const diseaseStats = useMemo(() => ({
    total: FLAT_DISEASES.length,
    severe: FLAT_DISEASES.filter((d) => d.severity === "severe").length,
    fungal: FLAT_DISEASES.filter((d) => d.cause === "fungal").length,
    crops: Object.keys(CROP_DISEASES).length,
  }), []);

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
        <p className="text-xs text-white/70">
          {diseaseStats.crops} টি ফসলের {diseaseStats.total} টি রোগের ডাটাবেস — রোগ নির্ণয়, চিকিৎসা ও প্রতিরোধ
        </p>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-none bg-gray-100 rounded-xl p-1">
          {[
            { key: "diagnosis" as TabKey, label: "🔬 রোগ নির্ণয়" },
            { key: "library" as TabKey, label: `📚 রোগ ভাণ্ডার (${diseaseStats.total})` },
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

            {/* How it works */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-gray-900 mb-3">কীভাবে কাজ করে?</div>
              <div className="space-y-3">
                {[
                  { step: "১", icon: "📷", title: "ছবি তুলুন", desc: "ফসলের আক্রান্ত পাতা, কান্ড বা ফলের স্পষ্ট ছবি তুলুন" },
                  { step: "২", icon: "🤖", title: "AI বিশ্লেষণ (CABI পদ্ধতি)", desc: "CABI Plantwise পদ্ধতিতে বর্জন গেট, রোগ ত্রিভুজ ও IPM পরামর্শ প্রদান করবে" },
                  { step: "৩", icon: "💊", title: "চিকিৎসা পরামর্শ", desc: "IPM ভিত্তিক চিকিৎসা ও ওষুধের তথ্য পান (FRAC/IRAC গ্রুপসহ)" },
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

            {/* Stats overview */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "ফসল", value: diseaseStats.crops, icon: "🌾" },
                { label: "রোগ", value: diseaseStats.total, icon: "🦠" },
                { label: "গুরুতর", value: diseaseStats.severe, icon: "🔴" },
                { label: "ছত্রাক", value: diseaseStats.fungal, icon: "🍄" },
              ].map((s, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-center">
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="text-[16px] font-bold text-gray-900">{s.value}</div>
                  <div className="text-[9px] text-gray-500">{s.label}</div>
                </div>
              ))}
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

            {/* Tip */}
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
                placeholder="🔍 রোগের নাম, ফসল বা জীবাণু দিয়ে খুঁজুন..."
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
                    {c === "সব" ? "📊" : CROP_ICONS[c] || ""} {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Cause & Severity filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="text-[10px] font-bold text-gray-500 mb-1.5">কারণ অনুযায়ী</div>
                <div className="flex gap-1 flex-wrap">
                  {CAUSE_FILTERS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCauseFilter(c)}
                      className={`whitespace-nowrap text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        causeFilter === c
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 mb-1.5">মাত্রা</div>
                <div className="flex gap-1">
                  {SEVERITY_FILTERS.map((s) => {
                    const sColor = SEVERITY_COLORS[s];
                    return (
                      <button
                        key={s}
                        onClick={() => setSeverityFilter(s)}
                        className={`whitespace-nowrap text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          severityFilter === s
                            ? sColor
                              ? `${sColor.bg} ${sColor.text} ${sColor.border}`
                              : "bg-amber-600 text-white border-amber-600"
                            : "bg-white text-gray-600 border-gray-200"
                        }`}
                      >
                        {s === "সব" ? "📊" : s === "গুরুতর" ? "🔴" : s === "মাঝারি" ? "🟡" : "🟢"} {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Results count */}
            <div className="text-[10px] text-gray-400">{filtered.length} টি রোগ পাওয়া গেছে</div>

            {/* Disease cards */}
            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto">
              {filtered.map((disease) => {
                const isExpanded = expandedDisease === disease.id;
                const severityStyle = SEVERITY_COLORS[disease.severityBn] || SEVERITY_COLORS["মাঝারি"];
                const causeInfo = CAUSE_INFO[disease.cause] || { icon: "❓", label: disease.cause };
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
                        <div className="text-[13px] font-bold text-gray-900">{disease.nameBn}</div>
                        <div className="text-[10px] text-gray-500">{disease.name} • {disease.pathogen}</div>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            🌱 {disease.crop}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${severityStyle.bg} ${severityStyle.text}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${severityStyle.dot} mr-1`} />
                            {disease.severityBn}
                          </span>
                          <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                            {causeInfo.icon} {causeInfo.label}
                          </span>
                          {disease.season.length > 0 && (
                            <span className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              📅 {disease.season.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold transition-transform ${isExpanded ? "text-amber-600 rotate-90" : "text-gray-400"}`}>
                        ▶
                      </span>
                    </button>

                    {/* Expanded view */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3">
                        {/* Symptoms */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                          <div className="text-[11px] font-bold text-red-900 mb-1">🩺 লক্ষণসমূহ</div>
                          <div className="flex flex-wrap gap-1.5">
                            {disease.symptoms.map((sym, i) => (
                              <span key={i} className="text-[10px] bg-white text-red-800 px-2 py-0.5 rounded-full border border-red-200">
                                {sym}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Conditions */}
                        <div className="bg-sky-50 border border-sky-200 rounded-lg p-2.5">
                          <div className="text-[11px] font-bold text-sky-900 mb-1">🌡️ অনুকূল পরিবেশ</div>
                          <div className="text-[11px] text-sky-800 leading-relaxed">{disease.conditions}</div>
                        </div>

                        {/* Treatment */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                          <div className="text-[11px] font-bold text-emerald-900 mb-1">💊 চিকিৎসা ও ব্যবস্থাপনা</div>
                          <div className="space-y-1">
                            {disease.recommendations.map((rec, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <span className="text-[10px] text-emerald-600 mt-0.5 flex-shrink-0">✓</span>
                                <span className="text-[11px] text-emerald-800 leading-relaxed">{rec}</span>
                              </div>
                            ))}
                          </div>
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

            {/* When to consult expert */}
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
