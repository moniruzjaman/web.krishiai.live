"use client";

/**
 * Smart Decision Page — স্মার্ট সিদ্ধান্ত
 *
 * Combines weather + price + calendar data for:
 * - Top 3 crop recommendations for planting now
 * - Weather suitability scores per crop
 * - Price trend analysis
 * - Irrigation needs assessment
 * - Disease pressure forecast
 * - Spray window recommendations
 * - Side-by-side crop comparison tool
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { CROP_CALENDAR } from "@/lib/cropCalendar";
import {
  simulateCurrentPrice,
  getAllCropPrices,
  compareCropProfitability,
  formatPriceBDT,
  getTrendDisplay,
} from "@/lib/cropPriceService";
import {
  CROP_TEMP_RANGES,
  CROP_WATER_NEEDS,
  BD_CLIMATE_AVERAGES,
} from "@/lib/weatherService";
import { useLocation } from "@/context/LocationContext";
import type { SimulatedPrice, ProfitabilityResult } from "@/lib/cropPriceService";

// ── Bengali digit helper ──────────────────────────────────────────────────────
const bn = (n: number | string) =>
  String(Math.round(Number(n))).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

// ── Types ─────────────────────────────────────────────────────────────────────
interface SmartDecisionData {
  topRecommendations: Array<{
    crop: string;
    cropEn: string;
    icon: string;
    combinedScore: number;
    weatherScore: number;
    priceScore: number;
    seasonScore: number;
    reason: string;
  }>;
  cropDetails: Array<{
    crop: string;
    cropEn: string;
    icon: string;
    color: string;
    combinedScore: number;
    weatherScore: number;
    priceScore: number;
    seasonScore: number;
    price: SimulatedPrice | null;
    profitability: number;
  }>;
  diseasePressure: Array<{
    disease: string;
    pressure: "low" | "medium" | "high";
    reason: string;
  }>;
  sprayWindows: Array<{
    date: string;
    quality: "excellent" | "good" | "fair";
    window: string;
  }>;
  climateComparison: {
    tempDeviation: number;
    humidityDeviation: number;
    rainStatus: string;
  } | null;
}

// ── Scoring Helpers ───────────────────────────────────────────────────────────

function calcWeatherScore(cropBn: string, currentTemp: number, currentHumidity: number, weeklyRain: number): number {
  const range = CROP_TEMP_RANGES[cropBn];
  const waterNeed = CROP_WATER_NEEDS[cropBn] ?? 30;
  if (!range) return 50;

  let tempScore = 0;
  if (currentTemp >= range.min && currentTemp <= range.max) {
    const distFromOptimal = Math.abs(currentTemp - range.optimal);
    tempScore = Math.max(20, 40 - distFromOptimal * 3);
  } else if (currentTemp < range.min) {
    tempScore = Math.max(0, 20 - (range.min - currentTemp) * 4);
  } else {
    tempScore = Math.max(0, 20 - (currentTemp - range.max) * 4);
  }

  let rainScore = 0;
  if (weeklyRain >= waterNeed * 0.8 && weeklyRain <= waterNeed * 2) {
    rainScore = 30;
  } else if (weeklyRain >= waterNeed * 0.5) {
    rainScore = 20;
  } else if (weeklyRain > waterNeed * 2) {
    rainScore = 15;
  } else {
    rainScore = Math.max(5, 15 - (waterNeed * 0.5 - weeklyRain) * 0.5);
  }

  let humidScore = 0;
  if (cropBn === "ধান" || cropBn === "পাট") {
    humidScore = currentHumidity > 70 ? 25 : currentHumidity > 50 ? 30 : 15;
  } else if (cropBn === "আলু" || cropBn === "গম" || cropBn === "সরিষা") {
    humidScore = currentHumidity < 60 ? 30 : currentHumidity < 75 ? 20 : 8;
  } else {
    humidScore = currentHumidity >= 50 && currentHumidity <= 75 ? 30 : currentHumidity < 50 ? 15 : 12;
  }

  return Math.round(tempScore + rainScore + humidScore);
}

function calcPriceScore(priceData: SimulatedPrice | null): number {
  if (!priceData) return 30;
  let score = 50;
  if (priceData.trend === "up") score += 20;
  else if (priceData.trend === "stable") score += 5;
  else score -= 10;
  if (priceData.volatility === "very_high") score -= 10;
  else if (priceData.volatility === "high") score -= 5;
  return Math.max(10, Math.min(100, score));
}

function calcSeasonScore(cropBn: string, currentMonth: number): number {
  const crop = CROP_CALENDAR.find((c) => c.crop === cropBn);
  if (!crop) return 30;
  const activeSeason = crop.seasons.find((s) => s.months.includes(currentMonth));
  if (!activeSeason) return 10;

  // Check if it's planting month
  const monthNames = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
  const currentMonthBn = monthNames[currentMonth - 1];
  if (activeSeason.plantMonth.includes(currentMonthBn)) return 90;
  if (activeSeason.months.indexOf(currentMonth) <= 1) return 80;
  if (activeSeason.months.indexOf(currentMonth) >= activeSeason.months.length - 2) return 30;
  return 60;
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 75) return { label: "চমৎকার", color: "#16a34a" };
  if (score >= 55) return { label: "ভালো", color: "#2563eb" };
  if (score >= 40) return { label: "মিশ্র", color: "#d97706" };
  return { label: "খারাপ", color: "#dc2626" };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SmartDecisionPage() {
  const [activeTab, setActiveTab] = useState<"recommend" | "weather" | "price" | "irrigation" | "compare">("recommend");
  const [compareA, setCompareA] = useState("ধান");
  const [compareB, setCompareB] = useState("আলু");
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<Record<string, unknown> | null>(null);
  const { location } = useLocation();

  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);

  // Fetch weather data using user's actual location
  useEffect(() => {
    async function fetchWeather() {
      try {
        const lat = location?.lat ?? 23.81;
        const lon = location?.lon ?? 90.41;
        const city = location?.city ?? "ঢাকা";
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`);
        if (res.ok) {
          const data = await res.json();
          setWeatherData(data);
        }
      } catch {
        // Use fallback
      }
      setLoading(false);
    }
    fetchWeather();
  }, [location]);

  // Calculate all smart decision data
  const decisionData: SmartDecisionData = useMemo(() => {
    const currentTemp = (weatherData?.temp as number) ?? 28;
    const currentHumidity = (weatherData?.humid as number) ?? 70;
    const weeklyRain = (weatherData?.forecast as Array<{ precipSum: number }>)?.reduce((s: number, d: { precipSum: number }) => s + (d.precipSum ?? 0), 0) ?? 40;

    const cropDetails = CROP_CALENDAR.map((crop) => {
      const weatherScore = calcWeatherScore(crop.crop, currentTemp, currentHumidity, weeklyRain);
      const priceData = simulateCurrentPrice(crop.crop, currentMonth);
      const priceScore = calcPriceScore(priceData);
      const seasonScore = calcSeasonScore(crop.crop, currentMonth);
      const combinedScore = Math.round(weatherScore * 0.4 + priceScore * 0.35 + seasonScore * 0.25);

      return {
        crop: crop.crop,
        cropEn: crop.cropEn,
        icon: crop.icon,
        color: crop.color,
        combinedScore,
        weatherScore,
        priceScore,
        seasonScore,
        price: priceData,
        profitability: 0,
      };
    });

    // Sort by combined score
    cropDetails.sort((a, b) => b.combinedScore - a.combinedScore);

    // Top recommendations with reasons
    const topRecommendations = cropDetails.slice(0, 3).map((c) => {
      let reason = "";
      if (c.seasonScore >= 80) reason = "এখন বপনের সঠিক সময়";
      else if (c.weatherScore >= 65) reason = "আবহাওয়া অনুকূল";
      else if (c.priceScore >= 65) reason = "বাজার মূল্য বাড়ছে";
      else if (c.seasonScore >= 50) reason = "মৌসুমে আছে";
      else reason = "মিশ্র সংকেত";

      return { ...c, reason };
    });

    // Disease pressure
    const diseasePressure: SmartDecisionData["diseasePressure"] = [];
    if (currentHumidity > 80 && currentTemp >= 25) {
      diseasePressure.push({
        disease: "ছত্রাকজনিত রোগ (Blast, Blight)",
        pressure: "high",
        reason: `${Math.round(currentHumidity)}% আর্দ্রতা + ${Math.round(currentTemp)}°C — ছত্রাকের উপযুক্ত`,
      });
    } else if (currentHumidity > 70) {
      diseasePressure.push({
        disease: "ছত্রাকজনিত রোগ",
        pressure: "medium",
        reason: `${Math.round(currentHumidity)}% আর্দ্রতা — মাঝারি ঝুঁকি`,
      });
    }
    if (currentTemp > 32) {
      diseasePressure.push({
        disease: "পোকামাকড় (ফল ছিদ্রকারী, মাহুয়া)",
        pressure: "high",
        reason: `${Math.round(currentTemp)}°C — পোকার উপযুক্ত তাপমাত্রা`,
      });
    }
    if (weeklyRain > 100) {
      diseasePressure.push({
        disease: "পুষ্টি ঘাটতি (Leaching)",
        pressure: weeklyRain > 200 ? "high" : "medium",
        reason: `${Math.round(weeklyRain)}mm বৃষ্টি — সার ধুয়ে যাওয়ার ঝুঁকি`,
      });
    }
    if (diseasePressure.length === 0) {
      diseasePressure.push({
        disease: "সাধারণ",
        pressure: "low",
        reason: "আবহাওয়া অনুকূল — রোগের চাপ কম",
      });
    }

    // Spray windows (mock from weather data)
    const sprayWindows: SmartDecisionData["sprayWindows"] = [];
    const forecast = (weatherData?.forecast as Array<{ day: string; precipProb: number; windMax?: number; max: number }>) ?? [];
    for (const day of forecast.slice(0, 5)) {
      if (day.precipProb < 40) {
        sprayWindows.push({
          date: day.day,
          quality: day.precipProb < 20 ? "excellent" : day.precipProb < 30 ? "good" : "fair",
          window: day.precipProb < 20 ? "সকাল ৬-৯টা বা বিকাল ৪-৬টা" : "সকালে স্প্রে করুন",
        });
      }
    }
    if (sprayWindows.length === 0) {
      sprayWindows.push({ date: "—", quality: "fair", window: "বৃষ্টির কারণে স্প্রে স্থগিত" });
    }

    // Climate comparison
    const climateAvg = BD_CLIMATE_AVERAGES[currentMonth];
    let climateComparison: SmartDecisionData["climateComparison"] = null;
    if (climateAvg) {
      climateComparison = {
        tempDeviation: Math.round(currentTemp - climateAvg.temp),
        humidityDeviation: Math.round(currentHumidity - climateAvg.humidity),
        rainStatus: weeklyRain > climateAvg.rain ? "বেশি" : weeklyRain < climateAvg.rain * 0.3 ? "কম" : "স্বাভাবিক",
      };
    }

    return { topRecommendations, cropDetails, diseasePressure, sprayWindows, climateComparison };
  }, [weatherData, currentMonth]);

  // Profitability data
  const profitabilityData: ProfitabilityResult[] = useMemo(
    () => compareCropProfitability(currentMonth),
    [currentMonth]
  );

  // Irrigation data
  const irrigationData = useMemo(() => {
    const currentTemp = (weatherData?.temp as number) ?? 28;
    const weeklyRain = (weatherData?.forecast as Array<{ precipSum: number }>)?.reduce((s: number, d: { precipSum: number }) => s + (d.precipSum ?? 0), 0) ?? 40;

    return CROP_CALENDAR.map((crop) => {
      const waterNeed = CROP_WATER_NEEDS[crop.crop] ?? 30;
      const deficit = Math.max(0, waterNeed - weeklyRain);
      let need: string;
      if (deficit <= 0) need = "none";
      else if (deficit <= waterNeed * 0.3) need = "low";
      else if (deficit <= waterNeed * 0.6) need = "moderate";
      else need = "critical";

      return {
        crop: crop.crop,
        icon: crop.icon,
        waterNeed,
        weeklyRain: Math.round(weeklyRain),
        deficit: Math.round(deficit),
        need,
      };
    });
  }, [weatherData]);

  // Comparison data
  const getComparison = useCallback(
    (cropBn: string) => {
      const crop = CROP_CALENDAR.find((c) => c.crop === cropBn);
      const price = simulateCurrentPrice(cropBn, currentMonth);
      const tempRange = CROP_TEMP_RANGES[cropBn];
      const waterNeed = CROP_WATER_NEEDS[cropBn];
      const profit = profitabilityData.find((p) => p.crop === cropBn);
      const detail = decisionData.cropDetails.find((d) => d.crop === cropBn);

      return {
        crop,
        price,
        tempRange,
        waterNeed,
        profit,
        detail,
      };
    },
    [currentMonth, profitabilityData, decisionData]
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">🧠</div>
          <div className="text-[13px] text-gray-500 dark:text-gray-400">তথ্য বিশ্লেষণ হচ্ছে...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* ═══ HEADER ══════════════════════════════════════════════════════════ */}
      <div
        className="relative px-4 pt-5 pb-7"
        style={{ background: "linear-gradient(135deg,#1b4332,#2d6a4f)" }}
      >
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white dark:bg-gray-900 rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">
          SMART DECISION
        </div>
        <h1 className="text-[22px] font-bold text-white mb-1">
          🧠 স্মার্ট সিদ্ধান্ত
        </h1>
        <p className="text-xs text-white/70">
          আবহাওয়া, বাজার মূল্য ও মৌসুম তথ্য মিলিয়ে সেরা ফসল নির্বাচন
        </p>
      </div>

      <div className="px-4 pt-4 pb-24">
        {/* ═══ TABS ══════════════════════════════════════════════════════════ */}
        <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 overflow-x-auto">
          {[
            { key: "recommend", label: "🎯 সুপারিশ" },
            { key: "weather", label: "🌤️ আবহাওয়া" },
            { key: "price", label: "💰 মূল্য" },
            { key: "irrigation", label: "💧 সেচ" },
            { key: "compare", label: "⚖️ তুলনা" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 text-[10px] font-bold py-2 px-1.5 rounded-lg transition-all cursor-pointer border-none whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-white text-green-800 dark:bg-gray-600 dark:text-green-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ RECOMMEND TAB ════════════════════════════════════════════════ */}
        {activeTab === "recommend" && (
          <div className="space-y-4">
            {/* Top 3 Recommendations */}
            <div>
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                🎯 এই মুহূর্তে সেরা ফসল (শীর্ষ ৩)
              </div>

              {decisionData.topRecommendations.map((rec, i) => (
                <div
                  key={rec.crop}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-3"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: i === 0 ? "#fef3c7" : i === 1 ? "#e0f2fe" : "#f3e8ff" }}
                    >
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px]">{rec.icon}</span>
                        <span className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                          {rec.crop}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          {rec.cropEn}
                        </span>
                      </div>
                      <div className="text-[11px] text-green-600 dark:text-green-400 font-medium">
                        {rec.reason}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[20px] font-extrabold" style={{ color: getScoreLabel(rec.combinedScore).color }}>
                        {bn(rec.combinedScore)}
                      </div>
                      <div className="text-[9px] text-gray-500 dark:text-gray-400">
                        সম্মিলিত স্কোর
                      </div>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "আবহাওয়া", score: rec.weatherScore, weight: "৪০%" },
                      { label: "মূল্য", score: rec.priceScore, weight: "৩৫%" },
                      { label: "মৌসুম", score: rec.seasonScore, weight: "২৫%" },
                    ].map((s) => (
                      <div key={s.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2 text-center">
                        <div className="text-[16px] font-bold" style={{ color: getScoreLabel(s.score).color }}>
                          {bn(s.score)}
                        </div>
                        <div className="text-[9px] font-medium text-gray-600 dark:text-gray-400">
                          {s.label}
                        </div>
                        <div className="text-[8px] text-gray-400 dark:text-gray-500">
                          ওজন: {s.weight}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* All crops ranking */}
            <div>
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                📊 সকল ফসলের সম্মিলিত স্কোর
              </div>
              <div className="space-y-1.5">
                {decisionData.cropDetails.map((c, i) => (
                  <div
                    key={c.crop}
                    className="flex items-center gap-2.5 bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700"
                  >
                    <span className="text-[10px] font-bold text-gray-400 w-4">{bn(i + 1)}</span>
                    <span className="text-base">{c.icon}</span>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">
                        {c.crop}
                      </div>
                    </div>
                    <div className="w-24">
                      <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${c.combinedScore}%`,
                            backgroundColor: getScoreLabel(c.combinedScore).color,
                          }}
                        />
                      </div>
                    </div>
                    <span
                      className="text-[12px] font-bold w-8 text-right"
                      style={{ color: getScoreLabel(c.combinedScore).color }}
                    >
                      {bn(c.combinedScore)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disease pressure */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                🦠 রোগের চাপ পূর্বাভাস
              </div>
              <div className="space-y-2">
                {decisionData.diseasePressure.map((dp, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 ${
                      dp.pressure === "high"
                        ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                        : dp.pressure === "medium"
                        ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                        : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          dp.pressure === "high"
                            ? "bg-red-200 text-red-800"
                            : dp.pressure === "medium"
                            ? "bg-amber-200 text-amber-800"
                            : "bg-green-200 text-green-800"
                        }`}
                      >
                        {dp.pressure === "high" ? "উচ্চ" : dp.pressure === "medium" ? "মাঝারি" : "কম"}
                      </span>
                      <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100">
                        {dp.disease}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">{dp.reason}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spray windows */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                🌿 স্প্রে উইন্ডো
              </div>
              <div className="space-y-1.5">
                {decisionData.sprayWindows.map((sw, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        sw.quality === "excellent"
                          ? "bg-green-200 text-green-800"
                          : sw.quality === "good"
                          ? "bg-blue-200 text-blue-800"
                          : "bg-amber-200 text-amber-800"
                      }`}
                    >
                      {sw.quality === "excellent" ? "চমৎকার" : sw.quality === "good" ? "ভালো" : "মোটামুটি"}
                    </span>
                    <span className="text-[10px] font-medium text-gray-800 dark:text-gray-200">{sw.date}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-1">{sw.window}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ WEATHER TAB ══════════════════════════════════════════════════ */}
        {activeTab === "weather" && (
          <div className="space-y-4">
            {/* Current weather summary */}
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-2">
                🌤️ বর্তমান আবহাওয়া
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[20px] font-extrabold text-sky-700 dark:text-sky-400">
                    {bn(weatherData?.temp as number ?? 28)}°C
                  </div>
                  <div className="text-[9px] text-gray-500 dark:text-gray-400">তাপমাত্রা</div>
                </div>
                <div>
                  <div className="text-[20px] font-extrabold text-sky-700 dark:text-sky-400">
                    {bn(weatherData?.humid as number ?? 70)}%
                  </div>
                  <div className="text-[9px] text-gray-500 dark:text-gray-400">আর্দ্রতা</div>
                </div>
                <div>
                  <div className="text-[20px] font-extrabold text-sky-700 dark:text-sky-400">
                    {bn(weatherData?.rain as number ?? 0)}mm
                  </div>
                  <div className="text-[9px] text-gray-500 dark:text-gray-400">বৃষ্টি</div>
                </div>
              </div>

              {/* Climate comparison */}
              {decisionData.climateComparison && (
                <div className="mt-3 pt-3 border-t border-sky-200 dark:border-sky-800">
                  <div className="text-[10px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    দীর্ঘমেয়াদী গড়ের সাথে তুলনা
                  </div>
                  <div className="flex gap-4 text-[10px]">
                    <span className={decisionData.climateComparison.tempDeviation > 0 ? "text-red-600" : "text-blue-600"}>
                      তাপমাত্রা: {decisionData.climateComparison.tempDeviation > 0 ? "+" : ""}{bn(decisionData.climateComparison.tempDeviation)}°C
                    </span>
                    <span className={decisionData.climateComparison.humidityDeviation > 0 ? "text-blue-600" : "text-amber-600"}>
                      আর্দ্রতা: {decisionData.climateComparison.humidityDeviation > 0 ? "+" : ""}{bn(decisionData.climateComparison.humidityDeviation)}%
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      বৃষ্টি: {decisionData.climateComparison.rainStatus}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Per-crop weather suitability */}
            <div>
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                🌡️ ফসলভিত্তিক আবহাওয়া উপযুক্ততা
              </div>
              <div className="space-y-2">
                {decisionData.cropDetails.map((c) => {
                  const tempRange = CROP_TEMP_RANGES[c.crop];
                  return (
                    <div
                      key={c.crop}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{c.icon}</span>
                        <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100">{c.crop}</span>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500">{c.cropEn}</span>
                        <span
                          className="ml-auto text-[12px] font-bold"
                          style={{ color: getScoreLabel(c.weatherScore).color }}
                        >
                          {bn(c.weatherScore)} — {getScoreLabel(c.weatherScore).label}
                        </span>
                      </div>
                      {tempRange && (
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 flex gap-3">
                          <span>সর্বনিম্ন: {bn(tempRange.min)}°C</span>
                          <span>সর্বোচ্চ: {bn(tempRange.max)}°C</span>
                          <span>আদর্শ: {bn(tempRange.optimal)}°C</span>
                        </div>
                      )}
                      <div className="mt-1.5">
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${c.weatherScore}%`,
                              backgroundColor: getScoreLabel(c.weatherScore).color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ PRICE TAB ════════════════════════════════════════════════════ */}
        {activeTab === "price" && (
          <div className="space-y-4">
            {/* Price trend overview */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                💰 বাজার মূল্য প্রবণতা
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  {
                    label: "বাড়ছে",
                    count: decisionData.cropDetails.filter((c) => c.price?.trend === "up").length,
                    color: "#16a34a",
                    icon: "📈",
                  },
                  {
                    label: "স্থিতিশীল",
                    count: decisionData.cropDetails.filter((c) => c.price?.trend === "stable").length,
                    color: "#d97706",
                    icon: "➡️",
                  },
                  {
                    label: "কমছে",
                    count: decisionData.cropDetails.filter((c) => c.price?.trend === "down").length,
                    color: "#dc2626",
                    icon: "📉",
                  },
                ].map((t) => (
                  <div key={t.label} className="bg-white dark:bg-gray-800 rounded-xl p-2.5">
                    <div className="text-lg">{t.icon}</div>
                    <div className="text-[18px] font-extrabold" style={{ color: t.color }}>
                      {bn(t.count)}
                    </div>
                    <div className="text-[9px] text-gray-500 dark:text-gray-400">{t.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price list */}
            <div>
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                📊 ফসলভিত্তিক মূল্য ও প্রবণতা
              </div>
              <div className="space-y-1.5">
                {decisionData.cropDetails
                  .filter((c) => c.price)
                  .sort((a, b) => (b.price?.priceChangePercent ?? 0) - (a.price?.priceChangePercent ?? 0))
                  .map((c) => {
                    const trend = getTrendDisplay(c.price?.trend ?? "stable");
                    return (
                      <div
                        key={c.crop}
                        className="flex items-center gap-2.5 bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700"
                      >
                        <span className="text-base">{c.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                            {c.crop}
                          </div>
                          <div className="text-[9px] text-gray-500 dark:text-gray-400">
                            {c.price?.priceRange && (
                              <>৳{bn(c.price.priceRange.low)} — ৳{bn(c.price.priceRange.high)}</>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[14px] font-bold text-gray-900 dark:text-gray-100">
                            {formatPriceBDT(c.price?.price ?? 0)}
                          </div>
                          <div
                            className="text-[10px] font-bold flex items-center gap-1 justify-end"
                            style={{ color: trend.color }}
                          >
                            {trend.icon} {c.price?.priceChangePercent ?? 0 > 0 ? "+" : ""}
                            {bn(c.price?.priceChangePercent ?? 0)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Profitability ranking */}
            <div>
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                📈 লাভজনকতা তুলনা (প্রতি বিঘায়)
              </div>
              <div className="space-y-1.5">
                {profitabilityData.slice(0, 10).map((p, i) => (
                  <div
                    key={p.crop}
                    className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700"
                  >
                    <span className="text-[10px] font-bold text-gray-400 w-4">{bn(i + 1)}</span>
                    <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100 flex-1">
                      {p.crop}
                    </span>
                    <div className="text-right">
                      <div className={`text-[12px] font-bold ${p.netProfit > 0 ? "text-green-600" : "text-red-600"}`}>
                        ৳{bn(Math.abs(p.netProfit))}
                      </div>
                      <div className="text-[9px] text-gray-500 dark:text-gray-400">
                        ROI: {bn(p.roi)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ IRRIGATION TAB ═══════════════════════════════════════════════ */}
        {activeTab === "irrigation" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-2">
                💧 সেচ প্রয়োজনীয়তা মূল্যায়ন
              </div>
              <div className="text-[11px] text-gray-600 dark:text-gray-400">
                আবহাওয়া পূর্বাভাশ ও ফসলের পানি চাহিদার ভিত্তিতে
              </div>
            </div>

            <div className="space-y-2">
              {irrigationData.map((irr) => {
                const needColors: Record<string, { bg: string; text: string; label: string }> = {
                  none: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", label: "প্রয়োজন নেই" },
                  low: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", label: "সামান্য" },
                  moderate: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", label: "মাঝারি" },
                  critical: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", label: "জরুরি" },
                };
                const nc = needColors[irr.need] ?? needColors.moderate;

                return (
                  <div
                    key={irr.crop}
                    className={`${nc.bg} rounded-xl border border-gray-200 dark:border-gray-700 p-3`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{CROP_CALENDAR.find((c) => c.crop === irr.crop)?.icon ?? "🌾"}</span>
                      <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100">{irr.crop}</span>
                      <span className={`ml-auto text-[10px] font-bold ${nc.text} px-2 py-0.5 rounded-full bg-white/50 dark:bg-gray-800/50`}>
                        {nc.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[9px]">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">সাপ্তাহিক চাহিদা:</span>
                        <div className="font-bold text-gray-800 dark:text-gray-200">{bn(irr.waterNeed)} mm</div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">বৃষ্টির পানি:</span>
                        <div className="font-bold text-gray-800 dark:text-gray-200">{bn(irr.weeklyRain)} mm</div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">ঘাটতি:</span>
                        <div className={`font-bold ${irr.deficit > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                          {bn(irr.deficit)} mm
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ COMPARE TAB ══════════════════════════════════════════════════ */}
        {activeTab === "compare" && (
          <div className="space-y-4">
            <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
              ⚖️ ফসল তুলনা
            </div>

            {/* Dropdown selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">ফসল ক</div>
                <select
                  value={compareA}
                  onChange={(e) => setCompareA(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-[12px] font-bold text-gray-900 dark:text-gray-100 outline-none focus:border-green-400"
                >
                  {CROP_CALENDAR.map((c) => (
                    <option key={c.crop} value={c.crop}>
                      {c.icon} {c.crop} ({c.cropEn})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">ফসল খ</div>
                <select
                  value={compareB}
                  onChange={(e) => setCompareB(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-[12px] font-bold text-gray-900 dark:text-gray-100 outline-none focus:border-green-400"
                >
                  {CROP_CALENDAR.map((c) => (
                    <option key={c.crop} value={c.crop}>
                      {c.icon} {c.crop} ({c.cropEn})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison cards */}
            {(() => {
              const a = getComparison(compareA);
              const b = getComparison(compareB);
              if (!a.crop || !b.crop) return null;

              const metrics = [
                {
                  label: "সম্মিলিত স্কোর",
                  aVal: a.detail?.combinedScore ?? 0,
                  bVal: b.detail?.combinedScore ?? 0,
                  format: (v: number) => bn(v),
                  higher: true,
                },
                {
                  label: "আবহাওয়া স্কোর",
                  aVal: a.detail?.weatherScore ?? 0,
                  bVal: b.detail?.weatherScore ?? 0,
                  format: (v: number) => bn(v),
                  higher: true,
                },
                {
                  label: "মূল্য স্কোর",
                  aVal: a.detail?.priceScore ?? 0,
                  bVal: b.detail?.priceScore ?? 0,
                  format: (v: number) => bn(v),
                  higher: true,
                },
                {
                  label: "বর্তমান মূল্য",
                  aVal: a.price?.price ?? 0,
                  bVal: b.price?.price ?? 0,
                  format: (v: number) => `৳${bn(v)}`,
                  higher: true,
                },
                {
                  label: "মূল্য প্রবণতা",
                  aVal: a.price?.priceChangePercent ?? 0,
                  bVal: b.price?.priceChangePercent ?? 0,
                  format: (v: number) => `${v > 0 ? "+" : ""}${bn(v)}%`,
                  higher: true,
                },
                {
                  label: "লাভ (প্রতি বিঘা)",
                  aVal: a.profit?.netProfit ?? 0,
                  bVal: b.profit?.netProfit ?? 0,
                  format: (v: number) => `৳${bn(Math.abs(v))}`,
                  higher: true,
                },
                {
                  label: "ROI",
                  aVal: a.profit?.roi ?? 0,
                  bVal: b.profit?.roi ?? 0,
                  format: (v: number) => `${bn(v)}%`,
                  higher: true,
                },
                {
                  label: "পানি চাহিদা (mm/সপ্তাহ)",
                  aVal: a.waterNeed ?? 0,
                  bVal: b.waterNeed ?? 0,
                  format: (v: number) => bn(v),
                  higher: false,
                },
                {
                  label: "আদর্শ তাপমাত্রা",
                  aVal: a.tempRange?.optimal ?? 0,
                  bVal: b.tempRange?.optimal ?? 0,
                  format: (v: number) => `${bn(v)}°C`,
                  higher: false,
                },
              ];

              return (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Header row */}
                  <div className="grid grid-cols-3 bg-gray-50 dark:bg-gray-700/50 p-3">
                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400">মানদণ্ড</div>
                    <div className="text-center text-[12px] font-bold text-gray-900 dark:text-gray-100">
                      {a.crop.icon} {a.crop.crop}
                    </div>
                    <div className="text-center text-[12px] font-bold text-gray-900 dark:text-gray-100">
                      {b.crop.icon} {b.crop.crop}
                    </div>
                  </div>

                  {/* Metric rows */}
                  {metrics.map((m, i) => {
                    const aWin = m.higher ? m.aVal > m.bVal : m.aVal < m.bVal;
                    const bWin = m.higher ? m.bVal > m.aVal : m.bVal < m.aVal;

                    return (
                      <div
                        key={i}
                        className="grid grid-cols-3 p-3 border-t border-gray-100 dark:border-gray-700"
                      >
                        <div className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                          {m.label}
                        </div>
                        <div
                          className={`text-center text-[12px] font-bold ${
                            aWin ? "text-green-600 dark:text-green-400" : "text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {m.format(m.aVal)}
                        </div>
                        <div
                          className={`text-center text-[12px] font-bold ${
                            bWin ? "text-green-600 dark:text-green-400" : "text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {m.format(m.bVal)}
                        </div>
                      </div>
                    );
                  })}

                  {/* Winner */}
                  <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-green-50 dark:bg-green-900/10">
                    <div className="text-center text-[12px] font-bold text-green-700 dark:text-green-400">
                      🏆 সামগ্রিক বিজয়ী:{" "}
                      {(a.detail?.combinedScore ?? 0) >= (b.detail?.combinedScore ?? 0)
                        ? `${a.crop.icon} ${a.crop.crop}`
                        : `${b.crop.icon} ${b.crop.crop}`}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
