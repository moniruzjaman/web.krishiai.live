/**
 * InteractiveMap.tsx — Enhanced Leaflet Map Component (dynamically imported)
 *
 * Features:
 * - 15+ BD agricultural institution markers across all divisions
 * - Satellite map layer option (Esri World Imagery)
 * - Category-colored markers with popup info
 * - District crop zone highlights
 * - User location marker with pulse animation
 * - Locate-me control button
 * - Auto-center on user location
 * - Geo-fence polygons for plot / plantation / orchard / pond (localStorage)
 * - Optional tap-to-draw mode for creating new geo-fences
 */

"use client";

import type { Map as LeafletMap, Marker, Layer, LayerGroup, TileLayer } from "leaflet";
import { useEffect, useRef } from "react";
import { escapeHtml } from "@/lib/html-sanitize";
import {
  formatAreaBn,
  GEO_FENCE_TYPE_META,
  type GeoFence,
  type GeoFenceType,
} from "@/lib/geofence";

interface MapProps {
  center: [number, number];
  mapStyle?: "street" | "satellite";
  accuracy?: number;
  onLocateMe?: () => void;
  /** Saved farmer geo-fences to render as labelled polygons */
  fences?: GeoFence[];
  /** When set, taps on the map add vertices and call back with the draft ring */
  drawMode?: boolean;
  onDraftPoint?: (latlng: [number, number]) => void;
  /** Highlight fences that contain the current user position */
  highlightIds?: string[];
}

// ── BD Agricultural Institutions (across all divisions) ──────────────────────
const INSTITUTIONS = [
  // Dhaka Division
  { pos: [23.7465, 90.3844] as [number, number], name: "DAE — কৃষি সম্প্রসারণ অধিদপ্তর", short: "DAE", color: "#16a34a", category: "extension" },
  { pos: [23.8103, 90.4125] as [number, number], name: "BRRI — বাংলাদেশ ধান গবেষণা ইনস্টিটিউট", short: "BRRI", color: "#2563eb", category: "research" },
  { pos: [23.9945, 90.4227] as [number, number], name: "BARI — বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউট", short: "BARI", color: "#2563eb", category: "research" },
  { pos: [23.7774, 90.3569] as [number, number], name: "BADC — বাংলাদেশ কৃষি উন্নয়ন কর্পোরেশন", short: "BADC", color: "#7c3aed", category: "corporation" },
  { pos: [23.7393, 90.3946] as [number, number], name: "BARC — বাংলাদেশ কৃষি গবেষণা পরিষদ", short: "BARC", color: "#7c3aed", category: "corporation" },
  { pos: [23.7806, 90.3985] as [number, number], name: "BMD — আবহাওয়া অধিদপ্তর, ঢাকা", short: "BMD", color: "#d97706", category: "weather" },

  // Rajshahi Division
  { pos: [24.3745, 88.6042] as [number, number], name: "BRRI রাজশাহী — ধান গবেষণা কেন্দ্র", short: "BRRI-R", color: "#2563eb", category: "research" },
  { pos: [24.3645, 88.6242] as [number, number], name: "BARI রাজশাহী — কৃষি গবেষণা কেন্দ্র", short: "BARI-R", color: "#2563eb", category: "research" },

  // Rangpur Division
  { pos: [25.7439, 89.2752] as [number, number], name: "BRRI রংপুর — ধান গবেষণা কেন্দ্র", short: "BRRI-RP", color: "#2563eb", category: "research" },
  { pos: [25.7559, 89.2432] as [number, number], name: "WRC — গম গবেষণা কেন্দ্র, নাসিরাবাদ", short: "WRC", color: "#2563eb", category: "research" },

  // Khulna Division
  { pos: [22.8456, 89.5403] as [number, number], name: "SRDI খুলনা — মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট", short: "SRDI-K", color: "#7c3aed", category: "corporation" },

  // Chattogram Division
  { pos: [22.3569, 91.7832] as [number, number], name: "BARI চট্টগ্রাম — কৃষি গবেষণা কেন্দ্র", short: "BARI-C", color: "#2563eb", category: "research" },

  // Sylhet Division
  { pos: [24.8949, 91.8687] as [number, number], name: "BRRI সিলেট — ধান গবেষণা কেন্দ্র", short: "BRRI-S", color: "#2563eb", category: "research" },

  // Barishal Division
  { pos: [22.7010, 90.3535] as [number, number], name: "BRRI বরিশাল — ধান গবেষণা কেন্দ্র", short: "BRRI-B", color: "#2563eb", category: "research" },

  // Mymensingh Division
  { pos: [24.7471, 90.4232] as [number, number], name: "BAU — বাংলাদেশ কৃষি বিশ্ববিদ্যালয়", short: "BAU", color: "#16a34a", category: "extension" },
];

