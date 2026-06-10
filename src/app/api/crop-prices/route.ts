/**
 * /api/crop-prices — KrishiAI Crop Prices API
 *
 * Returns current simulated crop prices for Bangladesh based on
 * DAM/DAE reference data. Uses the @/lib/cropPriceService module.
 *
 * Query params:
 *   - crop: Bengali crop name (optional, returns single crop)
 *   - month: 1-12 (optional, defaults to current month)
 *   - compare: "true" to get profitability comparison
 */

import { NextRequest } from "next/server";
import { corsHeaders, corsNextResponse } from "@/lib/cors";
import {
  simulateCurrentPrice,
  getAllCropPrices,
  compareCropProfitability,
  formatPriceBDT,
  getTrendDisplay,
} from "@/lib/cropPriceService";

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

// ── In-memory cache ─────────────────────────────────────────────────────────
let cachedPrices: Record<string, unknown> | null = null;
let cachedPricesAt = 0;
const PRICES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const { searchParams } = new URL(request.url);

  const cropParam = searchParams.get("crop");
  const monthParam = parseInt(searchParams.get("month") || "0");
  const compareParam = searchParams.get("compare") === "true";

  const currentMonth = monthParam >= 1 && monthParam <= 12 ? monthParam : new Date().getMonth() + 1;

  // Check cache (only for full listing, not single crop)
  const now = Date.now();
  if (!cropParam && !compareParam && cachedPrices && now - cachedPricesAt < PRICES_CACHE_TTL) {
    return corsNextResponse(cachedPrices, {
      origin,
      headers: { "Cache-Control": "public, s-maxage=300" },
    });
  }

  try {
    // Single crop price
    if (cropParam) {
      const priceData = simulateCurrentPrice(cropParam, currentMonth);
      if (!priceData) {
      return corsNextResponse(
        { ok: false, error: `"${cropParam}" ফসলের মূল্য তথ্য পাওয়া যায়নি` },
        { status: 404, origin }
      );
      }

      const trend = getTrendDisplay(priceData.trend);

      return corsNextResponse(
        {
          ok: true,
          price: priceData,
          display: {
            priceBDT: formatPriceBDT(priceData.price),
            previousBDT: formatPriceBDT(priceData.previousWeekPrice),
            changeBDT: formatPriceBDT(Math.abs(priceData.priceChange)),
            trendIcon: trend.icon,
            trendLabel: trend.label,
            trendColor: trend.color,
          },
          month: currentMonth,
        },
        { origin }
      );
    }

    // Profitability comparison
    if (compareParam) {
      const profitability = compareCropProfitability(currentMonth);
      return corsNextResponse(
        {
          ok: true,
          profitability,
          month: currentMonth,
        },
        { origin }
      );
    }

    // All crop prices
    const allPrices = getAllCropPrices(currentMonth);

    const result = {
      ok: true,
      isSimulated: true,
      disclaimer: "অনুমানিত মূল্য — DAM লাইভ ডেটা উপলব্ধ নয়। এই মূল্যগুলো মৌসুমী প্যাটার্ন ও ঐতিহাসিক তথ্যের ভিত্তিতে সিমুলেটেড।",
      disclaimerEn: "Estimated prices — DAM live data unavailable. Prices are simulated based on seasonal patterns and historical reference data.",
      prices: allPrices,
      summary: {
        total: allPrices.length,
        trending_up: allPrices.filter((p) => p.trend === "up").length,
        trending_down: allPrices.filter((p) => p.trend === "down").length,
        trending_stable: allPrices.filter((p) => p.trend === "stable").length,
      },
      month: currentMonth,
      lastUpdated: new Date().toISOString().split("T")[0],
    };

    cachedPrices = result;
    cachedPricesAt = now;

    return corsNextResponse(result, {
      origin,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    console.error("[crop-prices] Error:", e);
    return corsNextResponse(
      { ok: false, error: "মূল্য তথ্য লোড করতে সমস্যা হয়েছে" },
      { status: 500, origin }
    );
  }
}
