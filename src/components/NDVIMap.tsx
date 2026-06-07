/**
 * NDVIMap.tsx — Leaflet Map with simulated NDVI overlay for Bangladesh
 *
 * Features:
 * - Color-coded NDVI regions across Bangladesh
 * - User location marker with pulse animation
 * - NDVI legend overlay
 * - Dynamic import compatible (SSR: false)
 */

"use client";

import { useEffect, useRef } from "react";

interface NDVIMapProps {
  center: [number, number];
  ndviValue: number;
}

// ── Bangladesh district-level NDVI simulation data ─────────────────────────
// These regions represent major agricultural zones with varying NDVI values
const NDVI_REGIONS = [
  // Dhaka & Central
  { lat: 23.81, lng: 90.41, radius: 25000, name: "ঢাকা", ndviBase: 0.45 },
  { lat: 24.15, lng: 90.40, radius: 20000, name: "গাজীপুর", ndviBase: 0.55 },
  { lat: 24.00, lng: 90.42, radius: 18000, name: "মানিকগঞ্জ", ndviBase: 0.58 },
  // Rajshahi & Northern
  { lat: 24.37, lng: 88.60, radius: 30000, name: "রাজশাহী", ndviBase: 0.42 },
  { lat: 24.85, lng: 88.93, radius: 22000, name: "বগুড়া", ndviBase: 0.60 },
  { lat: 25.75, lng: 89.27, radius: 28000, name: "রংপুর", ndviBase: 0.62 },
  { lat: 25.63, lng: 88.64, radius: 20000, name: "দিনাজপুর", ndviBase: 0.55 },
  // Khulna & Southwest
  { lat: 22.85, lng: 89.54, radius: 28000, name: "খুলনা", ndviBase: 0.35 },
  { lat: 23.17, lng: 89.20, radius: 20000, name: "যশোর", ndviBase: 0.52 },
  { lat: 22.70, lng: 89.25, radius: 18000, name: "সাতক্ষীরা", ndviBase: 0.38 },
  // Chattogram & SE
  { lat: 22.36, lng: 91.78, radius: 25000, name: "চট্টগ্রাম", ndviBase: 0.50 },
  { lat: 21.43, lng: 91.98, radius: 20000, name: "কক্সবাজার", ndviBase: 0.48 },
  { lat: 22.97, lng: 91.35, radius: 18000, name: "কুমিল্লা", ndviBase: 0.55 },
  // Sylhet & NE
  { lat: 24.89, lng: 91.87, radius: 25000, name: "সিলেট", ndviBase: 0.58 },
  { lat: 24.30, lng: 91.73, radius: 18000, name: "মৌলভীবাজার", ndviBase: 0.52 },
  // Barishal & South
  { lat: 22.70, lng: 90.35, radius: 25000, name: "বরিশাল", ndviBase: 0.40 },
  { lat: 22.35, lng: 90.33, radius: 20000, name: "পটুয়াখালী", ndviBase: 0.38 },
  // Mymensingh
  { lat: 24.75, lng: 90.42, radius: 25000, name: "ময়মনসিংহ", ndviBase: 0.60 },
  // Faridpur region
  { lat: 23.60, lng: 89.84, radius: 20000, name: "ফরিদপুর", ndviBase: 0.50 },
  // Tangail
  { lat: 24.25, lng: 89.92, radius: 18000, name: "টাঙ্গাইল", ndviBase: 0.57 },
];

function getSeasonalNDVIBase(ndviBase: number): number {
  const month = new Date().getMonth() + 1;
  let seasonalFactor = 0;

  // Bangladesh seasonal NDVI patterns
  if (month >= 1 && month <= 4) seasonalFactor = 0.15; // Boro season - high
  else if (month >= 5 && month <= 6) seasonalFactor = 0.0; // Transition
  else if (month >= 7 && month <= 8) seasonalFactor = 0.05; // Aus season
  else if (month >= 9 && month <= 11) seasonalFactor = 0.10; // Aman season
  else seasonalFactor = -0.15; // Fallow/December

  return Math.max(0.1, Math.min(0.95, ndviBase + seasonalFactor));
}

function ndviToColor(ndvi: number): string {
  if (ndvi < 0.2) return "#8B4513"; // Bare soil - brown
  if (ndvi < 0.35) return "#DAA520"; // Sparse - goldenrod
  if (ndvi < 0.5) return "#F4D03F"; // Low vegetation - yellow
  if (ndvi < 0.65) return "#7CCD7C"; // Moderate - light green
  if (ndvi < 0.8) return "#32CD32"; // Good vegetation - green
  return "#006400"; // Dense vegetation - dark green
}

