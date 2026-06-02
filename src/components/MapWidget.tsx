/**
 * MapWidget.tsx — Best-in-Class Interactive Agricultural Map
 *
 * Features:
 * - 15+ BD agricultural institution markers across all divisions
 * - Satellite map toggle (OpenStreetMap + Esri Satellite)
 * - Legend with category colors
 * - District crop zone information
 * - User location tracking
 * - Responsive design
 */

"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

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

  const center: [number, number] = [23.8103, 90.4125];

  return (
    <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden card-shadow">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-gray-50/80">
        <span className="text-[13px] font-bold text-gray-900">
          🗺️ কৃষি মানচিত্র
        </span>
        <span className="ml-auto flex items-center gap-2">
          {/* Map style toggle */}
          <div className="flex bg-gray-200 rounded-full p-0.5">
            <button
              onClick={() => setMapStyle("street")}
              className={`text-[9px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer border-none ${
                mapStyle === "street"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "bg-transparent text-gray-500"
              }`}
            >
              মানচিত্র
            </button>
            <button
              onClick={() => setMapStyle("satellite")}
              className={`text-[9px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer border-none ${
                mapStyle === "satellite"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "bg-transparent text-gray-500"
              }`}
            >
              🛰️ স্যাটেলাইট
            </button>
          </div>
          <span className="text-[9px] bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-full font-bold">
            ঢাকা
          </span>
        </span>
      </div>

      {/* Map frame */}
      <div className="w-full h-[260px] sm:h-[320px] lg:h-[380px] relative">
        <InteractiveMap center={center} mapStyle={mapStyle} />
      </div>

      {/* Legend */}
      <div className="flex gap-3 px-3 py-2 text-[9px] text-gray-500 border-t border-gray-200 flex-wrap">
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
