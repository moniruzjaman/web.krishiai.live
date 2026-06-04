"use client";

/**
 * Yield Forecast Tool — AI-Powered Crop Yield Estimator
 *
 * Features:
 * - Crop yield estimation based on variety, area, season
 * - Weather impact assessment
 * - Market price projection
 * - Risk evaluation
 * - Bengali units and localization
 */

import { useState, useCallback, useEffect } from "react";
import { useLocation } from "@/context/LocationContext";

// ── Crop yield data (Bangladesh average yields) ──────────────────────────────
const YIELD_DATA = [
  { id: "rice_boro", name: "বোরো ধান", icon: "🌾", avgYield: 4.5, unit: "টন/হেক্টর", pricePerKg: 25, season: "রবি", riskFactors: ["শীতল প্রবাহ", "ব্লাস্ট রোগ", "পানি সংকট"], variety: ["ব্রি ধান-২৮", "ব্রি ধান-২৯", "ব্রি ধান-৫০", "ব্রি ধান-৮৪"] },
  { id: "rice_aman", name: "আমন ধান", icon: "🌾", avgYield: 3.0, unit: "টন/হেক্টর", pricePerKg: 22, season: "খরিফ", riskFactors: ["বন্যা", "ঝড়", "গাছফড়িং"], variety: ["ব্রি ধান-৩৩", "ব্রি ধান-৪৯", "ব্রি ধান-৬২", "ব্রি ধান-৮৭"] },
  { id: "rice_aus", name: "আউশ ধান", icon: "🌾", avgYield: 2.5, unit: "টন/হেক্টর", pricePerKg: 20, season: "খরিফ-১", riskFactors: ["খরা", "পোকামাকড়", "ঝড়"], variety: ["ব্রি ধান-৪৩", "ব্রি ধান-৪৮", "ব্রি ধান-৬৫"] },
  { id: "wheat", name: "গম", icon: "🌾", avgYield: 3.0, unit: "টন/হেক্টর", pricePerKg: 38, season: "রবি", riskFactors: ["শীতল প্রবাহ", "পাউডারি মিলডিউ", "মাটির আর্দ্রতা"], variety: ["ব্রি গম-২৬", "ব্রি গম-৩৩", "প্রোবিড"] },
  { id: "potato", name: "আলু", icon: "🥔", avgYield: 20.0, unit: "টন/হেক্টর", pricePerKg: 15, season: "রবি", riskFactors: ["ব্লাইট", "আলু মাছি", "শীত"], variety: ["ডায়মন্ড", "কারডিনাল", "গ্রানুলা", "আলুরাজ"] },
  { id: "mustard", name: "সরিষা", icon: "🌻", avgYield: 1.2, unit: "টন/হেক্টর", pricePerKg: 85, season: "রবি", riskFactors: ["মাজরা", "অ্যালটারনেরিয়া ব্লাইট", "খরা"], variety: ["ব্রি সরিষা-১৪", "ব্রি সরিষা-১৫", "তোরি-৭"] },
  { id: "jute", name: "পাট", icon: "🪢", avgYield: 2.5, unit: "টন/হেক্টর", pricePerKg: 70, season: "খরিফ", riskFactors: ["সেমিলুপার", "মোজাইক রোগ", "বন্যা"], variety: ["বিজেআরআই তোষা-৮", "ও-৯৮৯৭", "বিজেআরআই দেশী-৭"] },
  { id: "tomato", name: "টমেটো", icon: "🍅", avgYield: 18.0, unit: "টন/হেক্টর", pricePerKg: 20, season: "রবি", riskFactors: ["ফল ছিদ্রকারী", "ব্যাকটেরিয়াল উইল্ট", "ভাইরাস"], variety: ["বারি টমেটো-১৪", "বারি টমেটো-১৫", "রোমা"] },
  { id: "onion", name: "পেঁয়াজ", icon: "🧅", avgYield: 12.0, unit: "টন/হেক্টর", pricePerKg: 35, season: "রবি", riskFactors: ["থ্রিপস", "পাতার দাগ", "বৃষ্টি"], variety: ["বারি পেঁয়াজ-১", "বারি পেঁয়াজ-৪", "তাহেরপুরী"] },
  { id: "maize", name: "ভুট্টা", icon: "🌽", avgYield: 6.0, unit: "টন/হেক্টর", pricePerKg: 22, season: "খরিফ/রবি", riskFactors: ["ফলন্দার পোকা", "দাগ রোগ", "ঝড়"], variety: ["বারি ভুট্টা-৭", "বারি ভুট্টা-৯", "হাইব্রিড"] },
];

