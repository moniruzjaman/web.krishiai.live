/**
 * MarketWidget.tsx — Enhanced Commodity Price Tracker
 *
 * Features:
 * - Category filter tabs (সব, শস্য, সবজি, মসলা, ডাল, অন্যান্য)
 * - Search/filter by Bengali or English name
 * - Price change percentage with color-coded badges
 * - Price trend mini-bar (current vs last week visual)
 * - Last week comparison display
 * - Location-aware (shows user's district from LocationContext)
 * - Expandable list ("আরও দেখুন" / "কম দেখুন")
 * - Error/retry UI for failed fetches
 * - Source indicator (live vs fallback)
 * - Bengali units (প্রতি কেজি, প্রতি মণ)
 * - Auto-refresh every hour
 * - Responsive grid layout with scroll
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useLocation } from "@/context/LocationContext";

// ── Types ────────────────────────────────────────────────────────────────────
interface MarketPrice {
  name: string;
  en: string;
  price: string;
  unit: string;
  trend: string;
  change: string;
  icon: string;
  category: string;
  lastWeek: string;
}

interface MarketResponse {
  ok: boolean;
  dateStr: string;
  prices: MarketPrice[];
  source: string;
  note: string;
}

const FALLBACK_PRICES: MarketPrice[] = [
  { name: "মোটা চাল", en: "Coarse Rice", price: "৫৩–৫৫", unit: "kg", trend: "up", change: "+২.১%", icon: "🌾", category: "শস্য", lastWeek: "৫১–৫৩" },
  { name: "মিনিকেট চাল", en: "Miniket Rice", price: "৭২–৭৮", unit: "kg", trend: "up", change: "+১.৮%", icon: "🍚", category: "শস্য", lastWeek: "৭০–৭৬" },
  { name: "আলু", en: "Potato", price: "২৮–৩৫", unit: "kg", trend: "down", change: "-৪.৫%", icon: "🥔", category: "সবজি", lastWeek: "৩০–৩৮" },
  { name: "পেঁয়াজ", en: "Onion", price: "৪৫–৫৫", unit: "kg", trend: "up", change: "+৫.৩%", icon: "🧅", category: "সবজি", lastWeek: "৪২–৫০" },
  { name: "রসুন", en: "Garlic", price: "১৮০–২২০", unit: "kg", trend: "up", change: "+৪.২%", icon: "🧄", category: "মসলা", lastWeek: "১৭০–২১০" },
  { name: "আদা", en: "Ginger", price: "১২০–১৬০", unit: "kg", trend: "up", change: "+৩.৫%", icon: "🫚", category: "মসলা", lastWeek: "১১৫–১৫০" },
  { name: "টমেটো", en: "Tomato", price: "৩০–৪৫", unit: "kg", trend: "down", change: "-৬.১%", icon: "🍅", category: "সবজি", lastWeek: "৩৫–৫০" },
  { name: "মুগ ডাল", en: "Mung Lentil", price: "১১০–১৩০", unit: "kg", trend: "flat", change: "+০.৩%", icon: "🫘", category: "ডাল", lastWeek: "১১০–১২৮" },
  { name: "ভুট্টা", en: "Corn", price: "৩৫–৪০", unit: "kg", trend: "up", change: "+৩.২%", icon: "🌽", category: "শস্য", lastWeek: "৩৩–৩৮" },
  { name: "পাট", en: "Jute", price: "২৫০০–৩০০০", unit: "মণ", trend: "up", change: "+২.৫%", icon: "🪢", category: "অন্যান্য", lastWeek: "২৪০০–২৯০০" },
  { name: "গম", en: "Wheat", price: "৩৮–৪৫", unit: "kg", trend: "flat", change: "+০.৫%", icon: "🌾", category: "শস্য", lastWeek: "৩৮–৪৪" },
  { name: "মরিচ", en: "Chili", price: "১২০–১৮০", unit: "kg", trend: "up", change: "+৬.১%", icon: "🌶️", category: "মসলা", lastWeek: "১১০–১৬৫" },
];

// ── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "সব", label: "সব", icon: "📊" },
  { key: "শস্য", label: "শস্য", icon: "🌾" },
  { key: "সবজি", label: "সবজি", icon: "🥬" },
  { key: "মসলা", label: "মসলা", icon: "🌶️" },
  { key: "ডাল", label: "ডাল", icon: "🫘" },
  { key: "অন্যান্য", label: "অন্যান্য", icon: "📦" },
];

// ── Bengali unit helper ─────────────────────────────────────────────────────
const unitLabel = (u: string) => {
  if (u === "kg") return "প্রতি কেজি";
  if (u === "মণ") return "প্রতি মণ";
  if (u === "পিস") return "প্রতি পিস";
  return u;
};

// ── Bengali digit parser ────────────────────────────────────────────────────
const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";
const BENGALI_RANGE_DASHES = ["–", "—", "-"];

function parseBengaliNumber(s: string): number {
  let result = "";
  for (const ch of s.trim()) {
    const idx = BENGALI_DIGITS.indexOf(ch);
    if (idx >= 0) {
      result += idx;
    } else if (ch >= "0" && ch <= "9") {
      result += ch;
    }
  }
  return result ? Number(result) : 0;
}

/** Parse a Bengali price range like "৫৩–৫৫" or "২৫০০–৩০০০" → { min, max } */
function parsePriceRange(range: string): { min: number; max: number } | null {
  for (const dash of BENGALI_RANGE_DASHES) {
    if (range.includes(dash)) {
      const parts = range.split(dash);
      if (parts.length === 2) {
        const min = parseBengaliNumber(parts[0]);
        const max = parseBengaliNumber(parts[1]);
        if (min > 0 && max > 0) return { min, max };
      }
    }
  }
  // Single price (no range)
  const val = parseBengaliNumber(range);
  if (val > 0) return { min: val, max: val };
  return null;
}

