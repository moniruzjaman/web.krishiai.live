/**
 * InteractiveMap.tsx — Leaflet Map Component (dynamically imported)
 *
 * Separated to avoid SSR issues with Leaflet.
 * Uses dynamic import of leaflet library only on client.
 */

"use client";

import { useEffect, useRef } from "react";

interface MapProps {
  center: [number, number];
}

export default function InteractiveMap({ center }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import leaflet only on client
    import("leaflet").then((L) => {
      // Also import CSS
      const linkEl = document.createElement("link");
      linkEl.rel = "stylesheet";
      linkEl.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(linkEl);

      // Fix Leaflet default icon issue
      delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center,
        zoom: 10,
        zoomControl: true,
        attributionControl: true,
      });

      // OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 18,
      }).addTo(map);

      // User location marker
      const userIcon = L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;background:#e53e3e;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      L.marker(center, { icon: userIcon })
        .addTo(map)
        .bindPopup("আপনার অবস্থান")
        .openPopup();

      // Agricultural institution markers
      const institutions = [
        { pos: [23.7465, 90.3844] as [number, number], name: "DAE - কৃষি সম্প্রসারণ অধিদপ্তর", color: "#16a34a" },
        { pos: [23.8103, 90.4125] as [number, number], name: "BRRI - ধান গবেষণা ইনস্টিটিউট", color: "#2563eb" },
        { pos: [23.9945, 90.4227] as [number, number], name: "BARI - কৃষি গবেষণা ইনস্টিটিউট", color: "#b45309" },
        { pos: [23.7774, 90.3569] as [number, number], name: "BADC - কৃষি উন্নয়ন কর্পোরেশন", color: "#0284c7" },
        { pos: [23.7393, 90.3946] as [number, number], name: "BARC - কৃষি গবেষণা পরিষদ", color: "#6d28d9" },
      ];

      institutions.forEach((inst) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:12px;height:12px;background:${inst.color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.2)"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        L.marker(inst.pos, { icon })
          .addTo(map)
          .bindPopup(`<b>${inst.name}</b>`);
      });

      mapInstanceRef.current = map;

      // Invalidate size after mount to ensure tiles load correctly
      setTimeout(() => map.invalidateSize(), 200);
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center]);

  return <div ref={mapRef} className="w-full h-full" />;
}
