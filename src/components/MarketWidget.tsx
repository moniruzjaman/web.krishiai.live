/**
 * MarketWidget.tsx — Market Price Widget for KrishiAI
 *
 * Horizontal scroll cards showing BD agricultural commodity prices.
 * Uses Bengali numerals, shows price trends.
 */

"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketPrice {
  name: string;
  en: string;
  price: string;
  unit: string;
  trend: string;
  icon: string;
}

interface MarketResponse {
  ok: boolean;
  dateStr: string;
  prices: MarketPrice[];
  source: string;
  note: string;
}

const FALLBACK_PRICES: MarketPrice[] = [
  { name: "মোটা চাল", en: "Coarse Rice", price: "৫৩–৫৫", unit: "kg", trend: "up", icon: "🌾" },
  { name: "মিনিকেট চাল", en: "Fine Rice", price: "৭২–৭৮", unit: "kg", trend: "up", icon: "🍚" },
  { name: "আলু", en: "Potato", price: "২৮–৩৫", unit: "kg", trend: "down", icon: "🥔" },
  { name: "পেঁয়াজ", en: "Onion", price: "৪৫–৫৫", unit: "kg", trend: "up", icon: "🧅" },
  { name: "রসুন", en: "Garlic", price: "১৮০–২২০", unit: "kg", trend: "up", icon: "🧄" },
  { name: "আদা", en: "Ginger", price: "১২০–১৬০", unit: "kg", trend: "up", icon: "🫚" },
  { name: "বেগুন", en: "Eggplant", price: "৫০–৭০", unit: "kg", trend: "up", icon: "🍆" },
  { name: "টমেটো", en: "Tomato", price: "৩০–৪৫", unit: "kg", trend: "down", icon: "🍅" },
  { name: "মুগ ডাল", en: "Mung Lentil", price: "১১০–১৩০", unit: "kg", trend: "flat", icon: "🫘" },
  { name: "ভুট্টা", en: "Corn", price: "৩৫–৪০", unit: "kg", trend: "up", icon: "🌽" },
  { name: "পাট", en: "Jute", price: "২৫০০–৩০০০", unit: "মণ", trend: "up", icon: "🪢" },
  { name: "গম", en: "Wheat", price: "৩৮–৪৫", unit: "kg", trend: "flat", icon: "🌾" },
];

export default function MarketWidget() {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [dateStr, setDateStr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/market")
      .then((r) => r.json())
      .then((d: MarketResponse) => {
        if (d.ok) {
          setPrices(d.prices);
          setDateStr(d.dateStr);
        } else {
          setPrices(FALLBACK_PRICES);
        }
        setLoading(false);
      })
      .catch(() => {
        setPrices(FALLBACK_PRICES);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-[14px] border border-gray-200 p-4 card-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-3 overflow-x-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-[110px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden card-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50/80">
        <div>
          <div className="text-[13px] font-bold text-gray-900">বাজার মূল্য</div>
          <div className="text-[9px] text-gray-500 mt-0.5">
            কৃষি বিপণন অধিদপ্তর (DAM) · ঢাকা
          </div>
        </div>
        <a
          href="https://market.dam.gov.bd/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-semibold text-green-700 no-underline bg-green-50 border border-green-200 rounded-full px-2.5 py-1 whitespace-nowrap"
        >
          dam.gov.bd →
        </a>
      </div>

      {/* Date */}
      {dateStr && (
        <div className="text-[10px] text-green-900 font-bold text-center py-1.5 bg-green-50 border-b border-gray-200">
          {dateStr}
        </div>
      )}

      {/* Price scroll */}
      <div className="scroll-x py-3">
        {prices.map((p, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[110px] bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center gap-1 scroll-snap-align-start transition-all hover:border-green-500 hover:bg-green-50 cursor-default"
          >
            <div className="text-2xl">{p.icon}</div>
            <div className="text-[12px] font-bold text-gray-900 text-center leading-tight">
              {p.name}
            </div>
            <div className="text-[9px] text-gray-400 text-center">{p.en}</div>
            <div className="text-[13px] font-bold text-[#1b4332]">৳ {p.price}</div>
            <div className="text-[9px] text-gray-400">per {p.unit}</div>
            <div
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-center ${
                p.trend === "up"
                  ? "text-red-600 bg-red-50"
                  : p.trend === "down"
                  ? "text-green-600 bg-green-50"
                  : "text-gray-500 bg-gray-100"
              }`}
            >
              {p.trend === "up"
                ? "↑ বাড়ছে"
                : p.trend === "down"
                ? "↓ কমছে"
                : "→ স্থিতিশীল"}
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="text-[9px] text-gray-400 px-4 py-2 text-center border-t border-gray-200">
        ঢাকা বিভাগের পাইকারি গড় মূল্য (৳/kg) · DAM
      </div>
    </div>
  );
}
