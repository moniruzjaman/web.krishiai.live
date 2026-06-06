/**
 * MapWidget.tsx — Best-in-Class Interactive Agricultural Map
 *
 * Features:
 * - 15+ BD agricultural institution markers across all divisions
 * - Satellite map toggle (OpenStreetMap + Esri Satellite)
 * - Legend with category colors
 * - District crop zone information
 * - **Live user location tracking via LocationContext**
 * - Locate-me button to re-center on user
 * - Responsive design
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLocation } from "@/context/LocationContext";

const InteractiveMap = dynamic(() => import("./InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-500 text-sm bg-gray-50">
      <span className="animate-spin-slow text-2xl">🕐</span>
      মানচিত্র লোড হচ্ছে…
    </div>
  ),
});

export default function MapWidget() {
  const [mapStyle, setMapStyle] = useState<"street" | "satellite">("street");
  const { location, loading: locLoading, requestLocation } = useLocation();

  // Use live location if available, fallback to Dhaka
  // useMemo prevents new array reference on every render which caused map re-initialization
  const center: [number, number] = useMemo(
    () => location ? [location.lat, location.lon] : [23.8103, 90.4125],
    [location]
  );

  const districtLabel = location?.district || "ঢাকা";

  const handleLocateMe = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[14px] border border-gray-200 dark:border-gray-700 overflow-hidden card-shadow">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80">
        <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
          🗺️ কৃষি মানচিত্র
        </span>
        <span className="ml-auto flex items-center gap-2">
          {/* Map style toggle */}
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-full p-0.5">
            <button
              onClick={() => setMapStyle("street")}
              className={`text-[9px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer border-none ${
                mapStyle === "street"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "bg-transparent text-gray-500 dark:text-gray-400"
              }`}
            >
              মানচিত্র
            </button>
            <button
              onClick={() => setMapStyle("satellite")}
              className={`text-[9px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer border-none ${
                mapStyle === "satellite"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "bg-transparent text-gray-500 dark:text-gray-400"
              }`}
            >
              🛰️ স্যাটেলাইট
            </button>
          </div>
          {/* District badge — shows live district */}
          <span className="text-[9px] bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-full font-bold">
            {locLoading ? "…" : districtLabel}
          </span>
          {/* Locate-me button */}
          <button
            onClick={handleLocateMe}
            className={`w-7 h-7 rounded-full flex items-center justify-center border border-green-300 cursor-pointer transition-all active:scale-90 ${
              locLoading
                ? "bg-green-200 text-green-700"
                : "bg-green-50 text-green-600 hover:bg-green-100"
            }`}
            title="আমার অবস্থান"
            aria-label="Locate me on map"
          >
            {locLoading ? (
              <span className="animate-spin text-[11px]">⟳</span>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
            )}
          </button>
        </span>
      </div>

      {/* Map frame — taller for better visibility on mobile */}
      <div className="w-full h-[300px] sm:h-[360px] lg:h-[420px] relative">
        <InteractiveMap center={center} mapStyle={mapStyle} accuracy={location?.accuracy || 500} onLocateMe={handleLocateMe} />
      </div>

      {/* Legend */}
      <div className="flex gap-3 px-3 py-2 text-[9px] text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
          কৃষি সম্প্রসারণ
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
          গবেষণা ইনস্টিটিউট
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
          কৃষি কর্পোরেশন
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
          আবহাওয়া কেন্দ্র
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
          আপনার অবস্থান
        </span>
      </div>
    </div>
  );
}
