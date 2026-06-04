"use client";

/**
 * Satellite Monitoring Page — NDVI Visualization & Farm Health
 *
 * Features:
 * - Interactive NDVI map with simulated Leaflet overlay
 * - Location-based farm health using LocationContext
 * - Seasonal NDVI insights with 12-month trend chart
 * - 3 tabs: NDVI Map, Crop Health, Seasonal Comparison
 * - Info cards showing current NDVI, crop health, rain probability, soil moisture
 * - All text in Bengali
 */

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useLocation } from "@/context/LocationContext";

// ── Dynamic NDVI Map import (same pattern as MapWidget) ────────────────────
const NDVIMap = dynamic(() => import("@/components/NDVIMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-500 text-sm bg-gray-50">
      <span className="animate-spin text-2xl">🛰️</span>
      মানচিত্র লোড হচ্ছে…
    </div>
  ),
});

// ── NDVI Simulation ─────────────────────────────────────────────────────────
function getSimulatedNDVI(month: number, lat: number, lng: number): number {
  // Bangladesh seasonal pattern
  let base = 0.45;
  if (month >= 1 && month <= 4) base = 0.65; // Boro
  else if (month >= 5 && month <= 8) base = 0.55; // Aus
  else if (month >= 9 && month <= 11) base = 0.60; // Aman
  else base = 0.35; // Fallow

  // Add location-based variation
  const variation = Math.sin(lat * 0.1) * 0.1 + Math.cos(lng * 0.05) * 0.05;
  return Math.max(0.1, Math.min(0.95, base + variation + (Math.random() * 0.05 - 0.025)));
}

function getNDVIColor(ndvi: number): string {
  if (ndvi < 0.2) return "#8B4513";
  if (ndvi < 0.35) return "#DAA520";
  if (ndvi < 0.5) return "#F4D03F";
  if (ndvi < 0.65) return "#7CCD7C";
  if (ndvi < 0.8) return "#32CD32";
  return "#006400";
}

function getHealthLabel(ndvi: number): { bn: string; en: string; color: string } {
  if (ndvi < 0.3) return { bn: "খারাপ", en: "Poor", color: "#dc2626" };
  if (ndvi < 0.5) return { bn: "মাঝারি", en: "Fair", color: "#f59e0b" };
  if (ndvi < 0.7) return { bn: "ভালো", en: "Good", color: "#16a34a" };
  return { bn: "চমৎকার", en: "Excellent", color: "#059669" };
}

function getTrend(currentMonth: number, lat: number, lng: number): { label: string; icon: string; color: string } {
  const current = getSimulatedNDVI(currentMonth, lat, lng);
  const prev = getSimulatedNDVI(currentMonth === 1 ? 12 : currentMonth - 1, lat, lng);
  const diff = current - prev;

  if (diff > 0.03) return { label: "উন্নতি হচ্ছে", icon: "📈", color: "#16a34a" };
  if (diff < -0.03) return { label: "হ্রাস পাচ্ছে", icon: "📉", color: "#dc2626" };
  return { label: "স্থিতিশীল", icon: "➡️", color: "#f59e0b" };
}

// ── Monthly NDVI data generator ──────────────────────────────────────────────
function getMonthlyNDVI(lat: number, lng: number): { month: string; ndvi: number }[] {
  const months = [
    "জানু", "ফেব্রু", "মার্চ", "এপ্রি", "মে", "জুন",
    "জুলা", "আগ", "সেপ্টে", "অক্টো", "নভে", "ডিসে",
  ];
  // Use a deterministic seed based on location so data is stable per session
  const seed = Math.abs(Math.sin(lat * 10) * 100 + Math.cos(lng * 10) * 100);
  return months.map((m, i) => {
    const month = i + 1;
    let base = 0.45;
    if (month >= 1 && month <= 4) base = 0.65;
    else if (month >= 5 && month <= 8) base = 0.55;
    else if (month >= 9 && month <= 11) base = 0.60;
    else base = 0.35;
    const variation = Math.sin(lat * 0.1 + i * 0.3) * 0.08 + Math.cos(lng * 0.05 + i * 0.2) * 0.04;
    const deterministicNoise = Math.sin(seed + i * 17) * 0.03;
    return {
      month: m,
      ndvi: Math.max(0.1, Math.min(0.95, base + variation + deterministicNoise)),
    };
  });
}