export default function NDVIMap({ center, ndviValue }: NDVIMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ remove: () => void; setView: (center: [number, number], zoom: number, options?: { animate?: boolean }) => void; getZoom: () => number } | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;

      // Import CSS (local copy for PWA offline support)
      const existingLink = document.querySelector('link[href*="leaflet"]');
      if (!existingLink) {
        const linkEl = document.createElement("link");
        linkEl.rel = "stylesheet";
        linkEl.href = "/leaflet.css";
        document.head.appendChild(linkEl);
      }

      // Fix Leaflet default icon URL issue (use local copies for PWA offline)
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/marker-icon-2x.png",
        iconUrl: "/marker-icon.png",
        shadowUrl: "/marker-shadow.png",
      });

      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [23.8103, 90.4125], // Center on Bangladesh
        zoom: 7,
        zoomControl: true,
        attributionControl: true,
        minZoom: 6,
        maxZoom: 14,
      });
      mapInstanceRef.current = map;

      // Base map - light style for NDVI overlay visibility
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 18,
      }).addTo(map);

      // Add NDVI overlay circles for each region
      NDVI_REGIONS.forEach((region) => {
        const adjustedNDVI = getSeasonalNDVIBase(region.ndviBase);
        const color = ndviToColor(adjustedNDVI);

        L.circle([region.lat, region.lng], {
          radius: region.radius,
          color: color,
          fillColor: color,
          fillOpacity: 0.45,
          weight: 1.5,
          opacity: 0.6,
        })
          .addTo(map)
          .bindPopup(
            `<div style="text-align:center;min-width:130px;padding:4px">
              <b style="color:#1b4332">${region.name}</b><br/>
              <span style="font-size:13px;font-weight:bold;color:${color}">NDVI: ${adjustedNDVI.toFixed(2)}</span><br/>
              <span style="font-size:10px;color:#666">${getNDVILabel(adjustedNDVI)}</span>
            </div>`
          );
      });

      // Bangladesh border outline (simplified)
      const bdBorder = [
        [26.63, 88.03], [26.55, 88.55], [26.40, 89.10], [26.15, 89.65],
        [25.80, 89.90], [25.30, 89.65], [25.10, 89.00], [24.70, 88.75],
        [24.30, 88.70], [24.00, 88.85], [23.50, 89.10], [23.00, 89.20],
        [22.70, 89.00], [22.30, 89.15], [21.80, 89.40], [21.40, 89.80],
        [21.20, 92.00], [21.50, 92.30], [21.90, 92.30], [22.10, 92.40],
        [22.40, 92.30], [22.80, 92.20], [23.00, 92.00], [23.50, 91.70],
        [24.00, 91.65], [24.50, 91.70], [24.80, 91.80], [25.10, 91.70],
        [25.30, 91.55], [25.60, 91.40], [25.90, 91.20], [26.10, 90.80],
        [26.30, 90.20], [26.50, 89.50], [26.60, 88.50], [26.63, 88.03],
      ] as [number, number][];

      L.polyline(bdBorder, {
        color: "#1b4332",
        weight: 2,
        opacity: 0.5,
        dashArray: "6 4",
        fill: false,
      }).addTo(map);

      // User location marker
      const userIcon = L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;background:#dc2626;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.35);position:relative"><div style="position:absolute;inset:-6px;border:2px solid #dc2626;border-radius:50%;opacity:.3;animation:ndvi-pulse 2s infinite"></div></div><style>@keyframes ndvi-pulse{0%{transform:scale(.8);opacity:.5}100%{transform:scale(1.5);opacity:0}}</style>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      L.marker(center, { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<b>📍 আপনার অবস্থান</b><br/><span style="color:#16a34a;font-weight:bold">NDVI: ${ndviValue.toFixed(2)}</span>`);

      // NDVI Legend control
      const LegendControl = L.Control.extend({
        options: { position: "bottomright" },
        onAdd: function () {
          const div = L.DomUtil.create("div", "");
          div.innerHTML = `
            <div style="background:white;padding:8px 10px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.15);font-size:10px;min-width:120px">
              <div style="font-weight:bold;margin-bottom:5px;color:#1b4332;font-size:11px">NDVI লেজেন্ড</div>
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px">
                <div style="width:14px;height:10px;background:#006400;border-radius:2px"></div>
                <span>ঘন উদ্ভিদ (০.৮+)</span>
              </div>
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px">
                <div style="width:14px;height:10px;background:#32CD32;border-radius:2px"></div>
                <span>ভালো উদ্ভিদ (০.৬৫-০.৮)</span>
              </div>
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px">
                <div style="width:14px;height:10px;background:#7CCD7C;border-radius:2px"></div>
                <span>মাঝারি (০.৫-০.৬৫)</span>
              </div>
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px">
                <div style="width:14px;height:10px;background:#F4D03F;border-radius:2px"></div>
                <span>হালকা (০.৩৫-০.৫)</span>
              </div>
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px">
                <div style="width:14px;height:10px;background:#DAA520;border-radius:2px"></div>
                <span>কম (০.২-০.৩৫)</span>
              </div>
              <div style="display:flex;align-items:center;gap:5px">
                <div style="width:14px;height:10px;background:#8B4513;border-radius:2px"></div>
                <span>পতিত জমি (<০.২)</span>
              </div>
            </div>
          `;
          return div;
        },
      });
      new LegendControl().addTo(map);

      setTimeout(() => map.invalidateSize(), 200);
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Initialize once

  // Update user marker when center changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // The map is initialized once; just pan to new center
    import("leaflet").then((L) => {
      const map = mapInstanceRef.current as ReturnType<typeof L.map> | null;
      if (!map) return;
      map.setView(center, map.getZoom(), { animate: true });
    });
  }, [center]);

  return <div ref={mapRef} className="w-full h-full" />;
}

function getNDVILabel(ndvi: number): string {
  if (ndvi < 0.2) return "পতিত জমি / জলাশয়";
  if (ndvi < 0.35) return "কম উদ্ভিদ";
  if (ndvi < 0.5) return "হালকা উদ্ভিদ";
  if (ndvi < 0.65) return "মাঝারি উদ্ভিদ";
  if (ndvi < 0.8) return "ভালো উদ্ভিদ";
  return "ঘন উদ্ভিদ / বনাঞ্চল";
}
