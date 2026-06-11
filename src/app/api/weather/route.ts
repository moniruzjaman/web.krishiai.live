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

function isAllowedOrigin(origin: string | null): origin is string {
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

// ── Bengali digit converter ──────────────────────────────────────────────────
const bn2 = (n: number | string) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

// ── English → Bengali city name mapping ────────────────────────────────────
const CITY_BN: Record<string, string> = {
  "Dhaka": "ঢাকা", "dhaka": "ঢাকা",
  "Gazipur": "গাজীপুর", "gazipur": "গাজীপুর",
  "Narayanganj": "নারায়ণগঞ্জ", "narayanganj": "নারায়ণগঞ্জ",
  "Munshiganj": "মুন্সীগঞ্জ", "munshiganj": "মুন্সীগঞ্জ",
  "Manikganj": "মানিকগঞ্জ", "manikganj": "মানিকগঞ্জ",
  "Faridpur": "ফরিদপুর", "faridpur": "ফরিদপুর",
  "Rajshahi": "রাজশাহী", "rajshahi": "রাজশাহী",
  "Natore": "নাটোর", "natore": "নাটোর",
  "Pabna": "পাবনা", "pabna": "পাবনা",
  "Bogra": "বগুড়া", "bogra": "বগুড়া", "Bogura": "বগুড়া", "bogura": "বগুড়া",
  "Dinajpur": "দিনাজপুর", "dinajpur": "দিনাজপুর",
  "Rangpur": "রংপুর", "rangpur": "রংপুর",
  "Kurigram": "কুড়িগ্রাম", "kurigram": "কুড়িগ্রাম",
  "Jessore": "যশোর", "jessore": "যশোর", "Jashore": "যশোর", "jashore": "যশোর",
  "Khulna": "খুলনা", "khulna": "খুলনা",
  "Chittagong": "চট্টগ্রাম", "chittagong": "চট্টগ্রাম", "Chattogram": "চট্টগ্রাম", "chattogram": "চট্টগ্রাম",
  "Cox's Bazar": "কক্সবাজার", "cox's bazar": "কক্সবাজার", "Coxs Bazar": "কক্সবাজার",
  "Sylhet": "সিলেট", "sylhet": "সিলেট",
  "Mymensingh": "ময়মনসিংহ", "mymensingh": "ময়মনসিংহ",
  "Tangail": "টাঙ্গাইল", "tangail": "টাঙ্গাইল",
  "Comilla": "কুমিল্লা", "comilla": "কুমিল্লা", "Cumilla": "কুমিল্লা", "cumilla": "কুমিল্লা",
  "Barisal": "বরিশাল", "barisal": "বরিশাল",
  "Noakhali": "নোয়াখালী", "noakhali": "নোয়াখালী",
  "Lakshmipur": "লক্ষ্মীপুর", "lakshmipur": "লক্ষ্মীপুর",
  "Jamalpur": "জামালপুর", "jamalpur": "জামালপুর",
  "Sherpur": "শেরপুর", "sherpur": "শেরপুর",
  "Kishoreganj": "কিশোরগঞ্জ", "kishoreganj": "কিশোরগঞ্জ",
  "Narsingdi": "নরসিংদী", "narsingdi": "নরসিংদী",
  "Brahmanbaria": "ব্রাহ্মণবাড়িয়া", "brahmanbaria": "ব্রাহ্মণবাড়িয়া",
  "Chandpur": "চাঁদপুর", "chandpur": "চাঁদপুর",
  "Feni": "ফেনী", "feni": "ফেনী",
  "Satkhira": "সাতক্ষীরা", "satkhira": "সাতক্ষীরা",
  "Kushtia": "কুষ্টিয়া", "kushtia": "কুষ্টিয়া",
  "Jhenaidah": "ঝিনাইদহ", "jhenaidah": "ঝিনাইদহ",
  "Magura": "মাগুরা", "magura": "মাগুরা",
  "Chuadanga": "চুয়াডাঙ্গা", "chuadanga": "চুয়াডাঙ্গা",
  "Meherpur": "মেহেরপুর", "meherpur": "মেহেরপুর",
  "Naogaon": "নওগাঁ", "naogaon": "নওগাঁ",
  "Chapainawabganj": "চাঁপাইনবাবগঞ্জ", "chapainawabganj": "চাঁপাইনবাবগঞ্জ",
  "Joypurhat": "জয়পুরহাট", "joypurhat": "জয়পুরহাট",
  "Thakurgaon": "ঠাকুরগাঁও", "thakurgaon": "ঠাকুরগাঁও",
  "Panchagarh": "পঞ্চগড়", "panchagarh": "পঞ্চগড়",
  "Lalmonirhat": "লালমনিরহাট", "lalmonirhat": "লালমনিরহাট",
  "Nilphamari": "নীলফামারী", "nilphamari": "নীলফামারী",
  "Gaibandha": "গাইবান্ধা", "gaibandha": "গাইবান্ধা",
  "Netrokona": "নেত্রকোণা", "netrokona": "নেত্রকোণা",
  "Habiganj": "হবিগঞ্জ", "habiganj": "হবিগঞ্জ",
  "Moulvibazar": "মৌলভীবাজার", "moulvibazar": "মৌলভীবাজার", "Moulavi Bazar": "মৌলভীবাজার",
  "Sunamganj": "সুনামগঞ্জ", "sunamganj": "সুনামগঞ্জ",
  "Patuakhali": "পটুয়াখালী", "patuakhali": "পটুয়াখালী",
  "Barguna": "বরগুনা", "barguna": "বরগুনা",
  "Bhola": "ভোলা", "bhola": "ভোলা",
  "Jhalokati": "ঝালকাঠি", "jhalokati": "ঝালকাঠি",
  "Pirojpur": "পিরোজপুর", "pirojpur": "পিরোজপুর",
  "Gopalganj": "গোপালগঞ্জ", "gopalganj": "গোপালগঞ্জ",
  "Madaripur": "মাদারীপুর", "madaripur": "মাদারীপুর",
  "Shariatpur": "শরীয়তপুর", "shariatpur": "শরীয়তপুর",
  "Rajbari": "রাজবাড়ী", "rajbari": "রাজবাড়ী",
  "Bandarban": "বান্দরবান", "bandarban": "বান্দরবান",
  "Rangamati": "রাঙ্গামাটি", "rangamati": "রাঙ্গামাটি",
  "Khagrachhari": "খাগড়াছড়ি", "khagrachhari": "খাগড়াছড়ি",
};

/** Transliterate English city names to Bengali if needed */
function ensureBengaliCity(city: string): string {
  if (!city) return "ঢাকা";
  // Already contains Bengali characters
  if (/[\u0980-\u09FF]/.test(city)) return city;
  // Try direct lookup
  if (CITY_BN[city]) return CITY_BN[city];
  // Try case-insensitive partial match
  const lower = city.toLowerCase();
  for (const [eng, bn] of Object.entries(CITY_BN)) {
    if (lower.includes(eng.toLowerCase()) || eng.toLowerCase().includes(lower)) {
      return bn;
    }
  }
  return city; // Return as-is if no match found
}

// ── Seasonal Fallback Data ──────────────────────────────────────────────────
function getSeasonalFallback(lat: number, lon: number, city: string) {
  const month = new Date().getMonth() + 1;
  const bnCity = ensureBengaliCity(city);
  const DAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];

  // Estimate temperature based on Bangladesh seasonal patterns and latitude
  const isNorthern = lat > 25;
  const isCoastal = lon > 91.5;

  let baseTemp: number, baseHumid: number, baseRain: number;
  let weatherCode: number;
  let seasonBn: string;

  if (month >= 6 && month <= 9) {
    // Monsoon (বর্ষা)
    baseTemp = isNorthern ? 29 : 31;
    baseHumid = 85;
    baseRain = 15;
    weatherCode = 61; // Light rain
    seasonBn = "বর্ষা মৌসুম";
  } else if (month >= 3 && month <= 5) {
    // Pre-monsoon (গ্রীষ্ম)
    baseTemp = isNorthern ? 33 : 35;
    baseHumid = 70;
    baseRain = 5;
    weatherCode = 2; // Partly cloudy
    seasonBn = "গ্রীষ্ম মৌসুম";
  } else if (month >= 10 && month <= 11) {
    // Post-monsoon (হেমন্ত)
    baseTemp = isNorthern ? 27 : 29;
    baseHumid = 75;
    baseRain = 3;
    weatherCode = 1; // Mostly clear
    seasonBn = "হেমন্ত মৌসুম";
  } else {
    // Winter (শীত)
    baseTemp = isNorthern ? 17 : 21;
    baseHumid = 65;
    baseRain = 1;
    weatherCode = 0; // Clear
    seasonBn = "শীত মৌসুম";
  }

  if (isCoastal) {
    baseHumid = Math.min(baseHumid + 10, 95);
    baseRain = Math.max(baseRain, 3);
  }

  const advisory = generateAgriAdvisory(weatherCode, baseTemp, baseHumid, baseRain, 10, undefined, undefined, month);

  const today = new Date();
  const forecast = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i + 1);
    const dayVariation = (i + 1) * 0.5 - 1;
    return {
      day: DAYS[d.getDay()],
      max: Math.round(baseTemp + 4 + dayVariation),
      min: Math.round(baseTemp - 5 + dayVariation),
      code: weatherCode,
      precipProb: month >= 6 && month <= 9 ? Math.min(70 + i * 5, 90) : Math.min(20 + i * 5, 40),
      precipSum: month >= 6 && month <= 9 ? Math.round(5 + i * 2) : Math.round(Math.random() * 2),
      windMax: Math.round(10 + Math.random() * 10),
    };
  });

  return {
    ok: true,
    temp: baseTemp,
    feel: baseTemp + 2,
    humid: baseHumid,
    wind: 10,
    windDir: 180,
    rain: baseRain,
    code: weatherCode,
    maxT: baseTemp + 4,
    minT: baseTemp - 5,
    city: bnCity,
    lat,
    lon,
    uvIndex: month >= 3 && month <= 9 ? 7 : 4,
    dewPoint: baseTemp - 8,
    pressure: 1010,
    cloudCover: month >= 6 && month <= 9 ? 75 : 30,
    soilMoisture: 0.35,
    soilMoistureDeep: 0.40,
    soilTemp: baseTemp - 2,
    et0: 3.5,
    leafWetness: month >= 6 && month <= 9 ? 60 : 20,
    gdd: 15,
    sunrise: "৬:০৫ AM",
    sunset: "৬:০৫ PM",
    uvMax: month >= 3 && month <= 9 ? 9 : 5,
    forecast,
    hourly: [],
    alerts: [],
    advisory,
    source: `মৌসুমী পূর্বাভাস · ${seasonBn}`,
  };
}

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

  // Ensure city name is in Bengali
  const bnCity = ensureBengaliCity(city);

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
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo returned ${response.status}`);
    }

    const data = await response.json();

    // Validate that Open-Meteo returned the expected data structure
    if (!data.current || !data.daily) {
      throw new Error("Open-Meteo returned incomplete data");
    }

    const c = data.current;
    const dl = data.daily;
    const hr = data.hourly || { time: [], temperature_2m: [], weather_code: [], precipitation_probability: [], wind_speed_10m: [] };

    const DAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];

    // Build hourly forecast (next 24 hours from now)
    const now = new Date();
    const currentHourIndex = hr.time.findIndex((t: string) => new Date(t) >= now);
    const end = Math.min(currentHourIndex + 24, hr.time.length, hr.temperature_2m?.length ?? 0, hr.weather_code?.length ?? 0, hr.precipitation_probability?.length ?? 0, hr.wind_speed_10m?.length ?? 0);
    const hourlyForecast: HourlyForecast[] = [];
    if (currentHourIndex >= 0) {
      for (let i = currentHourIndex; i < end; i++) {
        const t = new Date(hr.time[i]);
        hourlyForecast.push({
          time: `${bn2(t.getHours().toString().padStart(2, "0"))}:০০`,
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
      maxT: dl.temperature_2m_max?.[0] ?? 0,
      minT: dl.temperature_2m_min?.[0] ?? 0,
      city: bnCity,
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
      sunrise: dl.sunrise?.[0] ? formatTime(dl.sunrise[0]) : "৬:০৫ AM",
      sunset: dl.sunset?.[0] ? formatTime(dl.sunset[0]) : "৬:০৫ PM",
      uvMax: dl.uv_index_max?.[0] ?? 0,
      // 5-day forecast (with precip probability)
      forecast: dl.time?.slice(1, 6).map((t: string, i: number) => ({
        day: DAYS[new Date(t).getDay()],
        max: dl.temperature_2m_max?.[i + 1] ?? 0,
        min: dl.temperature_2m_min?.[i + 1] ?? 0,
        code: dl.weather_code?.[i + 1] ?? 0,
        precipProb: dl.precipitation_probability_max?.[i + 1] ?? 0,
        precipSum: dl.precipitation_sum?.[i + 1] ?? 0,
        windMax: dl.wind_speed_10m_max?.[i + 1] ?? 0,
      })) ?? [],
      // Hourly forecast (next 24h)
      hourly: hourlyForecast,
      // Alerts
      alerts,
      // Agricultural advisory
      advisory,
      source: "Open-Meteo · BMD",
    };

    return NextResponse.json(weatherData, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
        ...corsHeaders(origin),
      },
    });
  } catch (e) {
    console.error("[weather] API error, using seasonal fallback:", e);
    // Return seasonal fallback instead of error — ensures weather always shows
    const fallback = getSeasonalFallback(lat, lon, city);
    return NextResponse.json(fallback, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        ...corsHeaders(origin),
      },
    });
  }
}
