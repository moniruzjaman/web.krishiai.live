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

import { NextRequest, NextResponse } from "next/server";
import {
  simulateCurrentPrice,
  getAllCropPrices,
  compareCropProfitability,
  formatPriceBDT,
  getTrendDisplay,
} from "@/lib/cropPriceService";

// ── CORS ────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://krishiai.live",
  "https://www.krishiai.live",
  "https://web.krishiai.live",
];

function corsHeaders(origin: string | null) {
  const allowed =
    !origin ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    ALLOWED_ORIGINS.includes(origin);
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
    return NextResponse.json(cachedPrices, {
      headers: { "Cache-Control": "public, s-maxage=300", ...corsHeaders(origin) },
    });
  }

  try {
    // Single crop price
    if (cropParam) {
      const priceData = simulateCurrentPrice(cropParam, currentMonth);
      if (!priceData) {
        return NextResponse.json(
          { ok: false, error: `"${cropParam}" ফসলের মূল্য তথ্য পাওয়া যায়নি` },
          { status: 404, headers: corsHeaders(origin) }
        );
      }

      const trend = getTrendDisplay(priceData.trend);

      return NextResponse.json(
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
        { headers: corsHeaders(origin) }
      );
    }

    // Profitability comparison
    if (compareParam) {
      const profitability = compareCropProfitability(currentMonth);
      return NextResponse.json(
        {
          ok: true,
          profitability,
          month: currentMonth,
        },
        { headers: corsHeaders(origin) }
      );
    }

    // All crop prices
    const allPrices = getAllCropPrices(currentMonth);

    const result = {
      ok: true,
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

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        ...corsHeaders(origin),
      },
    });
  } catch (e) {
    console.error("[crop-prices] Error:", e);
    return NextResponse.json(
      { ok: false, error: "মূল্য তথ্য লোড করতে সমস্যা হয়েছে" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
