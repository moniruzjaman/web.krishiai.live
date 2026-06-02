/**
 * /api/weather — KrishiAI Weather Proxy API
 *
 * Proxies weather data from Open-Meteo API for Bangladesh locations.
 * No API key needed. Returns current weather + 5-day forecast + agricultural indices.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "23.8103");
  const lon = parseFloat(searchParams.get("lon") || "90.4125");
  const city = searchParams.get("city") || "ঢাকা";

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat.toString());
    url.searchParams.set("longitude", lon.toString());
    url.searchParams.set("current", [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "precipitation",
      "weather_code",
      "soil_moisture_0_to_1cm",
      "soil_temperature_0cm",
      "et0_fao_evapotranspiration",
      "leaf_wetness_probability",
      "growing_degree_days_base_0_limit_50",
    ].join(","));
    url.searchParams.set("daily", [
      "temperature_2m_max",
      "temperature_2m_min",
      "weather_code",
      "et0_fao_evapotranspiration_sum",
      "growing_degree_days_base_0_limit_50",
    ].join(","));
    url.searchParams.set("timezone", "Asia/Dhaka");
    url.searchParams.set("forecast_days", "6");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "KrishiAI/3.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo returned ${response.status}`);
    }

    const data = await response.json();
    const c = data.current;
    const dl = data.daily;

    const DAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];

    const weatherData = {
      ok: true,
      temp: c.temperature_2m,
      feel: c.apparent_temperature,
      humid: c.relative_humidity_2m,
      wind: c.wind_speed_10m,
      rain: c.precipitation,
      code: c.weather_code,
      maxT: dl.temperature_2m_max[0],
      minT: dl.temperature_2m_min[0],
      city,
      lat,
      lon,
      soilMoisture: c.soil_moisture_0_to_1cm,
      soilTemp: c.soil_temperature_0cm,
      et0: c.et0_fao_evapotranspiration,
      leafWetness: c.leaf_wetness_probability,
      gdd: c.growing_degree_days_base_0_limit_50,
      forecast: dl.time.slice(1, 6).map((t: string, i: number) => ({
        day: DAYS[new Date(t).getDay()],
        max: dl.temperature_2m_max[i + 1],
        min: dl.temperature_2m_min[i + 1],
        code: dl.weather_code[i + 1],
      })),
      source: "Open-Meteo · BMD",
    };

    return NextResponse.json(weatherData, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
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
      { status: 502 }
    );
  }
}
