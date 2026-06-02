/**
 * WeatherWidget.tsx — Live weather for KrishiAI
 *
 * GPS-first weather using Open-Meteo via our proxy API.
 * Shows temp, humidity, wind, rain, agricultural indices, 5-day forecast.
 */

"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ────────────────────────────────────────────────────────────────────
interface ForecastDay {
  day: string;
  max: number;
  min: number;
  code: number;
}

interface WeatherData {
  ok: boolean;
  temp: number;
  feel: number;
  humid: number;
  wind: number;
  rain: number;
  code: number;
  maxT: number;
  minT: number;
  city: string;
  soilMoisture?: number;
  soilTemp?: number;
  et0?: number;
  leafWetness?: number;
  gdd?: number;
  forecast: ForecastDay[];
  source?: string;
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
  51: { bn: "গুঁড়ি বৃষ্টি", icon: "🌦️" },
  61: { bn: "হালকা বৃষ্টি", icon: "🌧️" },
  63: { bn: "মাঝারি বৃষ্টি", icon: "🌧️" },
  65: { bn: "ভারী বৃষ্টি", icon: "🌧️" },
  80: { bn: "বৃষ্টি", icon: "🌦️" },
  95: { bn: "বজ্রপাত", icon: "⛈️" },
};

const wmo = (c: number) => WMO[c] ?? { bn: "অজানা", icon: "🌡️" };

// ── Component ────────────────────────────────────────────────────────────────
async function fetchWeather(
  lat: number,
  lon: number,
  city: string
): Promise<WeatherData> {
  const r = await fetch(
    `/api/weather?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`
  );
  if (!r.ok) throw new Error("Weather fetch failed");
  return r.json();
}

// ── Component ────────────────────────────────────────────────────────────────
export default function WeatherWidget() {
  const [w, setW] = useState<WeatherData | null>(null);
  const [err, setErr] = useState(false);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Try GPS first
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation?.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 60000,
          });
        });

        const data = await fetchWeather(
          pos.coords.latitude,
          pos.coords.longitude,
          "আপনার অবস্থান"
        );
        setW(data);
      } catch {
        // Fallback to Dhaka
        try {
          const data = await fetchWeather(23.8103, 90.4125, "ঢাকা");
          setW(data);
        } catch {
          setErr(true);
        }
      }
      setLocating(false);
    };
    load();
  }, []);

  if (err) {
    return (
      <div className="bg-white rounded-[14px] border border-red-200 p-4 text-center text-sm text-red-500 card-shadow">
        ⚠️ আবহাওয়া তথ্য লোড হয়নি
      </div>
    );
  }

  if (!w || locating) {
    return (
      <div className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] rounded-[14px] p-4 flex items-center justify-center gap-2 text-white/80 text-sm">
        <span className="inline-block animate-spin-slow">📍</span>
        অবস্থান নির্ধারণ হচ্ছে…
      </div>
    );
  }

  const { icon, bn: bnDesc } = wmo(w.code);

  return (
    <div className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] rounded-[14px] p-4 sm:p-6 text-white card-shadow">
      {/* Top: City + Temp */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-[11px] text-white/60 font-semibold">
            📍 {w.city}
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
        <div className="text-[52px] leading-none">{icon}</div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-1.5 mb-4 p-2.5 bg-white/10 rounded-[10px]">
        {[
          ["💧", "আর্দ্রতা", `${bn(w.humid)}%`],
          ["💨", "বায়ু", `${bn(w.wind)} km/h`],
          ["🌧️", "বৃষ্টি", `${w.rain} mm`],
          ["🌡️", "অনুভব", `${bn(w.feel)}°`],
        ].map(([ic, lbl, val], i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span>{ic}</span>
            <span className="text-[9px] text-white/50 text-center">{lbl}</span>
            <span className="text-[11px] font-semibold text-center">
              {val}
            </span>
          </div>
        ))}
      </div>

      {/* Agricultural indices */}
      {(w.soilMoisture !== undefined || w.et0 !== undefined) && (
        <div className="grid grid-cols-5 gap-1.5 mb-4 p-2.5 bg-green-800/20 rounded-[10px]">
          {[
            [
              "🌱",
              "মাটি আর্দ্রতা",
              w.soilMoisture !== undefined
                ? `${bn(Math.round(w.soilMoisture))}%`
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
              <span className="text-[9px] text-white/50 text-center">
                {lbl}
              </span>
              <span className="text-[11px] font-semibold text-center">
                {val}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 5-day forecast */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {w.forecast.map((f, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-0.5 min-w-[48px] bg-white/10 rounded-lg py-2 px-1 flex-shrink-0"
          >
            <span className="text-[9px] text-white/60 font-semibold">
              {f.day}
            </span>
            <span className="text-base">{wmo(f.code).icon}</span>
            <span className="text-[11px] font-bold">{bn(f.max)}°</span>
            <span className="text-[10px] text-white/45">{bn(f.min)}°</span>
          </div>
        ))}
      </div>

      <div className="text-[9px] text-white/30 text-right mt-2">
        Open-Meteo · BMD
      </div>
    </div>
  );
}
