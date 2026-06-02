/**
 * /api — KrishiAI Health Check & Info API
 *
 * Returns system status, available endpoints, and feature flags.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "KrishiAI API",
    version: "3.0.0",
    description: "বাংলাদেশের কৃষকদের জন্য AI-চালিত কৃষি প্ল্যাটফর্ম",
    endpoints: {
      "/api/weather": "আবহাওয়া তথ্য — Open-Meteo (hourly, daily, agri indices, alerts)",
      "/api/market": "বাজার মূল্য — DAM live + seasonal (25+ commodities, categories)",
      "/api/news": "কৃষি সংবাদ — Google News RSS + .gov.bd CORS proxy + AI bulletin",
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
      map: {
        leafletInteractive: true,
        satelliteView: true,
        fifteenPlusInstitutions: true,
        userLocation: true,
      },
    },
    timestamp: new Date().toISOString(),
  });
}
