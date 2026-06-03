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

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

function corsHeaders(origin: string | null) {
  const accessControl = isAllowedOrigin(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": accessControl,
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

// ── Main Handler ─────────────────────────────────────────────────────────────
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
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
      "soil_moisture_0_to_1cm",
      "soil_moisture_1_to_3cm",
      "soil_temperature_0cm",
      "et0_fao_evapotranspiration",
      "leaf_wetness_probability",
      "growing_degree_days_base_0_limit_50",
      "uv_index",
      "dew_point_2m",
      "surface_pressure",
      "cloud_cover",
    ].join(","));
    url.searchParams.set("daily", [
      "temperature_2m_max",
      "temperature_2m_min",
      "weather_code",
      "et0_fao_evapotranspiration_sum",
      "growing_degree_days_base_0_limit_50",
      "precipitation_probability_max",
      "precipitation_sum",
      "sunrise",
      "sunset",
      "uv_index_max",
      "wind_speed_10m_max",
    ].join(","));
    url.searchParams.set("hourly", [
      "temperature_2m",
      "weather_code",
      "precipitation_probability",
      "wind_speed_10m",
    ].join(","));
    url.searchParams.set("timezone", "Asia/Dhaka");
    url.searchParams.set("forecast_days", "6");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "KrishiAI/3.0" },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo returned ${response.status}`);
    }

    const data = await response.json();
    const c = data.current;
    const dl = data.daily;
    const hr = data.hourly;

    const DAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];

    // Build hourly forecast (next 24 hours from now)
    const now = new Date();
    const currentHourIndex = hr.time.findIndex((t: string) => new Date(t) >= now);
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
      c.soil_moisture_0_to_1cm,
      c.et0_fao_evapotranspiration,
      month
    );

    // Calculate sunrise/sunset in Bengali
    const formatTime = (isoStr: string) => {
      const d = new Date(isoStr);
      const h = d.getHours();
      const m = d.getMinutes();
      const period = h >= 12 ? "PM" : "AM";
      const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const bn2 = (n: number) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
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
      // Agricultural indices
      soilMoisture: c.soil_moisture_0_to_1cm,
      soilMoistureDeep: c.soil_moisture_1_to_3cm,
      soilTemp: c.soil_temperature_0cm,
      et0: c.et0_fao_evapotranspiration,
      leafWetness: c.leaf_wetness_probability,
      gdd: c.growing_degree_days_base_0_limit_50,
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

    const origin2 = request.headers.get("origin");

    return NextResponse.json(weatherData, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
        ...corsHeaders(origin),
      },
    });
  } catch (e) {
    console.error("[weather] Error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: "আবহাওয়া তথ্য লোড হয়নি",
        city,
      },
      { status: 502, headers: corsHeaders(request.headers.get("origin")) }
    );
  }
}
