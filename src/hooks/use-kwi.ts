/**
 * use-kwi.ts — Krishi Weather Intelligence (KWI) hooks for KrishiAI
 *
 * Dependency-free re-implementation of the KWI data layer:
 * - No react-query / no zustand: plain React state + memoized engine calls.
 * - Location comes from the shared LocationContext (GPS + Dhaka fallback).
 * - Language comes from the shared LanguageContext (Bangla first).
 * - Active crop selection is persisted in localStorage.
 *
 * Engines run fully client-side (pure functions) on Open-Meteo data.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "@/context/LocationContext";
import { createWeatherAdapter } from "@/lib/kwi/weather-adapter";
import type {
  WeatherData,
  GeoLocation,
  ActiveCrop,
  RiskDashboard,
  Recommendation,
  WeeklyPlan,
  DiseaseForecast,
  FarmSummary,
  CropCalendarEntry,
  GrowthStageId,
} from "@/lib/kwi/types";
import { computeRiskDashboard } from "@/lib/kwi/engines/risk-engine";
import {
  generateRecommendations,
  generateDailyPlan,
  generateWeeklyPlan,
} from "@/lib/kwi/engines/recommendation-engine";
import { generateDiseaseForecast } from "@/lib/kwi/engines/disease-engine";
import { generateCropCalendar } from "@/lib/kwi/engines/calendar-engine";
import { getCropConfig } from "@/lib/kwi/engines/crop-configs";

// ── Constants ────────────────────────────────────────────────────────────────
const CROP_STORAGE_KEY = "krishi_kwi_crop";
const SOWING_STORAGE_KEY = "krishi_kwi_sowing";
const WEATHER_CACHE_KEY = "krishi_kwi_weather_cache";
const REFRESH_MS = 15 * 60 * 1000; // 15 minutes

const DHAKA_FALLBACK: GeoLocation = {
  latitude: 23.8103,
  longitude: 90.4125,
  name: "ঢাকা",
  district: "ঢাকা",
  country: "বাংলাদেশ",
};

function defaultSowingDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30); // sowed 30 days ago
  return d.toISOString().split("T")[0];
}

// ── Location hook (bridges LocationContext → KWI GeoLocation) ───────────────
export function useKwiGeoLocation(): GeoLocation {
  const { location } = useLocation();
  return useMemo(() => {
    if (!location) return DHAKA_FALLBACK;
    return {
      latitude: location.lat,
      longitude: location.lon,
      name: location.city || location.district || "ঢাকা",
      district: location.district || "",
      country: "বাংলাদেশ",
    };
  }, [location]);
}

// ── Live clock hook (ticks for realtime datetime display) ───────────────────
/**
 * Re-renders the caller every `intervalMs` so Bangla date/time stay live.
 * Starts as `null` on the server/first render and fills in after mount —
 * the standard hydration-safe live-clock pattern.
 */
