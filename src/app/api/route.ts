/**
 * /api — KrishiAI Health Check & Info API
 *
 * Returns system status, available endpoints, and feature flags.
 */

import { NextRequest, NextResponse } from "next/server";

// ── CORS ────────────────────────────────────────────────────────────────────
function corsHeaders(origin: string | null) {
  const allowed = !origin || origin.includes("localhost") || origin.includes("127.0.0.1") ||
    ["https://krishiai.live", "https://www.krishiai.live", "https://web.krishiai.live"].includes(origin || "");
  return {
    "Access-Control-Allow-Origin": allowed ? (origin || "*") : "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");

  return NextResponse.json({
    ok: true,
    service: "KrishiAI API",
    version: "3.1.0",
    description: "বাংলাদেশের কৃষকদের জন্য AI-চালিত কৃষি প্ল্যাটফর্ম",
    endpoints: {
      "/api/weather": "আবহাওয়া তথ্য — Open-Meteo (hourly, daily, agri indices, alerts)",
      "/api/market": "বাজার মূল্য — DAM live + seasonal (25+ commodities, categories)",
      "/api/news": "কৃষি সংবাদ — Google News RSS + .gov.bd CORS proxy + AI bulletin",
      "/api/chat": "AI চ্যাট — কৃষি পরামর্শদাতা (POST, messages required)",
    },
    features: {
      weather: {
        currentConditions: true,
        hourlyForecast: true,
        fiveDayForecast: true,
        agriculturalIndices: true,
        weatherAlerts: true,
        cropAdvisory: true,
        sunriseSunset: true,
        uvIndex: true,
      },
      market: {
        livePrices: true,
        seasonalFallback: true,
        categoryFilter: true,
        priceChangePercentage: true,
        twentyFivePlusCommodities: true,
      },
      news: {
        googleNewsRSS: true,
        govBdCORSProxy: true,
        govBdCuratedAdvisories: true,
        aiDailyBulletin: true,
        dateFreshnessFilter: true,
        fourTabs: true,
      },
      chat: {
        bengaliFirst: true,
        agriculturalContext: true,
        dynamicSeasonAwareness: true,
        maxMessages: 20,
        maxMessageLength: 5000,
      },
      map: {
        leafletInteractive: true,
        satelliteView: true,
        fifteenPlusInstitutions: true,
        userLocation: true,
      },
    },
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=60",
      ...corsHeaders(origin),
    },
  });
}
