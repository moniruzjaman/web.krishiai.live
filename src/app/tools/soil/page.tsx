"use client";

/**
 * Soil Expert Tool — Interactive Soil Analysis & Fertilizer Calculator
 *
 * Features:
 * - Soil type selector with BD-specific soil zones
 * - Fertilizer calculator based on crop + soil + area
 * - pH analysis with crop compatibility
 * - SRDI-based fertilizer recommendations
 * - AI-powered soil consultation
 */

import { useState, useCallback } from "react";
import { useLocation } from "@/context/LocationContext";

// ── Soil Types (Bangladesh specific) ────────────────────────────────────────
const SOIL_TYPES = [
  { id: "clay", name: "পলি মাটি", en: "Clay Soil", ph: "6.0–7.5", desc: "ভারী, জল ধারণ ক্ষমতা বেশি", color: "#92400e", icon: "🟤", crops: ["ধান", "পাট", "আখ"], drainLevel: "low" },
  { id: "sandy", name: "বেলে মাটি", en: "Sandy Soil", ph: "5.5–6.5", desc: "হালকা, জল নিষ্কাশন দ্রুত", color: "#d97706", icon: "🟡", crops: ["আলু", "মরিচ", "তরমুজ"], drainLevel: "high" },
  { id: "loam", name: "দোআঁশ মাটি", en: "Loamy Soil", ph: "6.0–7.0", desc: "সবচেয়ে উর্বর, সব ফসলের জন্য আদর্শ", color: "#166534", icon: "🟢", crops: ["ধান", "গম", "সবজি", "ফল"], drainLevel: "medium" },
  { id: "silt", name: "পলিত মাটি", en: "Silty Soil", ph: "6.0–7.0", desc: "মাঝারি উর্বরতা, নদী অববাহিকায় পাওয়া যায়", color: "#0e7490", icon: "🔵", crops: ["ধান", "সরিষা", "ডাল"], drainLevel: "medium" },
  { id: "peat", name: "পিট মাটি", en: "Peat Soil", ph: "4.5–5.5", desc: "জৈব পদার্থ সমৃদ্ধ, অম্লীয়", color: "#581c87", icon: "🟣", crops: ["ধান", "পান", "লেবু"], drainLevel: "low" },
  { id: "calcareous", name: "ক্যালকেরিয়াস মাটি", en: "Calcareous Soil", ph: "7.5–8.5", desc: "চুনযুক্ত, উত্তর বাংলাদেশে পাওয়া যায়", color: "#dc2626", icon: "🔴", crops: ["গম", "সরিষা", "ছোলা"], drainLevel: "medium" },
];

// ── Crops with fertilizer requirements (per bigha) ──────────────────────────
const CROPS = [
  { id: "rice_boro", name: "বোরো ধান", icon: "🌾", urea: 75, tsp: 55, mop: 35, gypsum: 18, zinc: 2, season: "রবি" },
  { id: "rice_aus", name: "আউশ ধান", icon: "🌾", urea: 50, tsp: 35, mop: 25, gypsum: 12, zinc: 1.5, season: "খরিফ-১" },
  { id: "rice_aman", name: "আমন ধান", icon: "🌾", urea: 60, tsp: 40, mop: 30, gypsum: 15, zinc: 2, season: "খরিফ-২" },
  { id: "wheat", name: "গম", icon: "🌾", urea: 65, tsp: 60, mop: 40, gypsum: 20, zinc: 1.5, season: "রবি" },
  { id: "potato", name: "আলু", icon: "🥔", urea: 90, tsp: 80, mop: 60, gypsum: 25, zinc: 2, season: "রবি" },
  { id: "mustard", name: "সরিষা", icon: "🌻", urea: 55, tsp: 50, mop: 30, gypsum: 20, zinc: 1, season: "রবি" },
  { id: "tomato", name: "টমেটো", icon: "🍅", urea: 70, tsp: 55, mop: 45, gypsum: 15, zinc: 1.5, season: "রবি" },
  { id: "onion", name: "পেঁয়াজ", icon: "🧅", urea: 65, tsp: 50, mop: 40, gypsum: 18, zinc: 1, season: "রবি" },
  { id: "chili", name: "মরিচ", icon: "🌶️", urea: 55, tsp: 45, mop: 35, gypsum: 15, zinc: 1, season: "খরিফ/রবি" },
  { id: "jute", name: "পাট", icon: "🪢", urea: 45, tsp: 35, mop: 25, gypsum: 12, zinc: 1, season: "খরিফ" },
  { id: "maize", name: "ভুট্টা", icon: "🌽", urea: 85, tsp: 65, mop: 50, gypsum: 20, zinc: 2, season: "খরিফ/রবি" },
  { id: "lentil", name: "ডাল (মসুর)", icon: "🫘", urea: 15, tsp: 40, mop: 20, gypsum: 15, zinc: 1, season: "রবি" },
];