export function useNow(intervalMs: number = 30_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

// ── Realtime location status (for "authentic location" UI feedback) ─────────
export interface KwiLocationStatus {
  /** True when real GPS fix (LocationContext) is in use; false = Dhaka fallback. */
  isLive: boolean;
  /** GPS horizontal accuracy in meters (0 when unknown/fallback). */
  accuracy: number;
  /** Whether a GPS watcher is currently active. */
  watching: boolean;
  /** Human-readable place name (Bangla). */
  name: string;
  district: string;
  /** Coordinates currently driving the intelligence. */
  lat: number;
  lon: number;
}

export function useKwiLocationStatus(): KwiLocationStatus {
  const { location, permission, loading } = useLocation();
  const geo = useKwiGeoLocation();
  return useMemo(
    () => ({
      isLive: !!location && permission === "granted",
      accuracy: location?.accuracy ?? 0,
      watching: permission === "granted" && !loading,
      name: geo.name,
      district: geo.district ?? "",
      lat: geo.latitude,
      lon: geo.longitude,
    }),
    [location, permission, loading, geo],
  );
}

// ── Active crop hook (single crop selection, persisted) ─────────────────────
export function useActiveCrop(): {
  crop: ActiveCrop;
  cropId: string;
  sowingDate: string;
  setCropId: (id: string) => void;
  setSowingDate: (d: string) => void;
} {
  const [cropId, setCropIdState] = useState<string>("rice");
  const [sowingDate, setSowingDateState] = useState<string>(defaultSowingDate);

  useEffect(() => {
    try {
      const storedCrop = localStorage.getItem(CROP_STORAGE_KEY);
      if (storedCrop && getCropConfig(storedCrop).id === storedCrop) {
        setCropIdState(storedCrop);
      }
      const storedSowing = localStorage.getItem(SOWING_STORAGE_KEY);
      if (storedSowing && /^\d{4}-\d{2}-\d{2}$/.test(storedSowing)) {
        setSowingDateState(storedSowing);
      }
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const setCropId = useCallback((id: string) => {
    setCropIdState(id);
    try {
      localStorage.setItem(CROP_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const setSowingDate = useCallback((d: string) => {
    setSowingDateState(d);
    try {
      localStorage.setItem(SOWING_STORAGE_KEY, d);
    } catch {
      /* ignore */
    }
  }, []);

  const crop = useMemo<ActiveCrop>(() => {
    const config = getCropConfig(cropId);
    return {
      cropId: config.id,
      config,
      sowingDate,
      expectedHarvestDate: "",
      currentStage: "vegetative" as GrowthStageId,
      stageStartDate: "",
      area: 1,
      fieldId: "field-1",
      fieldName: config.nameBn,
    };
  }, [cropId, sowingDate]);

  return { crop, cropId, sowingDate, setCropId, setSowingDate };
}

// ── Weather hook (Open-Meteo via KWI adapter, cached) ───────────────────────
export function useKwiWeather() {
  const geo = useKwiGeoLocation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWeather = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const adapter = createWeatherAdapter("open-meteo");
        const data = await adapter.fetchWeather(geo);
        setWeather(data);
        setError(null);
        try {
          localStorage.setItem(
            WEATHER_CACHE_KEY,
            JSON.stringify({ at: Date.now(), geo, data }),
          );
        } catch {
          /* quota exceeded — ignore */
        }
      } catch (e) {
        // Graceful degradation: fall back to recent cache (max 2h old)
        try {
          const raw = localStorage.getItem(WEATHER_CACHE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as {
              at: number;
              geo: GeoLocation;
              data: WeatherData;
            };
            const staleButClose =
              Date.now() - parsed.at < 2 * 60 * 60 * 1000 &&
              Math.abs(parsed.geo.latitude - geo.latitude) < 0.5 &&
              Math.abs(parsed.geo.longitude - geo.longitude) < 0.5;
            if (staleButClose) {
              setWeather(parsed.data);
              setError(null);
            } else {
              setError(e instanceof Error ? e : new Error("Weather fetch failed"));
            }
          } else {
            setError(e instanceof Error ? e : new Error("Weather fetch failed"));
          }
        } catch {
          setError(e instanceof Error ? e : new Error("Weather fetch failed"));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [geo],
  );

  useEffect(() => {
    fetchWeather();
    const id = setInterval(() => fetchWeather(true), REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchWeather]);

  return { weather, isLoading, error, refetch: () => fetchWeather() };
}

// ── One-stop intelligence hook (all engines, memoized) ──────────────────────
export interface KwiIntelligence {
  weather: WeatherData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  risks: RiskDashboard | null;
  recommendations: Recommendation[];
  dailyPlan: ReturnType<typeof generateDailyPlan> | null;
  weeklyPlan: WeeklyPlan | null;
  calendar: CropCalendarEntry[];
  disease: DiseaseForecast | null;
  farmSummary: FarmSummary | null;
  crop: ActiveCrop;
}

export function useKwiIntelligence(cropOverride?: ActiveCrop): KwiIntelligence {
  const { weather, isLoading, error, refetch } = useKwiWeather();
  const { crop: storedCrop } = useActiveCrop();
  const crop = cropOverride ?? storedCrop;
  const activeCrops = useMemo(() => [crop], [crop]);

  // Risk engine (14 categories)
  const risks = useMemo<RiskDashboard | null>(() => {
    if (!weather) return null;
    try {
      return computeRiskDashboard(weather, activeCrops);
    } catch {
      return null;
    }
  }, [weather, activeCrops]);

  // Crop calendar
  const calendar = useMemo<CropCalendarEntry[]>(() => {
    if (!weather) return [];
    try {
      return generateCropCalendar(activeCrops, weather);
    } catch {
      return [];
    }
  }, [weather, activeCrops]);

  // Recommendations + plans
  const { recommendations, dailyPlan, weeklyPlan } = useMemo(() => {
    if (!weather || !risks) {
      return { recommendations: [] as Recommendation[], dailyPlan: null, weeklyPlan: null };
    }
    try {
      const recs = generateRecommendations(weather, activeCrops, risks, calendar);
      const daily = generateDailyPlan(weather, recs);
      const weekly = generateWeeklyPlan(weather, recs, risks);
      return { recommendations: recs, dailyPlan: daily, weeklyPlan: weekly };
    } catch {
      return { recommendations: [] as Recommendation[], dailyPlan: null, weeklyPlan: null };
    }
  }, [weather, risks, calendar, activeCrops]);

  // Disease forecast
  const disease = useMemo<DiseaseForecast | null>(() => {
    if (!weather) return null;
    try {
      return generateDiseaseForecast(weather, activeCrops);
    } catch {
      return null;
    }
  }, [weather, activeCrops]);

  // Farm summary (score gauge + alerts + priorities)
  const farmSummary = useMemo<FarmSummary | null>(() => {
    if (!weather || !risks) return null;
    const weatherScore = Math.max(
      0,
      100 -
        risks.overallRiskScore * 0.6 -
        (weather.current.precipitationProbability > 70 ? 15 : 0),
    );
    const farmHealthScore = Math.max(0, 100 - risks.overallRiskScore * 0.8);
    return {
      weatherIntelligenceScore: Math.round(weatherScore),
      farmHealthScore: Math.round(farmHealthScore),
      overallRiskLevel: risks.overallRiskLevel,
      topPriorities: recommendations
        .filter((r) => r.priority === "urgent" || r.priority === "high")
        .slice(0, 5),
      alerts: risks.alerts,
      upcomingRisks: risks.risks.filter((r) => r.score > 30).slice(0, 5),
      todayTasks: calendar.flatMap((c) => c.tasks),
      weatherSummary: buildSummary(weather, risks, "en"),
      weatherSummaryBn: buildSummary(weather, risks, "bn"),
      lastUpdated: weather.fetchedAt,
    };
  }, [weather, risks, recommendations, calendar]);

  return {
    weather,
    isLoading,
    error,
    refetch,
    risks,
    recommendations,
    dailyPlan,
    weeklyPlan,
    calendar,
    disease,
    farmSummary,
    crop,
  };
}

function buildSummary(
  weather: WeatherData,
  risks: RiskDashboard,
  lang: "en" | "bn",
): string {
  const temp = weather.current.temperature;
  const hum = weather.current.humidity;
  const rain = weather.daily[0]?.precipitationProbabilityMax ?? 0;
  const highRisks = risks.risks.filter(
    (r) => r.level === "high" || r.level === "very_high",
  );
  if (lang === "bn") {
    let s = `বর্তমান তাপমাত্রা ${temp}°C, আর্দ্রতা ${hum}%।`;
    if (rain > 50) s += ` বৃষ্টির সম্ভাবনা ${rain}%।`;
    if (highRisks.length > 0) s += ` ${highRisks.length}টি উচ্চ-ঝুঁকি সক্রিয়।`;
    return s;
  }
  let s = `Current temperature ${temp}°C with ${hum}% humidity.`;
  if (rain > 50) s += ` Rain probability ${rain}%.`;
  if (highRisks.length > 0) s += ` ${highRisks.length} high-risk factors active.`;
  return s;
}
