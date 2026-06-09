/**
 * WeatherWidget.tsx — Best-in-Class Agricultural Weather Dashboard
 *
 * Features:
 * - Current conditions with large temp display
 * - Weather alerts banner (heavy rain, heat, cold, flood risk)
 * - Agricultural advisory (crop-specific weather guidance)
 * - Atmospheric data grid (UV, dew point, pressure, cloud)
 * - Agricultural indices (soil moisture, ET0, leaf wetness, GDD)
 * - Hourly forecast strip (next 24h with precip probability)
 * - 5-day forecast with rain probability
 * - Sunrise/sunset times
 * - **Live GPS location via shared LocationContext**
 * - Auto-refresh every 30 minutes
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "@/context/LocationContext";

// ── Types ────────────────────────────────────────────────────────────────────
interface HourlyForecast {
  time: string;
  temp: number;
  code: number;
  precipProb: number;
  wind: number;
}

interface ForecastDay {
  day: string;
  max: number;
  min: number;
  code: number;
  precipProb: number;
  precipSum: number;
  windMax: number;
}

interface WeatherAlert {
  type: string;
  severity: "warning" | "advisory";
  message: string;
  messageBn: string;
}

interface WeatherData {
  ok: boolean;
  temp: number;
  feel: number;
  humid: number;
  wind: number;
  windDir: number;
  rain: number;
  code: number;
  maxT: number;
  minT: number;
  city: string;
  uvIndex: number;
  dewPoint: number;
  pressure: number;
  cloudCover: number;
  soilMoisture: number;
  soilMoistureDeep: number;
  soilTemp: number;
  et0: number;
  leafWetness: number;
  gdd: number;
  sunrise: string;
  sunset: string;
  uvMax: number;
  forecast: ForecastDay[];
  hourly: HourlyForecast[];
  alerts: WeatherAlert[];
  advisory: {
    advisory: string;
    advisoryBn: string;
    urgency: "normal" | "caution" | "alert";
  };
  source: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const bn = (n: number | string) =>
  String(Math.round(Number(n))).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const WMO: Record<number, { bn: string; icon: string }> = {
  0: { bn: "পরিষ্কার আকাশ", icon: "☀️" },
  1: { bn: "প্রায় পরিষ্কার", icon: "🌤️" },
  2: { bn: "আংশিক মেঘলা", icon: "⛅" },
  3: { bn: "মেঘলা", icon: "☁️" },
  45: { bn: "কুয়াশা", icon: "🌫️" },
  48: { bn: "হিমকুয়াশা", icon: "🌫️" },
  51: { bn: "গুঁড়ি বৃষ্টি", icon: "🌦️" },
  53: { bn: "মাঝারি গুঁড়ি বৃষ্টি", icon: "🌦️" },
  55: { bn: "ঘন গুঁড়ি বৃষ্টি", icon: "🌧️" },
  61: { bn: "হালকা বৃষ্টি", icon: "🌧️" },
  63: { bn: "মাঝারি বৃষ্টি", icon: "🌧️" },
  65: { bn: "ভারী বৃষ্টি", icon: "🌧️" },
  80: { bn: "বৃষ্টি", icon: "🌦️" },
  81: { bn: "মাঝারি ঝরে বৃষ্টি", icon: "🌧️" },
  82: { bn: "ভারী ঝরে বৃষ্টি", icon: "🌧️" },
  95: { bn: "বজ্রপাত", icon: "⛈️" },
  96: { bn: "বজ্রপাত ও শিলাবৃষ্টি", icon: "⛈️" },
  99: { bn: "ভারী বজ্রপাত", icon: "⛈️" },
};

const wmo = (c: number) => WMO[c] ?? { bn: "অজানা", icon: "🌡️" };

// Wind direction from degrees
const windDir = (deg: number) => {
  const dirs = ["উত্তর", "উত্তর-পূর্ব", "পূর্ব", "দক্ষিণ-পূর্ব", "দক্ষিণ", "দক্ষিণ-পশ্চিম", "পশ্চিম", "উত্তর-পশ্চিম"];
  return dirs[Math.round(deg / 45) % 8];
};

// UV level description
const uvLevel = (uv: number) => {
  if (uv <= 2) return { label: "কম", color: "text-green-300" };
  if (uv <= 5) return { label: "মাঝারি", color: "text-yellow-300" };
  if (uv <= 7) return { label: "বেশি", color: "text-orange-300" };
  if (uv <= 10) return { label: "অনেক বেশি", color: "text-red-300" };
  return { label: "চরম", color: "text-purple-300" };
};

// ── Dhaka fallback for weather auto-load ──────────────────────────────────────
const DHAKACoords = { lat: 23.8103, lon: 90.4125, city: "ঢাকা" };

// ── Component ────────────────────────────────────────────────────────────────
export default function WeatherWidget() {
  const { location, loading: locLoading, permission, requestLocation } = useLocation();
  const [w, setW] = useState<WeatherData | null>(null);
  const [err, setErr] = useState(false);
  const [showHourly, setShowHourly] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const prevCoordsRef = useRef<string>("");
  const hasDataRef = useRef(false); // tracks whether we successfully loaded data for current coords
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(true);

  const loadWeather = useCallback(async (lat: number, lon: number, city: string) => {
    const r = await fetch(
      `/api/weather?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`
    );
    if (!r.ok) throw new Error("Weather fetch failed");
    return r.json();
  }, []);

  // Auto-fallback to Dhaka after 3 seconds if location is still not available
  useEffect(() => {
    if (location) return; // Location already available
    const timer = setTimeout(() => {
      setFallbackUsed(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [location]);

  // Load weather when location changes OR when fallback kicks in
  useEffect(() => {
    const effectiveLocation = location || (fallbackUsed ? DHAKACoords : null);
    if (!effectiveLocation) return;

    const lat = effectiveLocation.lat;
    const lon = effectiveLocation.lon;
    const city = 'city' in effectiveLocation ? effectiveLocation.city : (location?.city || location?.district || "ঢাকা");

    const coordsKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    // Skip if we already loaded successfully for these exact coords
    if (prevCoordsRef.current === coordsKey && hasDataRef.current) return;
    prevCoordsRef.current = coordsKey;
    hasDataRef.current = false; // reset until fetch succeeds

    const load = async () => {
      setLoadingWeather(true);
      try {
        const data = await loadWeather(lat, lon, city);
        setW(data);
        setErr(false);
        hasDataRef.current = true; // mark as loaded
        setLastUpdated(new Date());
      } catch {
        setErr(true);
        hasDataRef.current = false;
      } finally {
        setLoadingWeather(false);
      }
    };
    load();
  }, [location, fallbackUsed, loadWeather]);

  // Auto-refresh every 30 minutes
  useEffect(() => {
    const effectiveLocation = location || (fallbackUsed ? DHAKACoords : null);
    if (!effectiveLocation) return;

    const lat = effectiveLocation.lat;
    const lon = effectiveLocation.lon;
    const city = 'city' in effectiveLocation ? effectiveLocation.city : (location?.city || location?.district || "ঢাকা");

    const interval = setInterval(async () => {
      try {
        const data = await loadWeather(lat, lon, city);
        setW(data);
        setErr(false);
        setLastUpdated(new Date());
      } catch { /* ignore auto-refresh errors */ }
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [location, fallbackUsed, loadWeather]);

  // Retry handler for error state
  const handleRetry = useCallback(() => {
    const effectiveLocation = location || (fallbackUsed ? DHAKACoords : null);
    if (!effectiveLocation) return;
    const lat = effectiveLocation.lat;
    const lon = effectiveLocation.lon;
    const city = 'city' in effectiveLocation ? effectiveLocation.city : (location?.city || location?.district || "ঢাকা");

    setErr(false);
    setLoadingWeather(true);
    prevCoordsRef.current = ""; // Force refetch
    hasDataRef.current = false; // Allow re-fetch
    loadWeather(lat, lon, city)
      .then((data) => { setW(data); hasDataRef.current = true; setLastUpdated(new Date()); })
      .catch(() => { setErr(true); hasDataRef.current = false; })
      .finally(() => setLoadingWeather(false));
  }, [location, fallbackUsed, loadWeather]);

  if (err) {
    return (
      <div className="bg-white rounded-[14px] border border-red-200 p-4 text-center text-sm text-red-500 card-shadow">
        <div>⚠️ আবহাওয়া তথ্য লোড হয়নি</div>
        <button
          onClick={handleRetry}
          className="mt-2 text-[11px] font-bold bg-red-100 text-red-600 px-3 py-1 rounded-full border-none cursor-pointer hover:bg-red-200 transition-colors"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  // Show loading state while location is being determined or weather is being fetched
  if (loadingWeather || (!w && !err) || (locLoading && !fallbackUsed)) {
    const loadingMessage = locLoading && !fallbackUsed
      ? "অবস্থান নির্ধারণ হচ্ছে…"
      : "আবহাওয়া লোড হচ্ছে…";

    return (
      <div className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] rounded-[14px] p-5 card-shadow">
        <div className="flex items-center justify-center gap-3 text-white/80 text-sm mb-3">
          <svg className="animate-spin h-5 w-5 text-white/60" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {loadingMessage}
        </div>
        {locLoading && !fallbackUsed && (
          <div className="text-center">
            <div className="text-white/40 text-[10px] mb-2">৩ সেকেন্ড পর ঢাকার আবহাওয়া দেখানো হবে</div>
            <button
              onClick={() => setFallbackUsed(true)}
              className="bg-white/10 hover:bg-white/20 text-white/70 text-[10px] font-bold rounded-full px-4 py-1.5 border border-white/20 cursor-pointer transition-colors"
            >
              এখনই ঢাকার আবহাওয়া দেখুন
            </button>
          </div>
        )}
      </div>
    );
  }

  // After error & loading checks, w must be non-null; guard for TypeScript
  if (!w) return null;

  const { icon, bn: bnDesc } = wmo(w.code);
  const advisoryColors = {
    normal: "bg-green-800/20 border-green-600/30",
    caution: "bg-amber-800/20 border-amber-500/30",
    alert: "bg-red-800/20 border-red-500/30",
  };
  const advisoryIcons = {
    normal: "✅",
    caution: "⚠️",
    alert: "🚨",
  };

  return (
    <div className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] rounded-[14px] overflow-hidden card-shadow">
      {/* ── ALERTS BANNER ──────────────────────────────────────────────── */}
      {w.alerts && w.alerts.length > 0 && (
        <div className="bg-red-900/60 px-4 py-2 flex items-center gap-2">
          <span className="animate-pulse-dot">🚨</span>
          <div className="flex-1 text-[11px] text-red-100 font-semibold">
            {w.alerts.map((a, i) => (
              <span key={i}>{a.messageBn}{i < w.alerts.length - 1 ? " · " : ""}</span>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* ── TOP: City + Temp + Sun times ──────────────────────────────── */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[11px] text-white/60 font-semibold flex items-center gap-1.5">
              📍 {w.city}
              {permission === "granted" && (
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" title="লাইভ লোকেশন" />
              )}
            </div>
            <div className="text-[42px] sm:text-[56px] font-bold leading-none mb-1">
              {bn(w.temp)}°C
            </div>
            <div className="text-[13px] text-white/85">
              {icon} {bnDesc}
            </div>
            <div className="text-[11px] text-white/50">
              সর্বোচ্চ {bn(w.maxT)}° · সর্বনিম্ন {bn(w.minT)}°
            </div>
          </div>
          <div className="text-right">
            <div className="text-[52px] leading-none">{icon}</div>
            <div className="text-[10px] text-white/50 mt-2">
              🌅 {w.sunrise} · 🌇 {w.sunset}
            </div>
          </div>
        </div>

        {/* ── AGRICULTURAL ADVISORY ─────────────────────────────────────── */}
        {w.advisory && (
          <div className={`rounded-xl p-3 mb-4 border ${advisoryColors[w.advisory.urgency]}`}>
            <div className="flex items-start gap-2">
              <span className="text-base flex-shrink-0">{advisoryIcons[w.advisory.urgency]}</span>
              <div>
                <div className="text-[11px] font-bold text-white/80 mb-0.5">
                  কৃষি পরামর্শ
                </div>
                <div className="text-[12px] text-white/90 leading-relaxed">
                  {w.advisory.advisoryBn}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PRIMARY STATS GRID ────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-1.5 mb-3 p-2.5 bg-white/10 rounded-[10px]">
          {[
            ["💧", "আর্দ্রতা", `${bn(w.humid)}%`],
            ["💨", "বায়ু", `${bn(w.wind)} km/h`],
            ["🌧️", "বৃষ্টি", `${(w.rain ?? 0).toFixed(1)} mm`],
            ["🌡️", "অনুভব", `${bn(w.feel)}°`],
          ].map(([ic, lbl, val], i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span>{ic}</span>
              <span className="text-[9px] text-white/50 text-center">{lbl}</span>
              <span className="text-[11px] font-semibold text-center">{val}</span>
            </div>
          ))}
        </div>

        {/* ── ATMOSPHERIC DATA ──────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-1.5 mb-3 p-2.5 bg-white/5 rounded-[10px]">
          {[
            ["☀️", "UV সূচক", `${w.uvIndex?.toFixed(1) || "—"}`, uvLevel(w.uvIndex || 0).color],
            ["💧", "শিশির বিন্দু", `${bn(Math.round(w.dewPoint || 0))}°`, "text-white/80"],
            ["🌡️", "চাপ", `${bn(Math.round((w.pressure || 0) / 10))} hPa`, "text-white/80"],
            ["☁️", "মেঘ", `${bn(Math.round(w.cloudCover || 0))}%`, "text-white/80"],
          ].map(([ic, lbl, val, color], i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span>{ic}</span>
              <span className="text-[9px] text-white/50 text-center">{lbl}</span>
              <span className={`text-[11px] font-semibold text-center ${color}`}>{val}</span>
            </div>
          ))}
        </div>

        {/* ── AGRICULTURAL INDICES ──────────────────────────────────────── */}
        {(w.soilMoisture !== undefined || w.et0 !== undefined) && (
          <div className="grid grid-cols-5 gap-1.5 mb-3 p-2.5 bg-green-800/20 rounded-[10px]">
            {[
              [
                "🌱",
                "মাটি আর্দ্রতা",
                w.soilMoisture !== undefined
                  ? `${bn(Math.round(w.soilMoisture * 100))}%`
                  : "—",
              ],
              [
                "🌡️",
                "মাটি তাপ",
                w.soilTemp !== undefined
                  ? `${bn(Math.round(w.soilTemp))}°`
                  : "—",
              ],
              [
                "💧",
                "ET₀",
                w.et0 !== undefined ? `${w.et0.toFixed(1)}mm` : "—",
              ],
              [
                "🍃",
                "পাতা ভেজা",
                w.leafWetness !== undefined
                  ? `${bn(Math.round(w.leafWetness))}%`
                  : "—",
              ],
              [
                "🌾",
                "GDD",
                w.gdd !== undefined
                  ? `${bn(Math.round(w.gdd))}°C`
                  : "—",
              ],
            ].map(([ic, lbl, val], i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span>{ic}</span>
                <span className="text-[9px] text-white/50 text-center">{lbl}</span>
                <span className="text-[11px] font-semibold text-center">{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── HOURLY FORECAST (toggle) ──────────────────────────────────── */}
        {w.hourly && w.hourly.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setShowHourly(!showHourly)}
              className="text-[11px] text-white/60 font-semibold mb-2 flex items-center gap-1 bg-transparent border-none cursor-pointer p-0 hover:text-white/80 transition-colors"
            >
              🕐 ঘণ্টাভিত্তিক পূর্বাভাস {showHourly ? "▲" : "▼"}
            </button>
            {showHourly && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {w.hourly.filter((_, i) => i % 2 === 0).map((h, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-0.5 min-w-[44px] bg-white/8 rounded-lg py-1.5 px-1 flex-shrink-0"
                  >
                    <span className="text-[8px] text-white/50 font-semibold">
                      {h.time}
                    </span>
                    <span className="text-sm">{wmo(h.code).icon}</span>
                    <span className="text-[10px] font-bold">{bn(h.temp)}°</span>
                    <span className="text-[8px] text-blue-300">
                      {h.precipProb > 0 ? `${bn(h.precipProb)}%` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 5-DAY FORECAST ────────────────────────────────────────────── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {w.forecast.map((f, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-0.5 min-w-[52px] bg-white/10 rounded-lg py-2 px-1.5 flex-shrink-0"
            >
              <span className="text-[9px] text-white/60 font-semibold">
                {f.day}
              </span>
              <span className="text-base">{wmo(f.code).icon}</span>
              <span className="text-[11px] font-bold">{bn(f.max)}°</span>
              <span className="text-[10px] text-white/45">{bn(f.min)}°</span>
              {f.precipProb > 0 && (
                <span className="text-[8px] text-blue-300 font-semibold">
                  💧 {bn(f.precipProb)}%
                </span>
              )}
            </div>
          ))}
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center text-[9px] text-white/30 mt-2">
          <span className="flex items-center gap-1.5">
            {w.source?.includes("অফলাইন") || w.source?.includes("মৌসুমী") ? (
              <>
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                <span className="text-amber-300/70">{w.source}</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <span>{w.source}</span>
              </>
            )}
          </span>
          {lastUpdated && (
            <span>আপডেট: {lastUpdated.toLocaleTimeString("bn-BD")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