// ── Soil Zones by District ───────────────────────────────────────────────────
const SOIL_ZONES: Record<string, string> = {
  "ঢাকা": "loam", "গাজীপুর": "loam", "নারায়ণগঞ্জ": "silt", "মুন্সীগঞ্জ": "silt",
  "রাজশাহী": "calcareous", "নাটোর": "loam", "পাবনা": "loam", "বগুড়া": "loam",
  "রংপুর": "loam", "দিনাজপুর": "calcareous", "কুড়িগ্রাম": "silt", "লালমনিরহাট": "loam",
  "চট্টগ্রাম": "sandy", "কক্সবাজার": "sandy", "খাগড়াছড়ি": "loam", "রাঙ্গামাটি": "loam",
  "খুলনা": "peat", "যশোর": "loam", "সাতক্ষীরা": "peat", "কুষ্টিয়া": "loam",
  "বরিশাল": "peat", "পটুয়াখালী": "peat", "ভোলা": "silt", "ঝালকাঠি": "peat",
  "সিলেট": "loam", "মৌলভীবাজার": "loam", "হবিগঞ্জ": "loam", "সুনামগঞ্জ": "peat",
  "ময়মনসিংহ": "loam", "জামালপুর": "silt", "শেরপুর": "loam", "নেত্রকোণা": "loam",
  "ফরিদপুর": "silt", "মাদারীপুর": "silt", "গোপালগঞ্জ": "peat", "শরীয়তপুর": "silt",
  "টাঙ্গাইল": "loam", "কিশোরগঞ্জ": "loam", "নরসিংদী": "loam", "ব্রাহ্মণবাড়িয়া": "loam",
  "কুমিল্লা": "loam", "চাঁদপুর": "silt", "ফেনী": "sandy", "নোয়াখালী": "sandy",
  "লক্ষ্মীপুর": "sandy", "বরগুনা": "peat", "পিরোজপুর": "peat", "ঝিনাইদহ": "loam",
  "মাগুরা": "loam", "চুয়াডাঙ্গা": "loam", "মেহেরপুর": "loam", "নাইলর": "loam",
  "চাঁপাইনবাবগঞ্জ": "calcareous", "নওগাঁ": "loam", "জয়পুরহাট": "calcareous",
  "ঠাকুরগাঁও": "loam", "পঞ্চগড়": "loam", "বান্দরবান": "loam",
  "হবিগঞ্জ": "loam", "মানিকগঞ্জ": "silt", "রাজবাড়ী": "silt",
};

