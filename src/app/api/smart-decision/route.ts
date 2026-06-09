/**
 * /api/smart-decision — KrishiAI Smart Decision API
 *
 * Combines weather forecast + crop calendar + price data + weather scoring
 * to return comprehensive analysis for smart crop decisions.
 *
 * GET params: lat, lon, city
 */

import { NextRequest } from "next/server";
import { corsHeaders, corsNextResponse } from "@/lib/cors";
import { CROP_CALENDAR } from "@/lib/cropCalendar";
import { simulateCurrentPrice, compareCropProfitability } from "@/lib/cropPriceService";
import {
  CROP_TEMP_RANGES,
  CROP_WATER_NEEDS,
  BD_CLIMATE_AVERAGES,
  scoreCropWeatherSuitability,
  forecastDiseasePressure,
  estimateIrrigationNeed,
  findSprayWindows,
  parseForecast,
  fetch7DayForecast,
  compareWithClimate,
} from "@/lib/weatherService";
import type { ParsedForecast } from "@/lib/weatherService";

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

// ── Types ────────────────────────────────────────────────────────────────────
interface CropDetail {
  crop: string;
  cropEn: string;
  icon: string;
  color: string;
  combinedScore: number;
  weatherScore: number;
  priceScore: number;
  seasonScore: number;
  price: ReturnType<typeof simulateCurrentPrice>;
  irrigation: ReturnType<typeof estimateIrrigationNeed>;
  isInSeason: boolean;
}

interface TopRecommendation extends CropDetail {
  reason: string;
}

// ── Scoring Helpers ──────────────────────────────────────────────────────────

function calcPriceScore(priceData: ReturnType<typeof simulateCurrentPrice>): number {
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

  const monthNames = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
  ];
  const currentMonthBn = monthNames[currentMonth - 1];
  if (activeSeason.plantMonth.includes(currentMonthBn)) return 90;
  if (activeSeason.months.indexOf(currentMonth) <= 1) return 80;
  if (activeSeason.months.indexOf(currentMonth) >= activeSeason.months.length - 2) return 30;
  return 60;
}

function getRecommendationReason(c: CropDetail): string {
  if (c.seasonScore >= 80) return "এখন বপনের সঠিক সময়";
  if (c.weatherScore >= 65) return "আবহাওয়া অনুকূল";
  if (c.priceScore >= 65) return "বাজার মূল্য বাড়ছে";
  if (c.seasonScore >= 50) return "মৌসুমে আছে";
  return "মিশ্র সংকেত";
}

// ── Cache ────────────────────────────────────────────────────────────────────
const decisionCache = new Map<string, { data: Record<string, unknown>; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// ── GET Handler ──────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "23.685");
  const lon = parseFloat(searchParams.get("lon") || "90.356");
  const city = searchParams.get("city") || "ঢাকা";

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return corsNextResponse(
      { ok: false, error: "অবৈধ অক্ষাংশ/দ্রাঘিমাংশ", city },
      { status: 400, origin }
    );
  }

  const now = Date.now();
  const cacheKey = `${lat},${lon}`;
  const cached = decisionCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return corsNextResponse(
      { ...cached.data, city, lat, lon },
      {
        origin,
        headers: { "Cache-Control": "public, s-maxage=300" },
      }
    );
  }

  const currentMonth = new Date().getMonth() + 1;

  try {
    // Fetch weather
    let forecast: ParsedForecast | null = null;
    try {
      const raw = await fetch7DayForecast(lat, lon);
      forecast = parseForecast(raw as Record<string, unknown>);
    } catch {
      // Use fallback climate data
    }

    // Calculate crop details
    const cropDetails: CropDetail[] = CROP_CALENDAR.map((crop) => {
      const weatherSuit = scoreCropWeatherSuitability(crop.crop, forecast);
      const priceData = simulateCurrentPrice(crop.crop, currentMonth);
      const priceScore = calcPriceScore(priceData);
      const seasonScore = calcSeasonScore(crop.crop, currentMonth);
      const combinedScore = Math.round(
        weatherSuit.score * 0.4 + priceScore * 0.35 + seasonScore * 0.25
      );
      const irrigation = estimateIrrigationNeed(crop.crop, forecast);

      return {
        crop: crop.crop,
        cropEn: crop.cropEn,
        icon: crop.icon,
        color: crop.color,
        combinedScore,
        weatherScore: weatherSuit.score,
        priceScore,
        seasonScore,
        price: priceData,
        irrigation,
        isInSeason: seasonScore >= 50,
      };
    });

    // Sort by combined score
    cropDetails.sort((a, b) => b.combinedScore - a.combinedScore);

    // Top recommendations
    const topRecommendations: TopRecommendation[] = cropDetails
      .slice(0, 3)
      .map((c) => ({ ...c, reason: getRecommendationReason(c) }));

    // Disease pressure
    const diseasePressure = forecastDiseasePressure(forecast);

    // Spray windows
    const sprayWindows = findSprayWindows(forecast);

    // Climate comparison
    const climateComparison =
      forecast?.current && currentMonth
        ? compareWithClimate(forecast.current, currentMonth)
        : null;

    // Profitability comparison
    const profitability = compareCropProfitability(currentMonth);

    const result = {
      ok: true,
      topRecommendations,
      cropDetails,
      diseasePressure,
      sprayWindows,
      climateComparison,
      profitability: profitability.slice(0, 10),
      weather: forecast
        ? {
            temp: forecast.current?.temp,
            humidity: forecast.current?.humidity,
            weekAvgTemp: forecast.weekAvgTemp,
            weekRainTotal: Math.round(forecast.weekRainTotal),
          }
        : null,
      city,
      lat,
      lon,
      generatedAt: new Date().toISOString(),
    };

    // Cache
    decisionCache.set(cacheKey, { data: result, timestamp: now });

    return corsNextResponse(result, {
      origin,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return corsNextResponse(
      {
        ok: false,
        error: "বিশ্লেষণ ব্যর্থ — পরে আবার চেষ্টা করুন",
        city,
        lat,
        lon,
      },
      { status: 500, origin }
    );
  }
}