/** Default number of items to show before expanding */
const DEFAULT_VISIBLE_COUNT = 6;

// ── Price Trend Mini-Bar ────────────────────────────────────────────────────
function PriceTrendBar({ current, lastWeek }: { current: string; lastWeek: string }) {
  const currentRange = parsePriceRange(current);
  const lastWeekRange = parsePriceRange(lastWeek);

  if (!currentRange || !lastWeekRange) return null;

  // Calculate midpoints
  const currentMid = (currentRange.min + currentRange.max) / 2;
  const lastWeekMid = (lastWeekRange.min + lastWeekRange.max) / 2;

  // The bar spans from the lower bound to the upper bound of both ranges
  const overallMin = Math.min(currentRange.min, lastWeekRange.min);
  const overallMax = Math.max(currentRange.max, lastWeekRange.max);
  const span = overallMax - overallMin || 1; // avoid division by zero

  // Positions as percentages
  const lastWeekStart = ((lastWeekRange.min - overallMin) / span) * 100;
  const lastWeekWidth = ((lastWeekRange.max - lastWeekRange.min) / span) * 100;
  const currentStart = ((currentRange.min - overallMin) / span) * 100;
  const currentWidth = ((currentRange.max - currentRange.min) / span) * 100;
  const currentMidPos = ((currentMid - overallMin) / span) * 100;

  // Color based on trend
  const isUp = currentMid > lastWeekMid;
  const isDown = currentMid < lastWeekMid;

  return (
    <div className="w-full mt-1">
      <div className="relative h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        {/* Last week range (background bar) */}
        <div
          className="absolute top-0 h-full bg-gray-300 rounded-full opacity-60"
          style={{ left: `${lastWeekStart}%`, width: `${Math.max(lastWeekWidth, 2)}%` }}
        />
        {/* Current range (foreground bar) */}
        <div
          className={`absolute top-0 h-full rounded-full ${
            isUp ? "bg-red-400" : isDown ? "bg-green-500" : "bg-gray-400"
          }`}
          style={{ left: `${currentStart}%`, width: `${Math.max(currentWidth, 2)}%` }}
        />
        {/* Current midpoint marker */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-white ${
            isUp ? "bg-red-600" : isDown ? "bg-green-700" : "bg-gray-600"
          }`}
          style={{ left: `calc(${currentMidPos}% - 3px)` }}
        />
      </div>
      <div className="flex justify-between text-[6px] text-gray-400 mt-0.5">
        <span>গত সপ্তাহ</span>
        <span>বর্তমান</span>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function MarketWidget() {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [dateStr, setDateStr] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState("সব");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  // Location context
  const { location } = useLocation();
  const locationName = location?.district || "ঢাকা";

  const fetchMarket = useCallback(async () => {
    setError(false);
    try {
      const districtParam = locationName !== "ঢাকা" ? `?district=${encodeURIComponent(locationName)}` : "";
      const r = await fetch(`/api/market${districtParam}`);
      const d: MarketResponse = await r.json();
      if (d.ok) {
        setPrices(d.prices);
        setDateStr(d.dateStr);
        setSource(d.source);
        setIsFallback(d.source.includes("মৌসুমী") || d.source.includes("মৌসুমি"));
        setLastUpdated(new Date());
      } else {
        setPrices(FALLBACK_PRICES);
        setIsFallback(true);
        setError(true);
      }
    } catch {
      setPrices(FALLBACK_PRICES);
      setIsFallback(true);
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial fetch — calling setState in effect is intentional for data loading
    void fetchMarket(); // eslint-disable-line react-hooks/set-state-in-effect

    // Auto-refresh every hour
    const interval = setInterval(fetchMarket, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMarket]);

  // Filter by category and search query
  const filtered = useMemo(() => {
    let result = category === "সব" ? prices : prices.filter(p => p.category === category);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || p.en.toLowerCase().includes(q)
      );
    }
    return result;
  }, [prices, category, searchQuery]);

  // Visible items (limited unless expanded)
  const visibleItems = expanded ? filtered : filtered.slice(0, DEFAULT_VISIBLE_COUNT);
  const hasMore = filtered.length > DEFAULT_VISIBLE_COUNT;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-[14px] border border-gray-200 dark:border-gray-700 p-4 card-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error && prices.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-[14px] border border-red-200 dark:border-red-800 p-4 text-center card-shadow">
        <div className="text-lg mb-2">⚠️</div>
        <div className="text-sm text-red-600 font-semibold mb-2">
          বাজার মূল্য লোড হয়নি
        </div>
        <button
          onClick={fetchMarket}
          className="text-[11px] font-bold bg-red-100 text-red-600 px-4 py-1.5 rounded-full border-none cursor-pointer hover:bg-red-200 transition-colors"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[14px] border border-gray-200 dark:border-gray-700 overflow-hidden card-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80">
        <div>
          <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
            <span>💰 বাজার মূল্য</span>
            <span className="text-[9px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5 inline-flex items-center gap-0.5">
              📍 {locationName}
            </span>
          </div>
          <div className="text-[9px] text-gray-500 mt-0.5 flex items-center gap-1.5">
            <span>{source || `কৃষি বিপণন অধিদপ্তর (DAM) · ${locationName}`}</span>
            {isFallback && (
              <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                মৌসুমী তথ্য
              </span>
            )}
          </div>
        </div>
        <a
          href="https://market.dam.gov.bd/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-semibold text-green-700 no-underline bg-green-50 border border-green-200 rounded-full px-2.5 py-1 whitespace-nowrap hover:bg-green-100 transition-colors"
        >
          dam.gov.bd →
        </a>
      </div>

      {/* Date */}
      {dateStr && (
        <div className="text-[10px] text-green-900 font-bold text-center py-1.5 bg-green-50 border-b border-gray-200">
          📅 {dateStr}
        </div>
      )}

      {/* Search Input */}
      <div className="px-3 pt-2 pb-1 border-b border-gray-100">
        <div className="relative">
          <svg
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Input
            type="text"
            placeholder="পণ্য খুঁজুন..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Reset expanded when search changes
              setExpanded(false);
            }}
            className="h-7 text-[11px] pl-7 pr-3 py-0 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-lg focus:border-green-400 focus:ring-green-400/20 placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0 leading-none text-[12px]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-gray-100 overflow-x-auto scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => {
              setCategory(cat.key);
              setExpanded(false);
            }}
            className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
              category === cat.key
                ? "bg-green-600 text-white border-green-600"
                : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-300 hover:bg-green-50"
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Price Grid */}
      <div className="p-3">
        {filtered.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-lg mb-1">🔍</div>
            <div className="text-[11px] text-gray-500">কোনো পণ্য পাওয়া যায়নি</div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[10px] font-bold text-green-600 mt-1 bg-transparent border-none cursor-pointer hover:underline"
              >
                সার্চ মুছুন
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {visibleItems.map((p, i) => (
                <div
                  key={`${p.name}-${i}`}
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-2.5 flex flex-col items-center gap-1 transition-all hover:border-green-400 hover:bg-green-50 cursor-default hover:shadow-sm"
                >
                  <div className="text-xl">{p.icon}</div>
                  <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100 text-center leading-tight">
                    {p.name}
                  </div>
                  <div className="text-[8px] text-gray-400 text-center">{p.en}</div>
                  <div className="text-[13px] font-bold text-[#1b4332] dark:text-green-400">৳{p.price}</div>
                  <div className="text-[8px] text-gray-400">{unitLabel(p.unit)}</div>
                  {/* Trend + Change */}
                  <div
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full text-center ${
                      p.trend === "up"
                        ? "text-red-600 bg-red-50"
                        : p.trend === "down"
                        ? "text-green-600 bg-green-50"
                        : "text-gray-500 bg-gray-100"
                    }`}
                  >
                    {p.trend === "up"
                      ? `↑ ${p.change}`
                      : p.trend === "down"
                      ? `↓ ${p.change}`
                      : `→ স্থিতিশীল`}
                  </div>
                  {/* Price Trend Mini-Bar */}
                  {p.lastWeek && (
                    <PriceTrendBar current={p.price} lastWeek={p.lastWeek} />
                  )}
                  {/* Last week comparison */}
                  {p.lastWeek && (
                    <div className="text-[7px] text-gray-400 text-center mt-0.5">
                      গত সপ্তাহ: ৳{p.lastWeek}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Expand / Collapse Button */}
            {hasMore && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-full px-4 py-1.5 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors inline-flex items-center gap-1"
                >
                  {expanded ? (
                    <>
                      <span>কম দেখুন</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>আরও দেখুন</span>
                      <span className="text-[9px] text-green-600 bg-green-100 rounded-full px-1.5 py-0.5">
                        +{filtered.length - DEFAULT_VISIBLE_COUNT}
                      </span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-[9px] text-gray-400 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <span>{locationName}-এর পাইকারি গড় মূল্য (৳)</span>
        <span className="flex items-center gap-2">
          {lastUpdated && `আপডেট: ${lastUpdated.toLocaleTimeString("bn-BD")}`}
          <button
            onClick={() => fetchMarket()}
            className="text-green-600 hover:text-green-700 font-bold cursor-pointer bg-transparent border-none p-0"
            title="রিফ্রেশ"
          >
            🔄
          </button>
        </span>
      </div>
    </div>
  );
}