// ── Seasonal crop NDVI ranges ────────────────────────────────────────────────
const CROP_NDVI_DATA = [
  {
    crop: "ধান (বোরো)",
    icon: "🌾",
    season: "জানুয়ারি - এপ্রিল",
    ndviRange: "০.৬০ - ০.৮০",
    minNDVI: 0.60,
    maxNDVI: 0.80,
    status: "active" as const,
  },
  {
    crop: "ধান (আউশ)",
    icon: "🌾",
    season: "এপ্রিল - আগস্ট",
    ndviRange: "০.৪০ - ০.৬০",
    minNDVI: 0.40,
    maxNDVI: 0.60,
    status: "upcoming" as const,
  },
  {
    crop: "ধান (আমন)",
    icon: "🌾",
    season: "জুন - নভেম্বর",
    ndviRange: "০.৫০ - ০.৭৫",
    minNDVI: 0.50,
    maxNDVI: 0.75,
    status: "upcoming" as const,
  },
  {
    crop: "গম",
    icon: "🌾",
    season: "নভেম্বর - মার্চ",
    ndviRange: "০.৪৫ - ০.৬৫",
    minNDVI: 0.45,
    maxNDVI: 0.65,
    status: "active" as const,
  },
  {
    crop: "পাট",
    icon: "🪢",
    season: "এপ্রিল - সেপ্টেম্বর",
    ndviRange: "০.৪০ - ০.৬৫",
    minNDVI: 0.40,
    maxNDVI: 0.65,
    status: "upcoming" as const,
  },
];

// ── Rain probability simulation ─────────────────────────────────────────────
function getRainProbability(month: number): number {
  // Bangladesh monsoon pattern
  if (month >= 6 && month <= 9) return 70 + Math.random() * 20; // Monsoon
  if (month === 5 || month === 10) return 40 + Math.random() * 15; // Pre/Post monsoon
  if (month >= 3 && month <= 4) return 15 + Math.random() * 20; // Spring showers
  return 5 + Math.random() * 10; // Dry season
}

// ── Soil moisture simulation ─────────────────────────────────────────────────
function getSoilMoisture(ndvi: number, month: number): number {
  let base = ndvi * 60; // NDVI correlates with moisture
  if (month >= 6 && month <= 9) base += 20; // Monsoon
  if (month >= 12 || month <= 2) base -= 15; // Dry
  return Math.max(10, Math.min(95, base));
}

// ── Season name helper ───────────────────────────────────────────────────────
function getCurrentSeason(month: number): string {
  if (month >= 1 && month <= 4) return "বোরো মৌসুম";
  if (month >= 5 && month <= 8) return "আউশ মৌসুম";
  if (month >= 9 && month <= 11) return "আমন মৌসুম";
  return "পতিত মৌসুম";
}

