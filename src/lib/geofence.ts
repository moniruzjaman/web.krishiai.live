/**
 * geofence.ts — Farmer field geo-fences (plot / plantation / orchard / pond)
 *
 * Stores user-drawn polygons in localStorage and provides:
 *  - validation & sanitisation of every stored value (defence-in-depth for
 *    Leaflet popup/divIcon HTML sinks),
 *  - spherical-geometry area computation (m² → decimal acres & bigha, the
 *    units BD farmers actually use),
 *  - point-in-polygon test so tools can answer "is this GPS fix inside my plot?".
 *
 * No external API is required; fences never leave the device.
 */

export type GeoFenceType = "plot" | "plantation" | "orchard" | "pond" | "homestead";

export interface GeoFence {
  id: string;
  name: string;
  type: GeoFenceType;
  /** Closed ring of [lat, lng] vertices (first vertex need not repeat) */
  points: [number, number][];
  crop?: string;
  createdAt: number;
  updatedAt: number;
}

export const GEO_FENCE_TYPE_META: Record<
  GeoFenceType,
  { labelBn: string; labelEn: string; color: string; icon: string }
> = {
  plot: { labelBn: "জমির প্লট", labelEn: "Crop Plot", color: "#16a34a", icon: "🌾" },
  plantation: { labelBn: "প্ল্যান্টেশন", labelEn: "Plantation", color: "#0e7490", icon: "🌴" },
  orchard: { labelBn: "বাগান", labelEn: "Orchard", color: "#7c3aed", icon: "🥭" },
  pond: { labelBn: "পুকুর/জলাশয়", labelEn: "Pond / Water", color: "#2563eb", icon: "💧" },
  homestead: { labelBn: "ঘরবাড়ি", labelEn: "Homestead", color: "#b45309", icon: "🏠" },
};

export const STORAGE_KEY = "krishi_geofences_v1";

/** Bangladesh bounding box — reject obviously bogus coordinates. */
const BD_BBOX = { minLat: 20.5, maxLat: 27.5, minLng: 88.0, maxLng: 92.8 };

const MAX_FENCES = 50;
const MAX_POINTS_PER_FENCE = 100;
const MAX_NAME_LEN = 80;

// ── Validation / sanitisation ────────────────────────────────────────────────

function isValidVertex(v: unknown): v is [number, number] {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === "number" &&
    typeof v[1] === "number" &&
    Number.isFinite(v[0]) &&
    Number.isFinite(v[1]) &&
    v[0] >= BD_BBOX.minLat &&
    v[0] <= BD_BBOX.maxLat &&
    v[1] >= BD_BBOX.minLng &&
    v[1] <= BD_BBOX.maxLng
  );
}

function isFenceType(t: unknown): t is GeoFenceType {
  return typeof t === "string" && t in GEO_FENCE_TYPE_META;
}

/** Strip anything that could become markup when rendered into popups. */
export function sanitizeFenceText(value: unknown, maxLen = MAX_NAME_LEN): string {
  return String(value ?? "")
    .replace(/[<>{}"'`&]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

/** Coerce untrusted JSON (localStorage) into a valid fence, or null. */
export function parseFence(raw: unknown): GeoFence | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  if (!isFenceType(o.type)) return null;
  if (!Array.isArray(o.points) || o.points.length < 3) return null;
  const pts: [number, number][] = [];
  for (const p of o.points.slice(0, MAX_POINTS_PER_FENCE)) {
    if (isValidVertex(p)) pts.push([p[0], p[1]]);
  }
  if (pts.length < 3) return null;
  const created = typeof o.createdAt === "number" && Number.isFinite(o.createdAt) ? o.createdAt : Date.now();
  return {
    id: sanitizeFenceText(o.id, 40),
    name: sanitizeFenceText(o.name) || "নামবিহীন প্লট",
    type: o.type,
    points: pts,
    crop: typeof o.crop === "string" ? sanitizeFenceText(o.crop, 40) : undefined,
    createdAt: created,
    updatedAt: typeof o.updatedAt === "number" && Number.isFinite(o.updatedAt) ? o.updatedAt : created,
  };
}

// ── Area math (spherical excess approximation) ───────────────────────────────

const EARTH_RADIUS_M = 6371008.8;
const SQ_M_PER_DECIMAL_ACRE = 4046.8564224;
const SQ_M_PER_BIGHA = 1600; // local (BD) bigha

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Polygon area in m² using the spherical-excess formula (Leaflet-compatible). */
export function polygonAreaSqMeters(points: [number, number][]): number {
  if (points.length < 3) return 0;
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const [lat1, lng1] = points[i];
    const [lat2, lng2] = points[(i + 1) % points.length];
    total += (toRad(lng2) - toRad(lng1)) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

export interface AreaUnits {
  sqMeters: number;
  decimalAcres: number;
  bigha: number;
}

export function areaUnits(points: [number, number][]): AreaUnits {
  const sqMeters = polygonAreaSqMeters(points);
  return {
    sqMeters,
    decimalAcres: sqMeters / SQ_M_PER_DECIMAL_ACRE,
    bigha: sqMeters / SQ_M_PER_BIGHA,
  };
}

/** Bengali-numeral friendly area string, e.g. "০.৩২ একর (৬.৪ শতক)" */
export function formatAreaBn(points: [number, number][]): string {
  const a = areaUnits(points);
  const bnDigits = (s: string) => s.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
  const katha = a.sqMeters / 320; // 1 decimal katha/shotok ≈ 320 m²
  return `${bnDigits(a.decimalAcres.toFixed(2))} একর (${bnDigits(katha.toFixed(1))} শতক)`;
}

// ── Point-in-polygon (ray casting, lat/lng space) ────────────────────────────

export function isPointInsideFence(
  latlng: [number, number],
  points: [number, number][],
): boolean {
  const [y, x] = latlng;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [yi, xi] = points[i];
    const [yj, xj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Which fences contain the given position? */
export function fencesAt(fences: GeoFence[], latlng: [number, number]): GeoFence[] {
  return fences.filter((f) => isPointInsideFence(latlng, f.points));
}

// ── Persistence ──────────────────────────────────────────────────────────────

export function loadFences(): GeoFence[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parseFence).filter((f): f is GeoFence => f !== null).slice(0, MAX_FENCES);
  } catch {
    return [];
  }
}

export function saveFences(fences: GeoFence[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fences.slice(0, MAX_FENCES)));
    window.dispatchEvent(new CustomEvent("krishi-geofences-changed"));
  } catch {
    // Storage full or unavailable — fail silently, fences stay in memory.
  }
}

export function newFenceId(): string {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Simple external-store subscription so React components re-render on change. */
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("krishi-geofences-changed", () => {
    listeners.forEach((fn) => fn());
  });
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) listeners.forEach((fn) => fn());
  });
}

export function subscribeFences(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