// ── Weather impact multipliers ───────────────────────────────────────────────
const WEATHER_IMPACT = {
  favorable: { label: "অনুকূল", mult: 1.15, color: "text-green-600", bg: "bg-green-50" },
  normal: { label: "স্বাভাবিক", mult: 1.0, color: "text-blue-600", bg: "bg-blue-50" },
  unfavorable: { label: "প্রতিকূল", mult: 0.75, color: "text-amber-600", bg: "bg-amber-50" },
  severe: { label: "মারাত্মক", mult: 0.5, color: "text-red-600", bg: "bg-red-50" },
};

// ── Season calendar ──────────────────────────────────────────────────────────
const SEASON_CALENDAR = [
  { month: "জানু", key: "jan", season: "রবি", tasks: "আলু, সরিষা, গম চাষ চলমান; বোরো বীজতলা" },
  { month: "ফেব্রু", key: "feb", season: "রবি", tasks: "বোরো রোপণ; রবি সবজি সংগ্রহ" },
  { month: "মার্চ", key: "mar", season: "প্রাক-খরিফ", tasks: "বোরো যত্ন; আউশ বীজতলা" },
  { month: "এপ্রিল", key: "apr", season: "প্রাক-খরিফ", tasks: "বোরো কাটা; গ্রীষ্মকালীন সবজি" },
  { month: "মে", key: "may", season: "খরিফ-১", tasks: "আউশ রোপণ; পাট চাষ; ভুট্টা" },
  { month: "জুন", key: "jun", season: "খরিফ-১", tasks: "আমন বীজতলা; পাট যত্ন; বর্ষা প্রস্তুতি" },
  { month: "জুলাই", key: "jul", season: "খরিফ-২", tasks: "আমন রোপণ; পাট কাটা শুরু" },
  { month: "আগস্ট", key: "aug", season: "খরিফ-২", tasks: "আমন যত্ন; পাট কাটা চলমান" },
  { month: "সেপ্টে", key: "sep", season: "আমন/রবি প্রস্তুতি", tasks: "আমন ফসল রক্ষা; রবি প্রস্তুতি" },
  { month: "অক্টো", key: "oct", season: "আমন/রবি প্রস্তুতি", tasks: "আমন কাটা শুরু; রবি জমি তৈরি" },
  { month: "নভে", key: "nov", season: "রবি", tasks: "আলু, পেঁয়াজ, সরিষা রোপণ; গম বপন" },
  { month: "ডিসে", key: "dec", season: "রবি", tasks: "রবি ফসল যত্ন; বোরো বীজতলা প্রস্তুতি" },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function YieldPage() {
  const { location } = useLocation();
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [area, setArea] = useState("1");
  const [variety, setVariety] = useState("optimal");
  const [weather, setWeather] = useState<keyof typeof WEATHER_IMPACT>("normal");
  const [activeTab, setActiveTab] = useState<"estimate" | "calendar" | "market">("estimate");

  const crop = YIELD_DATA.find((c) => c.id === selectedCrop);
  const areaNum = Math.max(parseFloat(area) || 1, 0.1);
  const varietyMult = variety === "optimal" ? 1.2 : variety === "average" ? 1.0 : 0.8;
  const weatherMult = WEATHER_IMPACT[weather].mult;

  // Calculate estimated yield
  const estimateYield = useCallback(() => {
    if (!crop) return null;
    const yieldPerHa = crop.avgYield * varietyMult * weatherMult;
    const totalYield = yieldPerHa * areaNum;
    const revenue = totalYield * 1000 * crop.pricePerKg; // Convert ton to kg
    return {
      yieldPerHa: yieldPerHa.toFixed(2),
      totalYield: totalYield.toFixed(2),
      revenue: revenue.toLocaleString("bn-BD"),
      revenueNum: revenue,
    };
  }, [crop, varietyMult, weatherMult, areaNum]);

  const estimate = estimateYield();

  // Current month index
  const currentMonth = new Date().getMonth();

  // Bengali numeral conversion
  const bn = (n: number | string) =>
    String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="relative px-4 pt-5 pb-7" style={{ background: "linear-gradient(135deg,#6d28d9,#5b21b6)" }}>
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">YIELD FORECAST</div>
        <h1 className="text-[22px] font-bold text-white mb-1">📈 ফলন পূর্বাভাস</h1>
        <p className="text-xs text-white/70">ফসল ভিত্তিক ফলন অনুমান, আয় হিসাব ও ঝুঁকি মূল্যায়ন</p>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
          {[
            { key: "estimate", label: "📊 ফলন অনুমান" },
            { key: "calendar", label: "📅 মৌসুম ক্যালেন্ডার" },
            { key: "market", label: "💰 বাজার প্রক্ষেপণ" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "estimate" | "calendar" | "market")}
              className={`flex-1 text-[11px] font-bold py-2 px-1.5 rounded-lg transition-all cursor-pointer border-none ${
                activeTab === tab.key
                  ? "bg-white text-purple-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── ESTIMATE TAB ──────────────────────────────────────────────── */}
        {activeTab === "estimate" && (
          <div className="space-y-4">
            {/* Crop selector */}
            <div>
              <div className="text-[12px] font-bold text-gray-700 mb-2">১. ফসল নির্বাচন করুন</div>
              <div className="grid grid-cols-5 gap-1.5">
                {YIELD_DATA.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCrop(c.id)}
                    className={`p-2 rounded-lg border-2 text-center transition-all cursor-pointer ${
                      selectedCrop === c.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 bg-white hover:border-purple-300"
                    }`}
                  >
                    <div className="text-lg">{c.icon}</div>
                    <div className="text-[9px] font-bold text-gray-800">{c.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {crop && (
              <>
                {/* Area input */}
                <div>
                  <div className="text-[12px] font-bold text-gray-700 mb-2">২. জমির পরিমাণ</div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      min="0.1"
                      step="0.5"
                      className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30"
                    />
                    <span className="text-[12px] font-bold text-gray-500">হেক্টর</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">১ হেক্টর = ৭.৫ বিঘা = ২৪৭ শতক</div>
                </div>

                {/* Variety quality */}
                <div>
                  <div className="text-[12px] font-bold text-gray-700 mb-2">৩. জাতের মান</div>
                  <div className="flex gap-2">
                    {[
                      { key: "optimal", label: "উন্নত জাত", icon: "⭐", desc: "+২০% ফলন" },
                      { key: "average", label: "সাধারণ", icon: "✓", desc: "গড় ফলন" },
                      { key: "local", label: "স্থানীয় জাত", icon: "↓", desc: "-২০% ফলন" },
                    ].map((v) => (
                      <button
                        key={v.key}
                        onClick={() => setVariety(v.key)}
                        className={`flex-1 p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                          variety === v.key
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 bg-white hover:border-purple-300"
                        }`}
                      >
                        <div className="text-[11px] font-bold text-gray-900">{v.icon} {v.label}</div>
                        <div className="text-[9px] text-gray-500">{v.desc}</div>
                      </button>
                    ))}
                  </div>
                  {crop.variety.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {crop.variety.map((v, i) => (
                        <span key={i} className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{v}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Weather condition */}
                <div>
                  <div className="text-[12px] font-bold text-gray-700 mb-2">৪. আবহাওয়ার অবস্থা</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(Object.entries(WEATHER_IMPACT) as [string, { label: string; mult: number; color: string; bg: string }][]).map(([key, w]) => (
                      <button
                        key={key}
                        onClick={() => setWeather(key as keyof typeof WEATHER_IMPACT)}
                        className={`p-2 rounded-lg border-2 text-center transition-all cursor-pointer ${
                          weather === key
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 bg-white hover:border-purple-300"
                        }`}
                      >
                        <div className={`text-[11px] font-bold ${w.color}`}>{w.label}</div>
                        <div className="text-[9px] text-gray-500">{w.mult > 1 ? `+${((w.mult - 1) * 100).toFixed(0)}%` : w.mult < 1 ? `${((w.mult - 1) * 100).toFixed(0)}%` : "—"}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results */}
                {estimate && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-4">
                    <div className="text-[14px] font-extrabold text-gray-900 mb-3">
                      {crop.icon} {crop.name} — ফলন অনুমান
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-white rounded-xl p-3 border border-purple-100 text-center">
                        <div className="text-[20px] font-extrabold text-purple-700">{bn(estimate.yieldPerHa)}</div>
                        <div className="text-[9px] text-gray-500">টন/হেক্টর</div>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-purple-100 text-center">
                        <div className="text-[20px] font-extrabold text-green-700">{bn(estimate.totalYield)}</div>
                        <div className="text-[9px] text-gray-500">মোট টন ({bn(areaNum)} হেক্টর)</div>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-purple-100 text-center">
                        <div className="text-[16px] font-extrabold text-amber-700">৳{estimate.revenue}</div>
                        <div className="text-[9px] text-gray-500">আনুমানিক আয়</div>
                      </div>
                    </div>

                    {/* Risk factors */}
                    <div className="bg-white rounded-xl p-3 border border-purple-100">
                      <div className="text-[11px] font-bold text-gray-700 mb-1.5">⚠️ ঝুঁকির কারণ</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {crop.riskFactors.map((r, i) => (
                          <span key={i} className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{r}</span>
                        ))}
                      </div>
                    </div>

                    <div className="text-[9px] text-gray-400 mt-2 text-center">
                      * এই অনুমান গড় ফলন ও বর্তমান বাজার মূল্যের উপর ভিত্তি করে। প্রকৃত ফলন ভিন্ন হতে পারে।
                    </div>
                  </div>
                )}
              </>
            )}

            {!selectedCrop && (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-[12px] text-gray-500">ফসল নির্বাচন করুন ফলন অনুমান জানতে</div>
              </div>
            )}
          </div>
        )}

        {/* ── CALENDAR TAB ──────────────────────────────────────────────── */}
        {activeTab === "calendar" && (
          <div className="space-y-2">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3">
              <div className="text-[12px] font-bold text-purple-900 mb-1">📅 কৃষি মৌসুম ক্যালেন্ডার</div>
              <div className="text-[10px] text-purple-700">বর্তমান মাস হাইলাইট করা আছে</div>
            </div>

            {SEASON_CALENDAR.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl p-3 border transition-all ${
                  i === currentMonth
                    ? "bg-purple-50 border-purple-300 ring-2 ring-purple-300/50"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-bold text-gray-900">{m.month}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    m.season === "রবি" ? "bg-blue-100 text-blue-700" :
                    m.season.includes("খরিফ") ? "bg-green-100 text-green-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {m.season}
                  </span>
                  {i === currentMonth && (
                    <span className="text-[9px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full">এখন</span>
                  )}
                </div>
                <div className="text-[11px] text-gray-600">{m.tasks}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── MARKET TAB ────────────────────────────────────────────────── */}
        {activeTab === "market" && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="text-[12px] font-bold text-amber-900 mb-2">💰 ফসলভিত্তিক আয়ের হিসাব</div>
              <div className="text-[11px] text-amber-800 leading-relaxed">
                প্রতিটি ফসলের গড় ফলন ও বর্তমান বাজার মূল্য অনুযায়ী প্রতি হেক্টর আয়ের অনুমান।
              </div>
            </div>

            {YIELD_DATA.map((c, i) => {
              const revenue = c.avgYield * 1000 * c.pricePerKg;
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-lg">{c.icon}</span>
                    <div className="flex-1">
                      <div className="text-[12px] font-bold text-gray-900">{c.name}</div>
                      <div className="text-[9px] text-gray-500">{c.season} মৌসুম · গড় {c.avgYield} {c.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-extrabold text-green-700">৳{bn(revenue.toLocaleString())}</div>
                      <div className="text-[9px] text-gray-400">প্রতি হেক্টর</div>
                    </div>
                  </div>

                  {/* Mini bar chart */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                      style={{ width: `${Math.min((revenue / 500000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-blue-900 mb-1">💡 টিপস</div>
              <div className="text-[10px] text-blue-800 space-y-1">
                <p>• আলু ও টমেটো সবচেয়ে বেশি আয় দেয় প্রতি হেক্টরে</p>
                <p>• সরিষা ও পেঁয়াজের মূল্য ওঠানামা বেশি — সঠিক সময়ে বিক্রি করুন</p>
                <p>• ধানের গড় আয় কম কিন্তু ঝুঁকিও কম</p>
              </div>
            </div>

            <a
              href="/chat"
              className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3.5 no-underline hover:from-purple-100 hover:to-indigo-100 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white text-lg">🤖</div>
              <div className="flex-1">
                <div className="text-[13px] font-bold text-gray-900">AI থেকে ফলন সম্পর্কে জানুন</div>
                <div className="text-[11px] text-gray-500">আপনার ফসলের ফলন সম্পর্কে বিস্তারিত জানুন</div>
              </div>
              <span className="text-[11px] font-semibold text-purple-600">→</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
