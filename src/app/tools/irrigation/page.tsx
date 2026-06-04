"use client";

/**
 * Smart Irrigation Advisor — Water Management Tool
 *
 * Features:
 * - Crop-specific irrigation schedule
 * - Water requirement calculator
 * - Weather-based irrigation advisory
 * - Water-saving techniques for BD
 * - Location-aware suggestions
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "@/context/LocationContext";

// ── Crop water requirements (mm per growth stage) ────────────────────────────
const CROP_WATER = [
  { id: "rice_boro", name: "বোরো ধান", icon: "🌾", stages: [
    { name: "বীজতলা", days: 25, water: 5, method: "ছোট পানি ধরে রাখুন" },
    { name: "রোপণ পরবর্তী", days: 15, water: 8, method: "২-৩ সেমি পানি রাখুন" },
    { name: "কুশি পর্যায়", days: 30, water: 10, method: "৫-৭ সেমি পানি রাখুন" },
    { name: "গুড়া পর্যায়", days: 25, water: 7, method: "৩-৫ সেমি পানি রাখুন" },
    { name: "পাকা পর্যায়", days: 15, water: 3, method: "পানি সরিয়ে নিন" },
  ], totalDays: 110, totalWater: 1200 },
  { id: "rice_aman", name: "আমন ধান", icon: "🌾", stages: [
    { name: "বীজতলা", days: 20, water: 4, method: "হালকা পানি" },
    { name: "রোপণ পরবর্তী", days: 15, water: 6, method: "বৃষ্টির পানি ব্যবহার" },
    { name: "কুশি পর্যায়", days: 30, water: 8, method: "পানি নিষ্কাশন নিশ্চিত করুন" },
    { name: "গুড়া পর্যায়", days: 25, water: 6, method: "মাঝারি পানি" },
    { name: "পাকা পর্যায়", days: 15, water: 2, method: "পানি সরিয়ে নিন" },
  ], totalDays: 105, totalWater: 900 },
  { id: "wheat", name: "গম", icon: "🌾", stages: [
    { name: "অঙ্কুরোদ্গম", days: 15, water: 3, method: "হালকা সেচ" },
    { name: "ক্রাউন রুট", days: 30, water: 4, method: "১টি সেচ" },
    { name: "ফুল আসা", days: 20, water: 6, method: "সবচেয়ে গুরুত্বপূর্ণ সেচ" },
    { name: "দানা ভরা", days: 25, water: 4, method: "১টি সেচ" },
  ], totalDays: 120, totalWater: 450 },
  { id: "potato", name: "আলু", icon: "🥔", stages: [
    { name: "বপন", days: 20, water: 3, method: "হালকা সেচ" },
    { name: "গাছ বৃদ্ধি", days: 30, water: 5, method: "৭-১০ দিন পর সেচ" },
    { name: "কন্দ গঠন", days: 25, water: 6, method: "নিয়মিত সেচ — সবচেয়ে গুরুত্বপূর্ণ" },
    { name: "পাকা", days: 15, water: 3, method: "সেচ কমান" },
  ], totalDays: 90, totalWater: 500 },
  { id: "tomato", name: "টমেটো", icon: "🍅", stages: [
    { name: "চারা রোপণ", days: 15, water: 4, method: "প্রতিদিন হালকা সেচ" },
    { name: "বৃদ্ধি", days: 30, water: 5, method: "৩-৪ দিন পর সেচ" },
    { name: "ফুল ও ফল", days: 30, water: 7, method: "নিয়মিত সেচ — ফল ফাটা এড়ান" },
    { name: "ফল সংগ্রহ", days: 25, water: 5, method: "মাঝারি সেচ" },
  ], totalDays: 100, totalWater: 550 },
  { id: "onion", name: "পেঁয়াজ", icon: "🧅", stages: [
    { name: "বীজতলা", days: 30, water: 3, method: "সূক্ষ্ম স্প্রে সেচ" },
    { name: "রোপণ পরবর্তী", days: 20, water: 4, method: "৫-৭ দিন পর সেচ" },
    { name: "কন্দ গঠন", days: 30, water: 6, method: "নিয়মিত সেচ" },
    { name: "পাকা", days: 15, water: 2, method: "সেচ বন্ধ — ১০ দিন আগে" },
  ], totalDays: 95, totalWater: 400 },
  { id: "mustard", name: "সরিষা", icon: "🌻", stages: [
    { name: "বপন", days: 15, water: 3, method: "হালকা সেচ" },
    { name: "বৃদ্ধি", days: 30, water: 4, method: "১৫ দিন পর ১টি সেচ" },
    { name: "ফুল আসা", days: 20, water: 5, method: "সবচেয়ে গুরুত্বপূর্ণ সেচ" },
    { name: "বীজ গঠন", days: 20, water: 3, method: "হালকা সেচ" },
  ], totalDays: 85, totalWater: 350 },
];

// ── Water-saving techniques ──────────────────────────────────────────────────
const TECHNIQUES = [
  { icon: "💧", title: "ফেয়ারি সেচ (AWD)", desc: "বোরো ধানে ৩০% পানি বাঁচান। পানির স্তর ১৫ সেমি নিচে নামলে পুনরায় সেচ দিন। ২৫ সেমি প্লাস্টিক পাইপ মাটিতে পুঁতে পানির স্তর মাপুন।", savings: "৩০%" },
  { icon: "🌿", title: "মালচিং", desc: "শুকনো ঘাস, খড় বা পলিথিন দিয়ে মাটি ঢেকে রাখুন। আর্দ্রতা সংরক্ষণ হয়, আগাছা কমে। সবজি ও ফল চাষে কার্যকর।", savings: "২৫%" },
  { icon: "🌊", title: "ড্রিপ সেচ", desc: "পাইপের মাধ্যমে সরাসরি গাছের গোড়ায় পানি দিন। সবজি, ফল ও ফুলের চাষে আদর্শ। প্রাথমিক খরচ বেশি কিন্তু দীর্ঘমেয়াদে লাভজনক।", savings: "৪০-৬০%" },
  { icon: "⏰", title: "সময়োপযুক্ত সেচ", desc: "ভোর ৬-৮টায় বা বিকেল ৪-৬টায় সেচ দিন। দুপুরে সেচ দিলে ৩০% পানি বাষ্পীভূত হয়। বাতাস কম থাকলে সেচ দিন।", savings: "২০%" },
  { icon: "🏞️", title: "জমি সমান করা", desc: "জমি সমান না হলে পানি একস্থানে জমে আরেকস্থানে শুকায়। লেজার ল্যান্ড লেভেলার ব্যবহার করুন। পানি ২৫% কম লাগে।", savings: "২৫%" },
  { icon: "🔄", title: "বৃষ্টির পানি সংরক্ষণ", desc: "খাল, পুকুর ও জলাশয় খনন করুন। বৃষ্টির পানি ধরে রেখে শুষ্ক মৌসুমে ব্যবহার করুন। ছোট বাঁধ দিয়ে পানি আটকান।", savings: "৩০%" },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function IrrigationPage() {
  const { location } = useLocation();
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [area, setArea] = useState("1");
  const [activeTab, setActiveTab] = useState<"schedule" | "calculator" | "techniques">("schedule");
  const [weatherData, setWeatherData] = useState<{ rain: number; humid: number; soilMoisture: number } | null>(null);

  const crop = CROP_WATER.find((c) => c.id === selectedCrop);
  const areaNum = Math.max(parseFloat(area) || 1, 0.1);

  // Fetch weather for irrigation advisory
  useEffect(() => {
    if (!location) return;
    fetch(`/api/weather?lat=${location.lat}&lon=${location.lon}&city=${location.city || location.district}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setWeatherData({
            rain: d.rain || 0,
            humid: d.humid || 0,
            soilMoisture: d.soilMoisture || 0,
          });
        }
      })
      .catch(() => {});
  }, [location]);

  const bn = (n: number | string) =>
    String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

  // Water requirement calculation
  const totalWaterM3 = crop ? (crop.totalWater * areaNum * 10) : 0;

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="relative px-4 pt-5 pb-7" style={{ background: "linear-gradient(135deg,#0e7490,#155e75)" }}>
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">IRRIGATION</div>
        <h1 className="text-[22px] font-bold text-white mb-1">💧 স্মার্ট সেচ ব্যবস্থাপনা</h1>
        <p className="text-xs text-white/70">আবহাওয়া ও মাটির আর্দ্রতা ভিত্তিক সেচ পরামর্শ</p>
        {weatherData && (
          <div className="mt-2 flex gap-3">
            <span className="text-[10px] text-white/60">🌧️ বৃষ্টি: {weatherData.rain.toFixed(1)}mm</span>
            <span className="text-[10px] text-white/60">💧 আর্দ্রতা: {bn(Math.round(weatherData.humid))}%</span>
            <span className="text-[10px] text-white/60">🌱 মাটি আর্দ্রতা: {bn(Math.round(weatherData.soilMoisture * 100))}%</span>
          </div>
        )}
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          {[
            { key: "schedule", label: "📅 সেচ সময়সূচি" },
            { key: "calculator", label: "🧮 পানি ক্যালকুলেটর" },
            { key: "techniques", label: "💡 পানি সাশ্রয়" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "schedule" | "calculator" | "techniques")}
              className={`flex-1 text-[11px] font-bold py-2 px-1.5 rounded-lg transition-all cursor-pointer border-none ${
                activeTab === tab.key
                  ? "bg-white text-cyan-800 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── SCHEDULE TAB ──────────────────────────────────────────────── */}
        {activeTab === "schedule" && (
          <div className="space-y-4">
            <div>
              <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-2">ফসল নির্বাচন করুন</div>
              <div className="grid grid-cols-4 gap-1.5">
                {CROP_WATER.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCrop(c.id)}
                    className={`p-2 rounded-lg border-2 text-center transition-all cursor-pointer ${
                      selectedCrop === c.id
                        ? "border-cyan-500 bg-cyan-50"
                        : "border-gray-200 dark:border-gray-700 bg-white hover:border-cyan-300"
                    }`}
                  >
                    <div className="text-lg">{c.icon}</div>
                    <div className="text-[9px] font-bold text-gray-800 dark:text-gray-200">{c.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {crop && (
              <div className="space-y-3">
                {weatherData && weatherData.rain > 5 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <span>🌧️</span>
                      <div className="text-[11px] text-blue-800">
                        বৃষ্টির পূর্বাভাস ({bn(weatherData.rain.toFixed(1))}mm) — আজ সেচ দরকার নাও হতে পারে। মাটির আর্দ্রতা পরীক্ষা করুন।
                      </div>
                    </div>
                  </div>
                )}

                {weatherData && weatherData.soilMoisture > 0.4 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <span>✅</span>
                      <div className="text-[11px] text-green-800">
                        মাটির আর্দ্রতা পর্যাপ্ত ({bn(Math.round(weatherData.soilMoisture * 100))}%)। সেচ বিলম্ব করতে পারেন।
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4">
                  <div className="text-[14px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                    {crop.icon} {crop.name} — সেচ সময়সূচি
                  </div>
                  <div className="space-y-2.5">
                    {crop.stages.map((stage, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-cyan-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-cyan-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                            <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100">{stage.name}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500">{bn(stage.days)} দিন</span>
                        </div>
                        <div className="flex items-center gap-3 ml-8">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-cyan-600">💧</span>
                            <span className="text-[10px] text-gray-700 dark:text-gray-300">{stage.water} mm/দিন</span>
                          </div>
                          <div className="flex-1 text-[10px] text-gray-600 dark:text-gray-400">{stage.method}</div>
                        </div>
                        <div className="ml-8 mt-1.5">
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                              style={{ width: `${(stage.water / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between items-center text-[11px]">
                    <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">মোট মৌসুম: {bn(crop.totalDays)} দিন</span>
                    <span className="text-cyan-700 font-bold">মোট পানি: {bn(crop.totalWater)} mm</span>
                  </div>
                </div>
              </div>
            )}

            {!selectedCrop && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 text-center">
                <div className="text-2xl mb-2">💧</div>
                <div className="text-[12px] text-gray-500 dark:text-gray-400 dark:text-gray-500">ফসল নির্বাচন করুন সেচ সময়সূচি জানতে</div>
              </div>
            )}
          </div>
        )}

        {/* ── CALCULATOR TAB ────────────────────────────────────────────── */}
        {activeTab === "calculator" && (
          <div className="space-y-4">
            <div>
              <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-2">ফসল নির্বাচন করুন</div>
              <select
                value={selectedCrop || ""}
                onChange={(e) => setSelectedCrop(e.target.value || null)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-cyan-400"
              >
                <option value="">নির্বাচন করুন</option>
                {CROP_WATER.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-2">জমির পরিমাণ (হেক্টর)</div>
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                min="0.1"
                step="0.5"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-gray-100 outline-none focus:border-cyan-400"
              />
            </div>

            {crop && (
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200 p-4">
                <div className="text-[14px] font-extrabold text-gray-900 dark:text-gray-100 mb-3">
                  {crop.icon} {crop.name} — পানির প্রয়োজন
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-cyan-100 text-center">
                    <div className="text-[20px] font-extrabold text-cyan-700">{bn(crop.totalWater)}</div>
                    <div className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">মিমি/হেক্টর/মৌসুম</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-cyan-100 text-center">
                    <div className="text-[20px] font-extrabold text-blue-700">{bn(totalWaterM3.toFixed(0))}</div>
                    <div className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">ঘনমিটার ({bn(areaNum)} হেক্টর)</div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-cyan-100">
                  <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">পাম্প চালানোর সময় অনুমান</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    ১ সিএফটি/সেকেন্ড পাম্প = প্রায় {bn(Math.round(totalWaterM3 / 100))} ঘণ্টা ({bn(areaNum)} হেক্টরের জন্য)
                  </div>
                  <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">* পাম্পের ক্ষমতা অনুযায়ী সময় ভিন্ন হবে</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TECHNIQUES TAB ────────────────────────────────────────────── */}
        {activeTab === "techniques" && (
          <div className="space-y-3">
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3">
              <div className="text-[12px] font-bold text-cyan-900 mb-1">💡 পানি সাশ্রয়ী প্রযুক্তি</div>
              <div className="text-[10px] text-cyan-700">এই প্রযুক্তি ব্যবহার করে ৩০-৬০% পানি বাঁচানো সম্ভব</div>
            </div>

            {TECHNIQUES.map((t, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{t.icon}</span>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{t.title}</div>
                  </div>
                  <span className="text-[11px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {t.savings} সাশ্রয়
                  </span>
                </div>
                <div className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{t.desc}</div>
              </div>
            ))}

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="text-[12px] font-bold text-green-900 mb-2">🏛️ সরকারি সেচ সুবিধা</div>
              <div className="text-[11px] text-green-800 space-y-1.5">
                <p>• ভর্তুকিতে গভীর নলকূপ — বিএডিসি থেকে আবেদন</p>
                <p>• লেজার ল্যান্ড লেভেলার — ভর্তুকিতে ভাড়া</p>
                <p>• ড্রিপ সেচ সেট — ৫০-৭০% ভর্তুকি</p>
                <p>• পানি সংরক্ষণ প্রকল্প — কৃষি মন্ত্রণালয়</p>
              </div>
              <a
                href="https://badc.gov.bd"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-[11px] font-bold text-green-700 bg-green-100 border border-green-300 rounded-full px-3 py-1.5 no-underline hover:bg-green-200 transition-colors"
              >
                BADC ওয়েবসাইট →
              </a>
            </div>
          </div>
        )}

        {/* AI consultation */}
        <a
          href="/chat"
          className="flex items-center gap-3 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-3.5 no-underline hover:from-cyan-100 hover:to-blue-100 transition-all mt-4"
        >
          <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white text-lg">🤖</div>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100">AI থেকে সেচ পরামর্শ নিন</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 dark:text-gray-500">আপনার জমির সেচ সম্পর্কে প্রশ্ন করুন</div>
          </div>
          <span className="text-[11px] font-semibold text-cyan-600">→</span>
        </a>
      </div>
    </div>
  );
}
