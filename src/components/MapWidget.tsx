/**
 * MapWidget.tsx — Interactive Map for KrishiAI
 *
 * Leaflet map with OpenStreetMap tiles.
 * Shows user location pin, defaults to Dhaka.
 * Uses dynamic import with ssr: false to avoid Leaflet SSR issues.
 */

"use client";

import { useState, useEffect } from "react";
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
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [locLabel, setLocLabel] = useState<string>("ঢাকা");

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        setCoords([p.coords.latitude, p.coords.longitude]);
        setLocLabel("📍 লাইভ লোকেশন");
      },
      () => {
        setCoords([23.8103, 90.4125]);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const center: [number, number] = coords ?? [23.8103, 90.4125];

  return (
    <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden card-shadow">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-gray-50/80">
        <span className="text-[13px] font-bold text-gray-900">
          🗺️ কৃষি মানচিত্র
        </span>
        <span className="ml-auto text-[9px] bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-full font-bold">
          {locLabel}
        </span>
      </div>

      {/* Map frame */}
      <div className="w-full h-[260px] sm:h-[320px] lg:h-[380px] relative">
        <InteractiveMap center={center} />
      </div>

      {/* Legend */}
      <div className="flex gap-3 px-3 py-2 text-[9px] text-gray-500 border-t border-gray-200 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
          DAE · BARC · BADC · MoA
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
          BRRI · BARI · SRDI
        </span>
        {coords && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
            আপনার অবস্থান
          </span>
        )}
      </div>
    </div>
  );
}