// ── Geo-fence rendering helpers (module scope: stable across renders) ────────

type LLib = typeof import("leaflet");

/** Draw (or redraw) saved geo-fence polygons into the fence layer group. */
function renderFences(
  L: LLib,
  fenceGroup: LayerGroup,
  fences: GeoFence[],
  highlightIds: string[],
): void {
  fenceGroup.clearLayers();
  for (const f of fences) {
    const meta = GEO_FENCE_TYPE_META[f.type];
    const highlighted = highlightIds.includes(f.id);
    const polygon = L.polygon(f.points, {
      color: meta.color,
      weight: highlighted ? 4 : 2,
      fillColor: meta.color,
      fillOpacity: highlighted ? 0.3 : 0.15,
      dashArray: highlighted ? undefined : "6 3",
    });
    polygon.bindPopup(
      `<div style="min-width:140px;text-align:center">` +
        `<b style="color:${escapeHtml(meta.color)}">${escapeHtml(meta.icon)} ${escapeHtml(f.name)}</b><br>` +
        `<span style="font-size:11px">${escapeHtml(meta.labelBn)}${f.crop ? " · " + escapeHtml(f.crop) : ""}</span><br>` +
        `<span style="font-size:11px;color:#555">${escapeHtml(formatAreaBn(f.points))}</span>` +
        `</div>`,
    );
    // Vertex dots so boundaries are visible even when zoomed out.
    const vertices = L.layerGroup(
      f.points.map((p) =>
        L.circleMarker(p, {
          radius: 4,
          color: "#fff",
          weight: 1.5,
          fillColor: meta.color,
          fillOpacity: 1,
        }),
      ),
    );
    fenceGroup.addLayer(L.layerGroup([polygon, vertices]));
  }
}

/** Draw the in-progress tap-to-draft ring (dashed preview + vertex dots). */
function renderDraft(L: LLib, map: LeafletMap): void {
  const pts = draftGlobalRef.current;
  if (draftPreviewRef.current) {
    map.removeLayer(draftPreviewRef.current as TileLayer);
    draftPreviewRef.current = null;
  }
  if (pts.length === 0) return;
  const layers: Layer[] = pts.map((p) =>
    L.circleMarker(p, {
      radius: 5,
      color: "#f59e0b",
      weight: 2,
      fillColor: "#fbbf24",
      fillOpacity: 1,
    }),
  );
  if (pts.length >= 2) {
    layers.push(
      L.polygon(pts, {
        color: "#f59e0b",
        weight: 2,
        dashArray: "4 4",
        fillColor: "#fbbf24",
        fillOpacity: 0.1,
      }),
    );
  }
  const group = L.layerGroup(layers).addTo(map);
  draftPreviewRef.current = group;
}

// Draft preview is managed imperatively from inside the one-time map init
// effect, so it lives in module-level state mirrored by component refs.
const draftGlobalRef: { current: [number, number][] } = { current: [] };
const draftPreviewRef: { current: unknown } = { current: null };