// ── Fertilizer info ──────────────────────────────────────────────────────────
const FERTILIZER_INFO = [
  { id: "urea", name: "ইউরিয়া", en: "Urea (N 46%)", color: "#2563eb", icon: "🔵", timing: "৩ কিস্তায় প্রয়োগ (রোপণ, কুশি, গুড়া পর্যায়)", method: "পাতায় ছিটিয়ে বা মাটিতে মিশিয়ে" },
  { id: "tsp", name: "টিএসপি", en: "TSP (P₂O₅ 46%)", color: "#dc2626", icon: "🔴", timing: "জমি তৈরির সময় একবারে সম্পূর্ণ মাত্রা", method: "জমিতে ছড়িয়ে চাষ দিয়ে মেশান" },
  { id: "mop", name: "এমওপি", en: "MoP (K₂O 60%)", color: "#16a34a", icon: "🟢", timing: "২ কিস্তায় প্রয়োগ (জমি তৈরি + শীর্ষ পোশাক)", method: "মাটিতে মিশিয়ে দিন" },
  { id: "gypsum", name: "জিপসাম", en: "Gypsum (S 18%)", color: "#ca8a04", icon: "🟡", timing: "জমি তৈরির সময় একবারে", method: "জমিতে ছড়িয়ে মেশান" },
  { id: "zinc", name: "জিংক সালফেট", en: "ZnSO₄ (Zn 21%)", color: "#7c3aed", icon: "🟣", timing: "জমি তৈরি বা বীজতলায়", method: "মাটিতে মিশিয়ে বা পাতায় স্প্রে" },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function SoilPage() {
  const { location } = useLocation();
  const [selectedSoil, setSelectedSoil] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [area, setArea] = useState("1");
  const [activeTab, setActiveTab] = useState<"calculator" | "analysis" | "guide">("calculator");

  // Auto-detect soil type from district
  const detectedSoil = location?.district ? SOIL_ZONES[location.district] || "loam" : null;

  const soil = SOIL_TYPES.find((s) => s.id === (selectedSoil || detectedSoil || "loam"));
  const crop = CROPS.find((c) => c.id === selectedCrop);
  const areaNum = Math.max(parseFloat(area) || 1, 0.1);

  // Calculate fertilizer amounts
  const calculateFertilizer = useCallback(() => {
    if (!crop) return null;
    return {
      urea: (crop.urea * areaNum).toFixed(1),
      tsp: (crop.tsp * areaNum).toFixed(1),
      mop: (crop.mop * areaNum).toFixed(1),
      gypsum: (crop.gypsum * areaNum).toFixed(1),
      zinc: (crop.zinc * areaNum).toFixed(1),
    };
  }, [crop, areaNum]);

  const fertResult = calculateFertilizer();

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="relative px-4 pt-5 pb-7" style={{ background: "linear-gradient(135deg,#9d174d,#831843)" }}>
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">SOIL SCIENCE</div>
        <h1 className="text-[22px] font-bold text-white mb-1">🏺 মৃত্তিকা বিশেষজ্ঞ</h1>
        <p className="text-xs text-white/70">মাটি পরীক্ষা, সার ক্যালকুলেটর ও পুষ্টি বিশ্লেষণ — SRDI ভিত্তিক</p>
        {location?.district && (
          <div className="text-[10px] text-white/60 mt-2">📍 {location.district} — {detectedSoil ? SOIL_TYPES.find(s => s.id === detectedSoil)?.name : "মাটি নির্ণয় হচ্ছে"}</div>
        )}
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          {[
            { key: "calculator", label: "🧮 সার ক্যালকুলেটর" },
            { key: "analysis", label: "🔍 মাটি বিশ্লেষণ" },
            { key: "guide", label: "📖 নির্দেশিকা" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "calculator" | "analysis" | "guide")}
              className={`flex-1 text-[11px] font-bold py-2 px-2 rounded-lg transition-all cursor-pointer border-none ${
                activeTab === tab.key
                  ? "bg-white text-pink-800 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CALCULATOR TAB ────────────────────────────────────────────── */}
        {activeTab === "calculator" && (
          <div className="space-y-4">
            {/* Soil type selector */}
            <div>
              <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-2">১. মাটির ধরন নির্বাচন করুন</div>
              <div className="grid grid-cols-3 gap-2">
                {SOIL_TYPES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSoil(s.id)}
                    className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                      (selectedSoil || detectedSoil || "loam") === s.id
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 dark:border-gray-700 bg-white hover:border-pink-300"
                    }`}
                  >
                    <div className="text-lg">{s.icon}</div>
                    <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{s.name}</div>
                    <div className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">{s.en}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Crop selector */}
            <div>
              <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-2">২. ফসল নির্বাচন করুন</div>
              <div className="grid grid-cols-4 gap-1.5">
                {CROPS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCrop(c.id)}
                    className={`p-2 rounded-lg border-2 text-center transition-all cursor-pointer ${
                      selectedCrop === c.id
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 dark:border-gray-700 bg-white hover:border-pink-300"
                    }`}
                  >
                    <div className="text-lg">{c.icon}</div>
                    <div className="text-[9px] font-bold text-gray-800 dark:text-gray-200">{c.name}</div>
                    <div className="text-[8px] text-gray-400 dark:text-gray-500">{c.season}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Area input */}
            <div>
              <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-2">৩. জমির পরিমাণ (বিঘায়)</div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  min="0.1"
                  step="0.5"
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-gray-100 outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400/30"
                />
                <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500">বিঘা</span>
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">১ বিঘা = ৩৩ শতক = ১,৩৩৭ বর্গমিটার</div>
            </div>

            {/* Results */}
            {fertResult && crop && (
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-200 p-4">
                <div className="text-[13px] font-extrabold text-gray-900 dark:text-gray-100 mb-1">
                  {crop.icon} {crop.name} — {areaNum} বিঘার জন্য সারের মাত্রা
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-3">
                  {soil?.name} মাটি · SRDI সুপারিশকৃত
                </div>

                <div className="space-y-2">
                  {[
                    { name: "ইউরিয়া", val: fertResult.urea, unit: "কেজি", info: FERTILIZER_INFO[0] },
                    { name: "টিএসপি", val: fertResult.tsp, unit: "কেজি", info: FERTILIZER_INFO[1] },
                    { name: "এমওপি", val: fertResult.mop, unit: "কেজি", info: FERTILIZER_INFO[2] },
                    { name: "জিপসাম", val: fertResult.gypsum, unit: "কেজি", info: FERTILIZER_INFO[3] },
                    { name: "জিংক সালফেট", val: fertResult.zinc, unit: "কেজি", info: FERTILIZER_INFO[4] },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-2.5 border border-gray-100 dark:border-gray-700">
                      <span className="text-base">{f.info.icon}</span>
                      <div className="flex-1">
                        <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{f.name}</div>
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">{f.info.en}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[14px] font-extrabold" style={{ color: f.info.color }}>{f.val}</div>
                        <div className="text-[9px] text-gray-400 dark:text-gray-500">{f.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Soil adjustment note */}
                {soil && soil.drainLevel === "low" && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-800">
                    ⚠️ {soil.name} — জল নিষ্কাশন ধীর। ইউরিয়া ৪ কিস্তায় প্রয়োগ করুন। জিপসাম বাড়তি ৫ কেজি/বিঘা দিন।
                  </div>
                )}
                {soil && soil.drainLevel === "high" && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-[11px] text-blue-800">
                    💡 {soil.name} — জল নিষ্কাশন দ্রুত। সেচ বেশি দিন, এমওপি ২ কিস্তায় প্রয়োগ করুন।
                  </div>
                )}
              </div>
            )}

            {!selectedCrop && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 text-center">
                <div className="text-2xl mb-2">👆</div>
                <div className="text-[12px] text-gray-500 dark:text-gray-400 dark:text-gray-500">ফসল নির্বাচন করুন সারের মাত্রা জানতে</div>
              </div>
            )}
          </div>
        )}

        {/* ── ANALYSIS TAB ──────────────────────────────────────────────── */}
        {activeTab === "analysis" && (
          <div className="space-y-4">
            <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-2">🔍 মাটি বিশ্লেষণ পদ্ধতি</div>
              <div className="space-y-2.5">
                {[
                  { step: "১", title: "নমুনা সংগ্রহ", desc: "জমির বিভিন্ন স্থান থেকে 'V' আকৃতিতে খনন করে ০-১৫ সেমি ও ১৫-৩০ সেমি গভীরতায় মাটি সংগ্রহ করুন।" },
                  { step: "২", title: "নমুনা মেশানো", desc: "একই ধরনের জমির কমপক্ষে ১০-১৫ জায়গা থেকে মাটি নিয়ে ভালোভাবে মিশিয়ে ৫০০ গ্রাম নমুনা তৈরি করুন।" },
                  { step: "৩", title: "শুকানো ও প্যাকেজ", desc: "ছায়ায় শুকিয়ে পরিষ্কার পলিথিন ব্যাগে ভরুন। নাম, ঠিকানা, ফসলের নাম লিখে দিন।" },
                  { step: "৪", title: "পরীক্ষাগারে জমা", desc: "নিকটস্থ SRDI আঞ্চলিক কার্যালয় বা উপজেলা কৃষি অফিসে জমা দিন। পরীক্ষা খরচ বিনামূল্যে।" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="w-7 h-7 bg-pink-600 text-white rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100">{item.title}</div>
                      <div className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Soil type compatibility */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">🌾 মাটি অনুযায়ী উপযুক্ত ফসল</div>
              <div className="space-y-2">
                {SOIL_TYPES.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <span className="text-base">{s.icon}</span>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{s.name} <span className="text-gray-400 dark:text-gray-500 font-normal">({s.en})</span></div>
                      <div className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">pH: {s.ph}</div>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {s.crops.map((c, i) => (
                        <span key={i} className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* pH Scale */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">📊 pH স্কেল ও ফসলের উপযুক্ততা</div>
              <div className="space-y-1.5">
                {[
                  { range: "৪.০–৫.৫", label: "অত্যাম্লিক", color: "bg-red-500", crops: "চা, আনারস, আলু" },
                  { range: "৫.৫–৬.৫", label: "হালকা অম্লিক", color: "bg-amber-500", crops: "ধান, পাট, আলু, মরিচ" },
                  { range: "৬.৫–৭.৫", label: "প্রায় নিরপেক্ষ", color: "bg-green-500", crops: "গম, সরিষা, সবজি, ফল (সর্বোত্তম)" },
                  { range: "৭.৫–৮.৫", label: "হালকা ক্ষারীয়", color: "bg-blue-500", crops: "গম, ছোলা, সরিষা, ডাল" },
                  { range: "৮.৫+", label: "ক্ষারীয়", color: "bg-purple-500", crops: "জিপসাম প্রয়োগ প্রয়োজন" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <div className="text-[10px] font-mono font-bold text-gray-700 dark:text-gray-300 w-16">{item.range}</div>
                    <div className="text-[10px] text-gray-600 dark:text-gray-400 w-24">{item.label}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 flex-1">{item.crops}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GUIDE TAB ─────────────────────────────────────────────────── */}
        {activeTab === "guide" && (
          <div className="space-y-3">
            {/* Fertilizer guide */}
            {FERTILIZER_INFO.map((f, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{f.icon}</span>
                  <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{f.name}</div>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 font-mono">{f.en}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 flex-shrink-0">⏱️ সময়:</span>
                    <span className="text-[11px] text-gray-700 dark:text-gray-300">{f.timing}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 flex-shrink-0">📋 পদ্ধতি:</span>
                    <span className="text-[11px] text-gray-700 dark:text-gray-300">{f.method}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Gov resources */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="text-[12px] font-bold text-green-900 mb-2">🏛️ সরকারি সেবা</div>
              <div className="space-y-1.5 text-[11px] text-green-800">
                <p>• SRDI মাটি পরীক্ষা — সম্পূর্ণ বিনামূল্যে</p>
                <p>• উপজেলা কৃষি অফিস থেকে নমুনা জমা দিন</p>
                <p>• ফলাফল ৭-১৫ দিনের মধ্যে পাওয়া যায়</p>
                <p>• ভর্তুকিতে সার — কৃষি ডিলারের মাধ্যমে</p>
              </div>
              <a
                href="https://srdi.gov.bd"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-[11px] font-bold text-green-700 bg-green-100 border border-green-300 rounded-full px-3 py-1.5 no-underline hover:bg-green-200 transition-colors"
              >
                SRDI ওয়েবসাইট →
              </a>
            </div>

            {/* AI consultation */}
            <a
              href="/chat"
              className="flex items-center gap-3 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-3.5 no-underline hover:from-pink-100 hover:to-purple-100 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center text-white text-lg">🤖</div>
              <div className="flex-1">
                <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100">AI থেকে মাটি সম্পর্কে জানুন</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 dark:text-gray-500">আপনার জমির মাটি সম্পর্কে প্রশ্ন করুন</div>
              </div>
              <span className="text-[11px] font-semibold text-pink-600">→</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
