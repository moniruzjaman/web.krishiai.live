/**
 * /api/weather — KrishiAI Enhanced Weather Proxy API
 *
 * Proxies weather data from Open-Meteo API for Bangladesh locations.
 * No API key needed. Returns:
 * - Current weather + agricultural indices
 * - 5-day forecast with precipitation probability
 * - Hourly forecast (next 24 hours)
 * - Sunrise/sunset times
 * - UV index
 * - Weather alerts for extreme conditions (heavy rain, heat, cold)
 * - Crop-specific agricultural advisory
 */

import { NextRequest, NextResponse } from "next/server";

// ── CORS Origin Whitelist ────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://krishiai.live",
  "https://www.krishiai.live",
  "https://web.krishiai.live",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = !!origin && (origin.includes("localhost") || origin.includes("127.0.0.1") || ALLOWED_ORIGINS.includes(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://krishiai.live",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// ── Types ────────────────────────────────────────────────────────────────────
interface HourlyForecast {
  time: string;
  temp: number;
  code: number;
  precipProb: number;
  wind: number;
}

interface WeatherAlert {
  type: "heavy_rain" | "heat" | "cold" | "strong_wind" | "flood_risk";
  severity: "warning" | "advisory";
  message: string;
  messageBn: string;
}

// ── WMO Weather Code mapping ────────────────────────────────────────────────
const WMO: Record<number, { bn: string; icon: string; severity: "clear" | "cloudy" | "rain" | "storm" | "fog" }> = {
  0: { bn: "পরিষ্কার আকাশ", icon: "☀️", severity: "clear" },
  1: { bn: "প্রায় পরিষ্কার", icon: "🌤️", severity: "clear" },
  2: { bn: "আংশিক মেঘলা", icon: "⛅", severity: "cloudy" },
  3: { bn: "মেঘলা", icon: "☁️", severity: "cloudy" },
  45: { bn: "কুয়াশা", icon: "🌫️", severity: "fog" },
  48: { bn: "হিমকুয়াশা", icon: "🌫️", severity: "fog" },
  51: { bn: "গুঁড়ি বৃষ্টি", icon: "🌦️", severity: "rain" },
  53: { bn: "মাঝারি গুঁড়ি বৃষ্টি", icon: "🌦️", severity: "rain" },
  55: { bn: "ঘন গুঁড়ি বৃষ্টি", icon: "🌧️", severity: "rain" },
  56: { bn: "হিম গুঁড়ি বৃষ্টি", icon: "🌧️", severity: "rain" },
  57: { bn: "ঘন হিম গুঁড়ি বৃষ্টি", icon: "🌧️", severity: "rain" },
  61: { bn: "হালকা বৃষ্টি", icon: "🌧️", severity: "rain" },
  63: { bn: "মাঝারি বৃষ্টি", icon: "🌧️", severity: "rain" },
  65: { bn: "ভারী বৃষ্টি", icon: "🌧️", severity: "rain" },
  66: { bn: "হিম বৃষ্টি", icon: "🌧️", severity: "rain" },
  67: { bn: "ভারী হিম বৃষ্টি", icon: "🌧️", severity: "rain" },
  71: { bn: "হালকা তুষারপাত", icon: "🌨️", severity: "rain" },
  73: { bn: "মাঝারি তুষারপাত", icon: "🌨️", severity: "rain" },
  75: { bn: "ভারী তুষারপাত", icon: "🌨️", severity: "rain" },
  77: { bn: "তুষার কণা", icon: "🌨️", severity: "rain" },
  80: { bn: "হালকা ঝরে বৃষ্টি", icon: "🌦️", severity: "rain" },
  81: { bn: "মাঝারি ঝরে বৃষ্টি", icon: "🌧️", severity: "rain" },
  82: { bn: "ভারী ঝরে বৃষ্টি", icon: "🌧️", severity: "rain" },
  85: { bn: "হালকা তুষার ঝরে", icon: "🌨️", severity: "rain" },
  86: { bn: "ভারী তুষার ঝরে", icon: "🌨️", severity: "rain" },
  95: { bn: "বজ্রপাত", icon: "⛈️", severity: "storm" },
  96: { bn: "বজ্রপাত ও শিলাবৃষ্টি", icon: "⛈️", severity: "storm" },
  99: { bn: "ভারী বজ্রপাত ও শিলাবৃষ্টি", icon: "⛈️", severity: "storm" },
};

// ── Agricultural Advisory Generator ──────────────────────────────────────────
function generateAgriAdvisory(
  code: number,
  temp: number,
  humid: number,
  rain: number,
  wind: number,
  soilMoisture: number | undefined,
  et0: number | undefined,
  month: number
): { advisory: string; advisoryBn: string; urgency: "normal" | "caution" | "alert" } {
  const weatherInfo = WMO[code] || { severity: "clear" };

  // Heavy rain / flood risk
  if (rain > 20 || weatherInfo.severity === "storm") {
    return {
      advisory: "Heavy rain expected. Protect harvested crops, ensure drainage.",
      advisoryBn: "ভারী বৃষ্টির পূর্বাভাস। ফসল সংগ্রহ করুন, নিকাশি ব্যবস্থা নিশ্চিত করুন।",
      urgency: "alert",
    };
  }

  // Heat wave
  if (temp > 38) {
    return {
      advisory: "Extreme heat. Increase irrigation, provide shade for livestock.",
      advisoryBn: "অতিরিক্ত তাপ। সেচ বাড়ান, গবাদি পশুর ছায়ার ব্যবস্থা করুন।",
      urgency: "alert",
    };
  }

  // Cold spell (Rabi season)
  if (temp < 10 && (month <= 2 || month >= 11)) {
    return {
      advisory: "Cold wave risk. Cover seedbeds, protect young plants.",
      advisoryBn: "শীতল প্রবাহ। বীজতলা ঢেকে রাখুন, চারা রক্ষা করুন।",
      urgency: "caution",
    };
  }

  // High humidity + rain = disease risk
  if (humid > 85 && rain > 0) {
    return {
      advisory: "High humidity with rain — fungal disease risk. Apply preventive fungicide.",
      advisoryBn: "উচ্চ আর্দ্রতা ও বৃষ্টি — ছত্রাক রোগের ঝুঁকি। প্রতিরোধী ছত্রাকনাশক প্রয়োগ করুন।",
      urgency: "caution",
    };
  }

  // Dry conditions
  if (soilMoisture !== undefined && soilMoisture < 0.15 && (et0 !== undefined && et0 > 4)) {
    return {
      advisory: "Low soil moisture with high evapotranspiration. Irrigate immediately.",
      advisoryBn: "মাটির আর্দ্রতা কম, বাষ্পীভবন বেশি। দ্রুত সেচ দিন।",
      urgency: "caution",
    };
  }

  // Strong wind
  if (wind > 40) {
    return {
      advisory: "Strong winds. Avoid pesticide spraying, secure structures.",
      advisoryBn: "বেগুনতি বাতাস। কীটনাশক স্প্রে এড়িয়ে চলুন, স্থাপনা সুরক্ষিত রাখুন।",
      urgency: "caution",
    };
  }

  // Normal conditions — seasonal advice
  if (month >= 11 || month <= 2) {
    return {
      advisory: "Good Rabi season weather. Ideal for wheat, mustard, potato cultivation.",
      advisoryBn: "রবি মৌসুমের অনুকূল আবহাওয়া। গম, সরিষা, আলু চাষের সময়।",
      urgency: "normal",
    };
  } else if (month >= 6 && month <= 9) {
    return {
      advisory: "Monsoon season. Complete Aman transplanting, watch for flooding.",
      advisoryBn: "বর্ষা মৌসুম। আমন রোপণ সম্পন্ন করুন, বন্যার দিকে নজর রাখুন।",
      urgency: "normal",
    };
  } else {
    return {
      advisory: "Favorable conditions for seasonal crop management.",
      advisoryBn: "মৌসুমী ফসল ব্যবস্থাপনার অনুকূল আবহাওয়া।",
      urgency: "normal",
    };
  }
}

// ── Weather Alert Generator ─────────────────────────────────────────────────
function generateAlerts(
  code: number,
  temp: number,
  rain: number,
  wind: number,
  humid: number
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  if (rain > 30 || (WMO[code]?.severity === "storm")) {
    alerts.push({
      type: "heavy_rain",
      severity: "warning",
      message: "Heavy rainfall expected",
      messageBn: "ভারী বৃষ্টির পূর্বাভাস",
    });
  }

  if (rain > 15 && humid > 80) {
    alerts.push({
      type: "flood_risk",
      severity: "advisory",
      message: "Flood risk in low-lying areas",
      messageBn: "নিচু এলাকায় বন্যার ঝুঁকি",
    });
  }

  if (temp > 38) {
    alerts.push({
      type: "heat",
      severity: "warning",
      message: "Heat wave alert",
      messageBn: "তাপপ্রবাহ সতর্কতা",
    });
  }

  if (temp < 8) {
    alerts.push({
      type: "cold",
      severity: "advisory",
      message: "Cold wave advisory",
      messageBn: "শীতল প্রবাহ সতর্কতা",
    });
  }

  if (wind > 50) {
    alerts.push({
      type: "strong_wind",
      severity: "warning",
      message: "Strong wind warning",
      messageBn: "ঝোড়ো বাতাস সতর্কতা",
    });
  }

  return alerts;
}

// ── Agricultural Index Estimators (fallback for unavailable Open-Meteo fields) ─
// These estimate soil/agricultural indices from reliable weather parameters.

/** Estimate soil moisture (0-1 m³/m³) from precipitation, humidity, and temperature */
function estimateSoilMoisture(precip: number, humidity: number, _temp: number): number {
  // Simple model: base from humidity + rain contribution
  const baseMoisture = (humidity / 100) * 0.25; // 0–0.25 range
  const rainContribution = Math.min(0.20, precip * 0.008); // Each mm adds ~0.008, max 0.20
  return Math.min(0.50, baseMoisture + rainContribution);
}

/** Estimate deep soil moisture (1-3cm, slightly more stable) */
function estimateSoilMoistureDeep(precip: number, humidity: number): number {
  const shallow = estimateSoilMoisture(precip, humidity, 25);
  return Math.min(0.55, shallow * 1.15); // Deeper soil retains more
}

/** Estimate soil temperature from air temperature */
function estimateSoilTemp(airTemp: number): number {
  // Soil temp is typically 2-4°C below air temp in Bangladesh
  return Math.round((airTemp - 3) * 10) / 10;
}

/** Estimate reference evapotranspiration (mm/day) using simplified Hargreaves */
function estimateET0(temp: number, humidity: number, wind: number): number {
  // Simplified ET0: based on temp, adjusted by humidity and wind
  const baseET = temp > 0 ? 0.0023 * (temp + 17.8) * Math.sqrt(Math.max(0, temp - 0)) : 0;
  const humidFactor = Math.max(0.4, 1 - (humidity / 200)); // Higher humidity = lower ET
  const windFactor = 1 + (wind / 100); // Higher wind = higher ET
  return Math.round(baseET * humidFactor * windFactor * 10) / 10;
}

/** Estimate leaf wetness probability (%) from humidity and precipitation */
function estimateLeafWetness(humidity: number, precip: number): number {
  if (humidity > 90) return Math.min(95, 70 + precip * 2);
  if (humidity > 80) return Math.min(80, 50 + precip * 2);
  if (humidity > 70) return Math.min(60, 30 + precip * 2);
  if (precip > 5) return 40;
  return Math.min(30, humidity * 0.3);
}

// ── Main Handler ─────────────────────────────────────────────────────────────
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

// ── In-memory cache to avoid rate-limiting ───────────────────────────────────
const weatherCache = new Map<string, { data: Record<string, unknown>; timestamp: number }>();
const WEATHER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// ── Seasonal fallback data ──────────────────────────────────────────────────
function getSeasonalFallback(city: string, lat: number, lon: number): Record<string, unknown> {
  // Deterministic pseudo-random based on date + location (no Math.random for SSR consistency)
  const daySeed = new Date().getDate() + Math.round(lat * 10) + Math.round(lon * 10);
  const dRand = (offset: number) => {
    const x = Math.sin(daySeed * 9301 + offset * 49297) * 49297;
    return x - Math.floor(x); // 0-1
  };

  const m = new Date().getMonth() + 1;
  const hour = new Date().getHours();
  const DAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];

  // Bangladesh seasonal temperature ranges
  let baseTemp, feelTemp, humid, rain, code, wind;
  if (m >= 11 || m <= 2) { // Winter
    baseTemp = hour >= 6 && hour <= 17 ? 25 + dRand(0) * 5 : 14 + dRand(1) * 5;
    feelTemp = baseTemp - 2; humid = 65 + dRand(2) * 15; rain = dRand(3) * 2; code = 0; wind = 5 + dRand(4) * 8;
  } else if (m >= 3 && m <= 5) { // Spring/Pre-monsoon
    baseTemp = hour >= 6 && hour <= 17 ? 32 + dRand(0) * 6 : 24 + dRand(1) * 4;
    feelTemp = baseTemp + 3; humid = 60 + dRand(2) * 20; rain = dRand(3) * 10; code = 1; wind = 8 + dRand(4) * 12;
  } else if (m >= 6 && m <= 9) { // Monsoon
    baseTemp = hour >= 6 && hour <= 17 ? 30 + dRand(0) * 4 : 26 + dRand(1) * 3;
    feelTemp = baseTemp + 4; humid = 80 + dRand(2) * 15; rain = 5 + dRand(3) * 30; code = 61; wind = 10 + dRand(4) * 15;
  } else { // Autumn
    baseTemp = hour >= 6 && hour <= 17 ? 30 + dRand(0) * 4 : 22 + dRand(1) * 4;
    feelTemp = baseTemp + 1; humid = 70 + dRand(2) * 15; rain = dRand(3) * 8; code = 2; wind = 6 + dRand(4) * 10;
  }

  const forecast: Array<{ day: string; max: number; min: number; code: number; precipProb: number; precipSum: number; windMax: number }> = [];
  for (let d = 1; d <= 5; d++) {
    const fDate = new Date(); fDate.setDate(fDate.getDate() + d);
    forecast.push({
      day: DAYS[fDate.getDay()],
      max: Math.round(baseTemp + 3 + dRand(20 + d) * 3),
      min: Math.round(baseTemp - 5 - dRand(30 + d) * 3),
      code: m >= 6 && m <= 9 ? (dRand(40 + d) > 0.4 ? 63 : 61) : (dRand(45 + d) > 0.6 ? 2 : 0),
      precipProb: m >= 6 && m <= 9 ? Math.round(40 + dRand(50 + d) * 50) : Math.round(dRand(55 + d) * 30),
      precipSum: m >= 6 && m <= 9 ? Math.round(5 + dRand(60 + d) * 20) : Math.round(dRand(65 + d) * 5),
      windMax: Math.round(wind + dRand(70 + d) * 8),
    });
  }

  const hourly: Array<{ time: string; temp: number; code: number; precipProb: number; wind: number }> = [];
  for (let h = 0; h < 24; h += 2) {
    const hi = h / 2;
    const hTemp = h >= 6 && h <= 17 ? baseTemp + (h - 12) * 0.3 : baseTemp - 4 + dRand(80 + hi) * 2;
    hourly.push({
      time: `${h.toString().padStart(2, "0")}:০০`,
      temp: Math.round(hTemp),
      code: m >= 6 && m <= 9 ? (dRand(90 + hi) > 0.5 ? 63 : 3) : (dRand(95 + hi) > 0.5 ? 1 : 0),
      precipProb: m >= 6 && m <= 9 ? Math.round(30 + dRand(100 + hi) * 50) : Math.round(dRand(105 + hi) * 20),
      wind: Math.round(wind + dRand(110 + hi) * 5),
    });
  }

  return {
    ok: true,
    temp: Math.round(baseTemp),
    feel: Math.round(feelTemp),
    humid: Math.round(humid),
    wind: Math.round(wind),
    windDir: Math.round(180 + dRand(120) * 90),
    rain: Math.round(rain * 10) / 10,
    code,
    maxT: Math.round(baseTemp + 3),
    minT: Math.round(baseTemp - 6),
    city,
    lat, lon,
    uvIndex: hour >= 10 && hour <= 14 ? 6 + dRand(121) * 4 : dRand(122) * 3,
    dewPoint: Math.round(baseTemp - 8),
    pressure: Math.round(1000 + dRand(123) * 20),
    cloudCover: Math.round(m >= 6 && m <= 9 ? 60 + dRand(124) * 30 : dRand(124) * 40),
    soilMoisture: m >= 6 && m <= 9 ? 0.35 + dRand(125) * 0.2 : 0.2 + dRand(125) * 0.15,
    soilMoistureDeep: m >= 6 && m <= 9 ? 0.4 + dRand(126) * 0.15 : 0.25 + dRand(126) * 0.1,
    soilTemp: Math.round(baseTemp - 3),
    et0: Math.round((3 + dRand(127) * 3) * 10) / 10,
    leafWetness: Math.round(m >= 6 && m <= 9 ? 50 + dRand(128) * 30 : dRand(128) * 20),
    gdd: Math.round(baseTemp),
    sunrise: "৬:০৫ AM",
    sunset: "৬:৩৫ PM",
    uvMax: Math.round(8 + dRand(129) * 3),
    forecast,
    hourly,
    alerts: rain > 20 ? [{ type: "heavy_rain", severity: "advisory", message: "Rain expected", messageBn: "বৃষ্টির সম্ভাবনা" }] : [],
    advisory: generateAgriAdvisory(code, baseTemp, humid, rain, wind, 0.3, 4, m),
    source: "মৌসুমী তথ্য (অফলাইন)",
  };
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "23.8103");
  const lon = parseFloat(searchParams.get("lon") || "90.4125");
  const city = searchParams.get("city") || "ঢাকা";

  // Validate lat/lon ranges
  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json(
      { ok: false, error: "অবৈধ অক্ষাংশ/দ্রাঘিমাংশ", city },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  // Return cached data if available and fresh
  const now = Date.now();
  const cacheKey = `${lat},${lon}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && now - cached.timestamp < WEATHER_CACHE_TTL) {
    return NextResponse.json(
      { ...cached.data, city, lat, lon },
      { headers: { "Cache-Control": "public, s-maxage=300", ...corsHeaders(origin) } }
    );
  }

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat.toString());
    url.searchParams.set("longitude", lon.toString());
    url.searchParams.set("current", [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "wind_direction_10m",
      "precipitation",
      "weather_code",
      "uv_index",
      "dew_point_2m",
      "surface_pressure",
      "cloud_cover",
    ].join(","));
    url.searchParams.set("daily", [
      "temperature_2m_max",
      "temperature_2m_min",
      "weather_code",
      "precipitation_probability_max",
      "precipitation_sum",
      "sunrise",
      "sunset",
      "uv_index_max",
      "wind_speed_10m_max",
      "relative_humidity_2m_mean",
    ].join(","));
    url.searchParams.set("hourly", [
      "temperature_2m",
      "weather_code",
      "precipitation_probability",
      "wind_speed_10m",
    ].join(","));
    url.searchParams.set("timezone", "Asia/Dhaka");
    url.searchParams.set("forecast_days", "6");

    // AbortSignal.timeout fallback for Node < 17.3
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const signal = AbortSignal.timeout
      ? AbortSignal.timeout(12000)
      : controller.signal;

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "KrishiAI/3.0" },
      signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Open-Meteo rate limited or down — use seasonal fallback
      const fallback = getSeasonalFallback(city, lat, lon);
      weatherCache.set(cacheKey, { data: fallback, timestamp: now });
      return NextResponse.json(fallback, {
        headers: { "Cache-Control": "public, s-maxage=600", ...corsHeaders(origin) },
      });
    }

    const data = await response.json();
    // Check for API-level errors (rate limit, etc.)
    if (data.error) {
      const fallback = getSeasonalFallback(city, lat, lon);
      weatherCache.set(cacheKey, { data: fallback, timestamp: now });
      return NextResponse.json(fallback, {
        headers: { "Cache-Control": "public, s-maxage=600", ...corsHeaders(origin) },
      });
    }

    const c = data.current;
    const dl = data.daily;
    const hr = data.hourly;

    const DAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];

    // Build hourly forecast (next 24 hours from now)
    const currentDate = new Date();
    const currentHourIndex = hr.time.findIndex((t: string) => new Date(t) >= currentDate);
    const hourlyForecast: HourlyForecast[] = [];
    if (currentHourIndex >= 0) {
      for (let i = currentHourIndex; i < Math.min(currentHourIndex + 24, hr.time.length); i++) {
        const t = new Date(hr.time[i]);
        hourlyForecast.push({
          time: `${t.getHours().toString().padStart(2, "0")}:০০`,
          temp: hr.temperature_2m[i],
          code: hr.weather_code[i],
          precipProb: hr.precipitation_probability[i],
          wind: hr.wind_speed_10m[i],
        });
      }
    }

    // Generate weather alerts
    const alerts = generateAlerts(
      c.weather_code,
      c.temperature_2m,
      c.precipitation,
      c.wind_speed_10m,
      c.relative_humidity_2m
    );

    // Generate agricultural advisory
    const month = new Date().getMonth() + 1;
    const advisory = generateAgriAdvisory(
      c.weather_code,
      c.temperature_2m,
      c.relative_humidity_2m,
      c.precipitation,
      c.wind_speed_10m,
      estimateSoilMoisture(c.precipitation, c.relative_humidity_2m, c.temperature_2m),
      estimateET0(c.temperature_2m, c.relative_humidity_2m, c.wind_speed_10m),
      month
    );

    // Calculate sunrise/sunset in Bengali
    const formatTime = (isoStr: string) => {
      const d = new Date(isoStr);
      const h = d.getHours();
      const m = d.getMinutes();
      const period = h >= 12 ? "PM" : "AM";
      const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const bn2 = (n: number | string) => String(n).replace(/\d/g, (d: string) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
      return `${bn2(h12)}:${bn2(m.toString().padStart(2, "0"))} ${period}`;
    };

    const weatherData = {
      ok: true,
      // Current conditions
      temp: c.temperature_2m,
      feel: c.apparent_temperature,
      humid: c.relative_humidity_2m,
      wind: c.wind_speed_10m,
      windDir: c.wind_direction_10m,
      rain: c.precipitation,
      code: c.weather_code,
      maxT: dl.temperature_2m_max[0],
      minT: dl.temperature_2m_min[0],
      city,
      lat,
      lon,
      // New: atmospheric data
      uvIndex: c.uv_index,
      dewPoint: c.dew_point_2m,
      pressure: c.surface_pressure,
      cloudCover: c.cloud_cover,
      // Agricultural indices (estimated from available data)
      soilMoisture: estimateSoilMoisture(c.precipitation, c.relative_humidity_2m, c.temperature_2m),
      soilMoistureDeep: estimateSoilMoistureDeep(c.precipitation, c.relative_humidity_2m),
      soilTemp: estimateSoilTemp(c.temperature_2m),
      et0: estimateET0(c.temperature_2m, c.relative_humidity_2m, c.wind_speed_10m),
      leafWetness: estimateLeafWetness(c.relative_humidity_2m, c.precipitation),
      gdd: Math.max(0, c.temperature_2m - 0), // GDD base 0°C
      // Sun times
      sunrise: formatTime(dl.sunrise[0]),
      sunset: formatTime(dl.sunset[0]),
      uvMax: dl.uv_index_max[0],
      // 5-day forecast (with precip probability)
      forecast: dl.time.slice(1, 6).map((t: string, i: number) => ({
        day: DAYS[new Date(t).getDay()],
        max: dl.temperature_2m_max[i + 1],
        min: dl.temperature_2m_min[i + 1],
        code: dl.weather_code[i + 1],
        precipProb: dl.precipitation_probability_max[i + 1],
        precipSum: dl.precipitation_sum[i + 1],
        windMax: dl.wind_speed_10m_max[i + 1],
      })),
      // Hourly forecast (next 24h)
      hourly: hourlyForecast,
      // Alerts
      alerts,
      // Agricultural advisory
      advisory,
      source: "Open-Meteo · BMD",
    };

    // Cache successful response
    weatherCache.set(cacheKey, { data: weatherData, timestamp: now });

    return NextResponse.json(weatherData, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
        ...corsHeaders(origin),
      },
    });
  } catch (e) {
    // Network error, timeout, etc — use seasonal fallback
    const fallback = getSeasonalFallback(city, lat, lon);
    weatherCache.set(cacheKey, { data: fallback, timestamp: now });
    return NextResponse.json(fallback, {
      headers: { "Cache-Control": "public, s-maxage=600", ...corsHeaders(origin) },
    });
  }
}