// ── Component ────────────────────────────────────────────────────────────────
export default function SatellitePage() {
  const { location, loading: locLoading, requestLocation } = useLocation();
  const [activeTab, setActiveTab] = useState<"map" | "health" | "season">("map");

  const currentMonth = new Date().getMonth() + 1;
  const lat = location?.lat ?? 23.8103;
  const lng = location?.lon ?? 90.4125;
  const district = location?.district || "ঢাকা";

  // Memoized simulated values
  const ndviValue = useMemo(() => getSimulatedNDVI(currentMonth, lat, lng), [currentMonth, lat, lng]);
  const healthInfo = useMemo(() => getHealthLabel(ndviValue), [ndviValue]);
  const trend = useMemo(() => getTrend(currentMonth, lat, lng), [currentMonth, lat, lng]);
  const monthlyData = useMemo(() => getMonthlyNDVI(lat, lng), [lat, lng]);
  const rainProb = useMemo(() => Math.round(getRainProbability(currentMonth)), [currentMonth]);
  const soilMoisture = useMemo(() => Math.round(getSoilMoisture(ndviValue, currentMonth)), [ndviValue, currentMonth]);
  const currentSeason = useMemo(() => getCurrentSeason(currentMonth), [currentMonth]);

  const center: [number, number] = useMemo(
    () => [lat, lng],
    [lat, lng]
  );

  const handleLocateMe = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  // Max NDVI in monthly data for bar chart scaling
  const maxNDVI = useMemo(() => Math.max(...monthlyData.map((d) => d.ndvi)), [monthlyData]);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="relative px-4 pt-5 pb-7" style={{ background: "linear-gradient(135deg,#1b4332,#2d6a4f)" }}>
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">SATELLITE</div>
        <h1 className="text-[22px] font-bold text-white mb-1">🛰️ স্যাটেলাইট মনিটরিং</h1>
        <p className="text-xs text-white/70">জমির স্বাস্থ্য পর্যবেক্ষণ — NDVI ম্যাপিং ও ফসল বিশ্লেষণ</p>
        <div className="text-[10px] text-white/60 mt-2">
          📍 {locLoading ? "অবস্থান খোঁজা হচ্ছে…" : district} · {currentSeason}
        </div>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* ── Info Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* NDVI Value */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px] font-bold">N</div>
              <span className="text-[10px] text-gray-500 font-medium">বর্তমান NDVI মান</span>
            </div>
            <div className="text-[22px] font-extrabold" style={{ color: getNDVIColor(ndviValue) }}>
              {ndviValue.toFixed(2)}
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">0 = পতিত, 1 = ঘন উদ্ভিদ</div>
          </div>

          {/* Crop Health Index */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-white text-[10px]">🌿</div>
              <span className="text-[10px] text-gray-500 font-medium">ফসল স্বাস্থ্য সূচক</span>
            </div>
            <div className="text-[18px] font-extrabold" style={{ color: healthInfo.color }}>
              {healthInfo.bn}
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5 flex items-center gap-1">
              {trend.icon} <span style={{ color: trend.color }}>{trend.label}</span>
            </div>
          </div>

          {/* Rain Probability */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px]">🌧️</div>
              <span className="text-[10px] text-gray-500 font-medium">বৃষ্টির সম্ভাবনা</span>
            </div>
            <div className="text-[22px] font-extrabold text-blue-700">
              {rainProb}%
            </div>
            <div className="w-full bg-blue-100 rounded-full h-1.5 mt-1.5">
              <div
                className="bg-blue-600 rounded-full h-1.5 transition-all"
                style={{ width: `${rainProb}%` }}
              />
            </div>
          </div>

          {/* Soil Moisture */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-white text-[10px]">💧</div>
              <span className="text-[10px] text-gray-500 font-medium">মাটির আর্দ্রতা</span>
            </div>
            <div className="text-[22px] font-extrabold text-teal-700">
              {soilMoisture}%
            </div>
            <div className="w-full bg-teal-100 rounded-full h-1.5 mt-1.5">
              <div
                className="bg-teal-600 rounded-full h-1.5 transition-all"
                style={{ width: `${soilMoisture}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
          {[
            { key: "map", label: "🗺️ NDVI ম্যাপ" },
            { key: "health", label: "🌿 ফসল স্বাস্থ্য" },
            { key: "season", label: "📊 মৌসুম তুলনা" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "map" | "health" | "season")}
              className={`flex-1 text-[11px] font-bold py-2.5 px-2 rounded-lg transition-all cursor-pointer border-none ${
                activeTab === tab.key
                  ? "bg-white text-green-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: NDVI Map ──────────────────────────────────────────────── */}
        {activeTab === "map" && (
          <div className="space-y-4">
            {/* Map container */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden card-shadow">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50/80">
                <span className="text-[13px] font-bold text-gray-900">🗺️ NDVI মানচিত্র</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-full font-bold">
                    {district}
                  </span>
                  <button
                    onClick={handleLocateMe}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border border-green-300 cursor-pointer transition-all active:scale-90 ${
                      locLoading
                        ? "bg-green-200 text-green-700"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                    title="আমার অবস্থান"
                    aria-label="Locate me on map"
                  >
                    {locLoading ? (
                      <span className="animate-spin text-[11px]">⟳</span>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="w-full h-[320px] sm:h-[380px] relative">
                <NDVIMap center={center} ndviValue={ndviValue} />
              </div>
            </div>

            {/* NDVI Explanation */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-green-900 mb-2">💡 NDVI কী?</div>
              <div className="text-[11px] text-green-800 leading-relaxed space-y-1.5">
                <p>NDVI (Normalized Difference Vegetation Index) স্যাটেলাইট থেকে প্রাপ্ত একটি সূচক যা উদ্ভিদের ঘনত্ব ও স্বাস্থ্য পরিমাপ করে।</p>
                <p>• <strong>০.০ - ০.২:</strong> পতিত জমি, পানি, কাঠামো</p>
                <p>• <strong>০.২ - ০.৫:</strong> হালকা উদ্ভিদ, তৃণভূমি</p>
                <p>• <strong>০.৫ - ০.৮:</strong> মাঝারি থেকে ঘন উদ্ভিদ, ফসল</p>
                <p>• <strong>০.৮ - ১.০:</strong> অত্যন্ত ঘন উদ্ভিদ, বনাঞ্চল</p>
              </div>
            </div>

            {/* Data source note */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-start gap-2">
              <span className="text-sm">ℹ️</span>
              <div className="text-[10px] text-gray-500 leading-relaxed">
                তথ্য Sentinel-2 স্যাটেলাইট ডেটার উপর ভিত্তি করে সিমুলেটেড। বাস্তব NDVI মান Copernicus Browser API থেকে পাওয়া যায়। বাংলাদেশের মৌসুমী প্যাটার্ন অনুসারে ডেটা তৈরি করা হয়েছে।
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Crop Health ───────────────────────────────────────────── */}
        {activeTab === "health" && (
          <div className="space-y-4">
            {/* Location Health Summary */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: getNDVIColor(ndviValue) + "20" }}>
                  🌾
                </div>
                <div>
                  <div className="text-[14px] font-extrabold text-gray-900">{district} — ফসল স্বাস্থ্য প্রতিবেদন</div>
                  <div className="text-[11px] text-gray-500">{currentSeason} · {new Date().toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}</div>
                </div>
              </div>

              {/* NDVI bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-gray-700">NDVI মান</span>
                  <span className="text-[14px] font-extrabold" style={{ color: getNDVIColor(ndviValue) }}>{ndviValue.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                  {/* Color gradient background */}
                  <div className="absolute inset-0 flex">
                    <div className="flex-1 bg-[#8B4513]" />
                    <div className="flex-1 bg-[#DAA520]" />
                    <div className="flex-1 bg-[#F4D03F]" />
                    <div className="flex-1 bg-[#7CCD7C]" />
                    <div className="flex-1 bg-[#32CD32]" />
                    <div className="flex-1 bg-[#006400]" />
                  </div>
                  {/* Indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                    style={{ left: `${ndviValue * 100}%`, transform: "translateX(-50%)" }}
                  />
                </div>
                <div className="flex justify-between text-[8px] text-gray-400 mt-0.5">
                  <span>০.০</span>
                  <span>০.৫</span>
                  <span>১.০</span>
                </div>
              </div>

              {/* Health indicators */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white rounded-xl p-2.5 text-center border border-gray-100">
                  <div className="text-[10px] text-gray-500 mb-0.5">স্বাস্থ্য</div>
                  <div className="text-[14px] font-extrabold" style={{ color: healthInfo.color }}>{healthInfo.bn}</div>
                </div>
                <div className="bg-white rounded-xl p-2.5 text-center border border-gray-100">
                  <div className="text-[10px] text-gray-500 mb-0.5">প্রবণতা</div>
                  <div className="text-[14px] font-extrabold" style={{ color: trend.color }}>{trend.icon} {trend.label}</div>
                </div>
                <div className="bg-white rounded-xl p-2.5 text-center border border-gray-100">
                  <div className="text-[10px] text-gray-500 mb-0.5">আর্দ্রতা</div>
                  <div className="text-[14px] font-extrabold text-teal-700">{soilMoisture}%</div>
                </div>
              </div>
            </div>

            {/* Crop-specific NDVI info */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-gray-900 mb-3">🌾 প্রধান ফসলের NDVI সীমা</div>
              <div className="space-y-3">
                {CROP_NDVI_DATA.map((crop, i) => {
                  const isCurrentSeason =
                    (currentMonth >= 1 && currentMonth <= 4 && crop.crop.includes("বোরো")) ||
                    (currentMonth >= 1 && currentMonth <= 3 && crop.crop.includes("গম")) ||
                    (currentMonth >= 5 && currentMonth <= 8 && crop.crop.includes("আউশ")) ||
                    (currentMonth >= 6 && currentMonth <= 9 && crop.crop.includes("পাট")) ||
                    (currentMonth >= 9 && currentMonth <= 11 && crop.crop.includes("আমন"));

                  return (
                    <div key={i} className={`p-3 rounded-xl border ${isCurrentSeason ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{crop.icon}</span>
                        <span className="text-[12px] font-bold text-gray-900">{crop.crop}</span>
                        {isCurrentSeason && (
                          <span className="text-[8px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-bold">চলমান</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-1.5">
                        <span>📅 {crop.season}</span>
                        <span>·</span>
                        <span>NDVI: {crop.ndviRange}</span>
                      </div>
                      {/* NDVI range bar */}
                      <div className="relative w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute h-full rounded-full"
                          style={{
                            left: `${crop.minNDVI * 100}%`,
                            width: `${(crop.maxNDVI - crop.minNDVI) * 100}%`,
                            background: `linear-gradient(to right, ${getNDVIColor(crop.minNDVI)}, ${getNDVIColor(crop.maxNDVI)})`,
                          }}
                        />
                        {/* Current NDVI marker */}
                        {isCurrentSeason && (
                          <div
                            className="absolute top-0 bottom-0 w-1.5 bg-white rounded-full shadow-md border border-gray-400"
                            style={{ left: `${ndviValue * 100}%`, transform: "translateX(-50%)" }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Farm advice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-amber-900 mb-2">📋 কৃষি পরামর্শ</div>
              <div className="space-y-1.5 text-[11px] text-amber-800">
                {ndviValue < 0.3 && (
                  <>
                    <p>• ⚠️ NDVI মান খুবই কম — জমিতে সেচ ও সার প্রয়োগ দরকার</p>
                    <p>• জমি পতিত থাকলে আগাম চাষ শুরু করুন</p>
                    <p>• মাটির আর্দ্রতা বাড়াতে জৈব সার ব্যবহার করুন</p>
                  </>
                )}
                {ndviValue >= 0.3 && ndviValue < 0.5 && (
                  <>
                    <p>• ফসলের বৃদ্ধি মাঝারি — অতিরিক্ত সার ও সেচ দিন</p>
                    <p>• আগাছা পরিষ্কার করুন যাতে ফসল আলো পায়</p>
                    <p>• পোকামাকড়ের আক্রমণ চেক করুন</p>
                  </>
                )}
                {ndviValue >= 0.5 && ndviValue < 0.7 && (
                  <>
                    <p>• ✅ ফসলের অবস্থা ভালো — নিয়মিত পরিচর্যা চালিয়ে যান</p>
                    <p>• সময়মতো সার প্রয়োগ নিশ্চিত করুন</p>
                    <p>• আবহাওয়া পরিবর্তনে সতর্ক থাকুন</p>
                  </>
                )}
                {ndviValue >= 0.7 && (
                  <>
                    <p>• 🎉 চমৎকার ফসলের বৃদ্ধি!</p>
                    <p>• ফসল কাটার সময় পরিকল্পনা করুন</p>
                    <p>• পরবর্তী মৌসুমের জন্য জমি প্রস্তুত রাখুন</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Seasonal Comparison ───────────────────────────────────── */}
        {activeTab === "season" && (
          <div className="space-y-4">
            {/* 12-Month NDVI Trend Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[13px] font-bold text-gray-900">📊 ১২-মাসের NDVI প্রবণতা</div>
                  <div className="text-[10px] text-gray-500">{district} · {new Date().getFullYear()}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                  <span className="text-[9px] text-gray-500">NDVI</span>
                </div>
              </div>

              {/* Bar chart using divs */}
              <div className="flex items-end gap-1.5 h-[160px] px-1">
                {monthlyData.map((d, i) => {
                  const isCurrentMonth = i + 1 === currentMonth;
                  const barHeight = (d.ndvi / maxNDVI) * 100;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                      {/* Value label */}
                      <span className={`text-[8px] font-bold ${isCurrentMonth ? "text-green-700" : "text-gray-400"}`}>
                        {d.ndvi.toFixed(1)}
                      </span>
                      {/* Bar */}
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className={`w-full rounded-t-md transition-all ${isCurrentMonth ? "ring-2 ring-green-600 ring-offset-1" : ""}`}
                          style={{
                            height: `${barHeight}%`,
                            background: isCurrentMonth
                              ? `linear-gradient(to top, #16a34a, #22c55e)`
                              : `linear-gradient(to top, ${getNDVIColor(d.ndvi)}88, ${getNDVIColor(d.ndvi)})`,
                            minHeight: "4px",
                          }}
                        />
                      </div>
                      {/* Month label */}
                      <span className={`text-[8px] font-bold ${isCurrentMonth ? "text-green-700" : "text-gray-400"}`}>
                        {d.month}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Season labels */}
              <div className="flex mt-2 gap-0.5">
                <div className="flex-[4] text-center">
                  <div className="text-[8px] font-bold text-green-700 bg-green-50 rounded px-1 py-0.5">বোরো 🌾</div>
                </div>
                <div className="flex-[4] text-center">
                  <div className="text-[8px] font-bold text-amber-700 bg-amber-50 rounded px-1 py-0.5">আউশ 🌾</div>
                </div>
                <div className="flex-[3] text-center">
                  <div className="text-[8px] font-bold text-teal-700 bg-teal-50 rounded px-1 py-0.5">আমন 🌾</div>
                </div>
                <div className="flex-[1] text-center">
                  <div className="text-[8px] font-bold text-gray-500 bg-gray-50 rounded px-1 py-0.5">পতিত</div>
                </div>
              </div>
            </div>

            {/* Monthly Comparison Table */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-gray-900 mb-3">📅 মাসিক তুলনা</div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {monthlyData.map((d, i) => {
                  const isCurrentMonth = i + 1 === currentMonth;
                  const prevMonth = i > 0 ? monthlyData[i - 1].ndvi : d.ndvi;
                  const diff = d.ndvi - prevMonth;
                  const diffLabel = diff > 0.02 ? "↑" : diff < -0.02 ? "↓" : "→";
                  const diffColor = diff > 0.02 ? "#16a34a" : diff < -0.02 ? "#dc2626" : "#f59e0b";

                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                        isCurrentMonth ? "bg-green-50 border-2 border-green-300" : "bg-gray-50 border border-gray-100"
                      }`}
                    >
                      {/* Month */}
                      <div className="w-12 text-center">
                        <div className={`text-[11px] font-bold ${isCurrentMonth ? "text-green-700" : "text-gray-700"}`}>
                          {d.month}
                        </div>
                        {isCurrentMonth && <div className="text-[7px] text-green-600 font-bold">এখন</div>}
                      </div>

                      {/* NDVI bar */}
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-3 relative">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${d.ndvi * 100}%`,
                              background: `linear-gradient(to right, ${getNDVIColor(d.ndvi * 0.7)}, ${getNDVIColor(d.ndvi)})`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Value */}
                      <div className="w-12 text-right">
                        <div className="text-[12px] font-extrabold" style={{ color: getNDVIColor(d.ndvi) }}>
                          {d.ndvi.toFixed(2)}
                        </div>
                      </div>

                      {/* Change */}
                      <div className="w-6 text-center">
                        <span className="text-[12px] font-bold" style={{ color: diffColor }}>
                          {diffLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Seasonal Comparison Cards */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-gray-900 mb-3">🔄 মৌসুম ভিত্তিক তুলনা</div>
              <div className="space-y-3">
                {[
                  {
                    season: "বোরো মৌসুম",
                    months: "জানুয়ারি - এপ্রিল",
                    avgNDVI: (monthlyData.slice(0, 4).reduce((s, d) => s + d.ndvi, 0) / 4).toFixed(2),
                    crops: "ধান (বোরো), গম, সরিষা, আলু",
                    color: "#16a34a",
                    icon: "🌾",
                  },
                  {
                    season: "আউশ মৌসুম",
                    months: "মে - আগস্ট",
                    avgNDVI: (monthlyData.slice(4, 8).reduce((s, d) => s + d.ndvi, 0) / 4).toFixed(2),
                    crops: "ধান (আউশ), পাট, ভুট্টা",
                    color: "#d97706",
                    icon: "☀️",
                  },
                  {
                    season: "আমন মৌসুম",
                    months: "সেপ্টেম্বর - নভেম্বর",
                    avgNDVI: (monthlyData.slice(8, 11).reduce((s, d) => s + d.ndvi, 0) / 3).toFixed(2),
                    crops: "ধান (আমন), ডাল, সবজি",
                    color: "#0d9488",
                    icon: "🌧️",
                  },
                  {
                    season: "পতিত মৌসুম",
                    months: "ডিসেম্বর",
                    avgNDVI: monthlyData[11].ndvi.toFixed(2),
                    crops: "জমি প্রস্তুতি, শীতকালীন সবজি",
                    color: "#6b7280",
                    icon: "❄️",
                  },
                ].map((s, i) => {
                  const avgNDVI = parseFloat(s.avgNDVI);
                  return (
                    <div key={i} className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{s.icon}</span>
                        <div>
                          <div className="text-[12px] font-bold text-gray-900">{s.season}</div>
                          <div className="text-[9px] text-gray-500">{s.months}</div>
                        </div>
                        <div className="ml-auto">
                          <div className="text-[16px] font-extrabold" style={{ color: getNDVIColor(avgNDVI) }}>
                            {s.avgNDVI}
                          </div>
                          <div className="text-[8px] text-gray-400 text-right">গড় NDVI</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-600">
                        🌱 ফসল: {s.crops}
                      </div>
                      <div className="mt-1.5 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${avgNDVI * 100}%`,
                            background: `linear-gradient(to right, ${s.color}88, ${s.color})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rain & Moisture Seasonal Pattern */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-blue-900 mb-2">🌧️ বৃষ্টি ও আর্দ্রতার মৌসুমী প্যাটার্ন</div>
              <div className="space-y-1.5 text-[11px] text-blue-800">
                <p>• <strong>মনসুন (জুন-সেপ্টেম্বর):</strong> বৃষ্টিপাত ৭০-৯০%, উচ্চ আর্দ্রতা, NDVI বৃদ্ধি</p>
                <p>• <strong>মনসুন-পূর্ব (এপ্রিল-মে):</strong> বৃষ্টি ২০-৪০%, আর্দ্রতা বাড়তে থাকে</p>
                <p>• <strong>শীতকাল (নভেম্বর-ফেব্রুয়ারি):</strong> বৃষ্টি ৫-১৫%, নিম্ন আর্দ্রতা, সেচ প্রয়োজন</p>
                <p>• <strong>বর্তমান মাস:</strong> বৃষ্টির সম্ভাবনা {rainProb}%, মাটির আর্দ্রতা {soilMoisture}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