export default function InteractiveMap({
  center,
  mapStyle = "street",
  accuracy = 500,
  onLocateMe,
  fences = [],
  drawMode = false,
  onDraftPoint,
  highlightIds = [],
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const tileLayerRef = useRef<unknown>(null);
  const userMarkerRef = useRef<unknown>(null);
  // Geo-fence polygon layer group + draft vertices (kept as refs so the
  // map is never re-initialized when these change).
  const fenceLayerRef = useRef<LayerGroup | null>(null);
  const draftPointsRef = useRef<[number, number][]>([]);
  // Latest props/callbacks via refs so the one-time map init effect stays
  // stable. Synced inside effects (never during render) to satisfy React
  // Compiler's "no ref writes during render" rule.
  const onDraftPointRef = useRef(onDraftPoint);
  const drawModeRef = useRef(drawMode);
  const fencesRef = useRef(fences);
  const highlightIdsRef = useRef(highlightIds);
  useEffect(() => {
    onDraftPointRef.current = onDraftPoint;
    drawModeRef.current = drawMode;
    if (!drawMode) draftPointsRef.current = [];
    fencesRef.current = fences;
    highlightIdsRef.current = highlightIds;
  }, [onDraftPoint, drawMode, fences, highlightIds]);

  // Re-render saved fence polygons whenever the list / highlights change
  // (the map itself is initialized only once).
  useEffect(() => {
    if (!fenceLayerRef.current || !mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      if (fenceLayerRef.current) {
        renderFences(L, fenceLayerRef.current, fences, highlightIds);
      }
    });
  }, [fences, highlightIds]);

  // Keep the module-level draft mirror in sync and redraw the dashed preview
  // ring while the farmer is tapping out a new geo-fence. The vertex count is
  // mirrored into state by the parent via onDraftPoint, so we key off
  // drawMode + fences here; per-tap redraws happen imperatively in the click
  // handler installed during map init.
  useEffect(() => {
    draftGlobalRef.current = draftPointsRef.current;
    const map = mapInstanceRef.current as LeafletMap | null;
    if (!map) return;
    import("leaflet").then((L) => renderDraft(L, map));
  }, [drawMode]);
  // Store center as ref to avoid re-initializing map on every parent re-render.
  // Assigned inside effects (not during render) to satisfy React Compiler's
  // "no side effects during render" rule while keeping the same behavior.
  const centerRef = useRef(center);

  // Initialize map — only once on mount
  useEffect(() => {
    if (!mapRef.current) return;
    centerRef.current = center;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;

      // Import CSS
      const existingLink = document.querySelector('link[href*="leaflet"]');
      if (!existingLink) {
        const linkEl = document.createElement("link");
        linkEl.rel = "stylesheet";
        linkEl.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(linkEl);
      }

      // Fix Leaflet default icon issue
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: centerRef.current,
        zoom: 10,
        zoomControl: true,
        attributionControl: true,
      });
      mapInstanceRef.current = map;

      // User location marker with pulse animation
      const userIcon = L.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;background:#e53e3e;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3);position:relative"><div style="position:absolute;inset:-6px;border:2px solid #e53e3e;border-radius:50%;opacity:.3;animation:pulse-ring 2s infinite"></div></div><style>@keyframes pulse-ring{0%{transform:scale(.8);opacity:.5}100%{transform:scale(1.5);opacity:0}}</style>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const userMarker = L.marker(centerRef.current, { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup("<b>📍 আপনার অবস্থান</b>");
      userMarkerRef.current = userMarker;

      // Accuracy circle around user location (use actual GPS accuracy)
      const accuracyCircle = L.circle(centerRef.current, {
        radius: Math.max(accuracy, 50), // minimum 50m for visibility
        color: "#e53e3e",
        fillColor: "#e53e3e",
        fillOpacity: 0.08,
        weight: 1,
        opacity: 0.3,
      }).addTo(map);

      // Add institution markers
      INSTITUTIONS.forEach((inst) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;background:${inst.color};border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.25);cursor:pointer" title="${escapeHtml(inst.short)}"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        L.marker(inst.pos, { icon })
          .addTo(map)
          .bindPopup(`<div style="text-align:center;min-width:120px"><b style="color:${escapeHtml(inst.color)}">${escapeHtml(inst.short)}</b><br><span style="font-size:11px">${escapeHtml(inst.name)}</span></div>`);
      });

      // Geo-fence layer group (plot / plantation / orchard polygons)
      const fenceGroup = L.layerGroup().addTo(map);
      fenceLayerRef.current = fenceGroup;

      // Tap-to-draw handler for creating new geo-fences (also redraws the
      // live draft preview: vertex dots + dashed polygon).
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        if (!drawModeRef.current) return;
        const pt: [number, number] = [e.latlng.lat, e.latlng.lng];
        draftPointsRef.current = [...draftPointsRef.current, pt];
        // Keep the module-level mirror in sync so renderDraft (called from
        // imperative contexts inside the one-time init effect) sees the ring.
        draftGlobalRef.current = draftPointsRef.current;
        onDraftPointRef.current?.(pt);
        renderDraft(L, map);
      });

      renderFences(L, fenceGroup, fencesRef.current, highlightIdsRef.current);
      renderDraft(L, map);

      // Tile layer — will be managed by the mapStyle effect
      const initialTile = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 18,
      });
      initialTile.addTo(map);
      tileLayerRef.current = initialTile;

      // Add locate-me control button
      const LocateControl = L.Control.extend({
        options: { position: "topright" },
        onAdd: function () {
          const btn = L.DomUtil.create("button", "");
          btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b4332" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>`;
          btn.title = "আমার অবস্থান";
          btn.style.cssText = "width:36px;height:36px;background:#fff;border:2px solid #1b4332;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.15);transition:all .2s";
          btn.onmouseover = () => { btn.style.background = "#f0fdf4"; };
          btn.onmouseout = () => { btn.style.background = "#fff"; };
          btn.onclick = function () {
            // Use LocationContext's requestLocation instead of raw geolocation
            if (onLocateMe) {
              onLocateMe();
            } else if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const { latitude, longitude } = pos.coords;
                  map.setView([latitude, longitude], 13, { animate: true });
                  (userMarker as Marker).setLatLng([latitude, longitude]);
                },
                () => {
                  map.setView(centerRef.current, 13, { animate: true });
                },
                { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
              );
            }
          };
          return btn;
        },
      });
      new LocateControl().addTo(map);

      // Invalidate size after mount
      setTimeout(() => map.invalidateSize(), 200);
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        userMarkerRef.current = null;
        fenceLayerRef.current = null;
        // Drop any lingering draft preview layer reference.
        draftPreviewRef.current = null;
        draftGlobalRef.current = [];
        draftPointsRef.current = [];
      }
    };
  }, []); // Only initialize once on mount

  // Update center when location changes (pan the map instead of reinitializing)
  useEffect(() => {
    centerRef.current = center;
    if (!mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      const map = mapInstanceRef.current as LeafletMap | null;
      if (!map) return;
      map.setView(center, map.getZoom(), { animate: true });
      // Update user marker position
      if (userMarkerRef.current) {
        (userMarkerRef.current as Marker).setLatLng(center);
      }
    });
  }, [center]);

  // Update tile layer when mapStyle changes (without remounting the map)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current as LeafletMap | null;
      if (!map) return;

      // Remove old tile layer
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current as TileLayer);
      }

      const tileLayer = mapStyle === "satellite"
        ? L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            attribution: "Esri World Imagery",
            maxZoom: 18,
          })
        : L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
            maxZoom: 18,
          });

      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;
    });
  }, [mapStyle]);

  return <div ref={mapRef} className="w-full h-full" />;
}
