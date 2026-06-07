/**
 * LocationContext.tsx — App-Wide Location Provider
 *
 * Provides a single source of truth for user location across all widgets.
 * Components consume via `useLocation()` hook.
 *
 * Features:
 * - Shared geolocation state for Weather, Map, Market, etc.
 * - Location permission prompt UI
 * - "Locate me" floating button
 * - Bengali district/upazila names
 */

"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";

export interface LocationInfo {
  lat: number;
  lon: number;
  accuracy: number;
  district: string;
  upazila: string;
  city: string;
  address: string;
}

export type LocationPermission = "granted" | "denied" | "prompt" | "unavailable";

interface LocationContextType {
  location: LocationInfo | null;
  permission: LocationPermission;
  loading: boolean;
  requestLocation: () => Promise<void>;
  /** Whether to show the location permission prompt banner */
  showPrompt: boolean;
  dismissPrompt: () => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

const STORAGE_KEYS = {
  lat: "krishi_lat",
  lon: "krishi_lon",
  district: "krishi_district",
  upazila: "krishi_upazila",
  city: "krishi_city",
  address: "krishi_address",
  permission: "krishi_location_permission",
  dismissed: "krishi_location_prompt_dismissed",
};

const DHAKA_FALLBACK: LocationInfo = {
  lat: 23.8103,
  lon: 90.4125,
  accuracy: 0,
  district: "ঢাকা",
  upazila: "",
  city: "ঢাকা",
  address: "",
};

function getStoredLocation(): LocationInfo | null {
  try {
    const lat = Number(localStorage.getItem(STORAGE_KEYS.lat));
    const lon = Number(localStorage.getItem(STORAGE_KEYS.lon));
    if (!lat || !lon) return null;
    return {
      lat,
      lon,
      accuracy: 0,
      district: localStorage.getItem(STORAGE_KEYS.district) || "ঢাকা",
      upazila: localStorage.getItem(STORAGE_KEYS.upazila) || "",
      city: localStorage.getItem(STORAGE_KEYS.city) || "ঢাকা",
      address: localStorage.getItem(STORAGE_KEYS.address) || "",
    };
  } catch {
    return null;
  }
}

function storeLocation(loc: LocationInfo) {
  try {
    localStorage.setItem(STORAGE_KEYS.lat, String(loc.lat));
    localStorage.setItem(STORAGE_KEYS.lon, String(loc.lon));
    localStorage.setItem(STORAGE_KEYS.district, loc.district);
    localStorage.setItem(STORAGE_KEYS.upazila, loc.upazila);
    localStorage.setItem(STORAGE_KEYS.city, loc.city);
    localStorage.setItem(STORAGE_KEYS.address, loc.address);
    localStorage.setItem(STORAGE_KEYS.permission, "granted");
  } catch {
    // Ignore
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<Pick<LocationInfo, "district" | "upazila" | "city" | "address">> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=bn&zoom=12`;
    const res = await fetch(url, {
      headers: { "User-Agent": "KrishiAI/1.0" },
    });
    if (!res.ok) throw new Error("Nominatim failed");
    const geo = await res.json();
    const addr = geo.address || {};
    const district = addr.state_district || addr.state || addr.county || addr.city || "ঢাকা";
    const upazila = addr.city_district || addr.county || addr.town || addr.village || "";
    const city = addr.city || addr.town || addr.county || district;
    const address = geo.display_name || "";
    return { district, upazila, city, address };
  } catch {
    return { district: "ঢাকা", upazila: "", city: "ঢাকা", address: "" };
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [permission, setPermission] = useState<LocationPermission>("prompt");
  const [loading, setLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const geoCacheRef = useRef<Map<string, Pick<LocationInfo, "district" | "upazila" | "city" | "address">>>(new Map());

  // Process a raw GeolocationPosition
  const processPosition = useCallback(async (pos: GeolocationPosition) => {
    const { latitude: lat, longitude: lon, accuracy } = pos.coords;

    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    let geoData = geoCacheRef.current.get(cacheKey);
    if (!geoData) {
      geoData = await reverseGeocode(lat, lon);
      geoCacheRef.current.set(cacheKey, geoData);
    }

    const newLoc: LocationInfo = { lat, lon, accuracy, ...geoData };
    setLocation(newLoc);
    storeLocation(newLoc);
    setPermission("granted");
    setLoading(false);
  }, []);

  // Request location explicitly
  const requestLocation = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation(getStoredLocation() || DHAKA_FALLBACK);
      setPermission("unavailable");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });
      await processPosition(pos);
      setShowPrompt(false);
    } catch (err) {
      const code = (err as GeolocationPositionError)?.code;
      if (code === 1) {
        setPermission("denied");
        localStorage.setItem(STORAGE_KEYS.permission, "denied");
      }
      const stored = getStoredLocation();
      setLocation(stored || DHAKA_FALLBACK);
      setLoading(false);
    }
  }, [processPosition]);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
    try {
      localStorage.setItem(STORAGE_KEYS.dismissed, "true");
    } catch {
      // Ignore
    }
  }, []);

  // On mount: check permission, auto-request, start watching
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission("unavailable");
      setLocation(DHAKA_FALLBACK);
      setLoading(false);
      return;
    }

    // Check if prompt was previously dismissed
    const wasDismissed = localStorage.getItem(STORAGE_KEYS.dismissed) === "true";

    // Check stored permission
    const storedPerm = localStorage.getItem(STORAGE_KEYS.permission);
    if (storedPerm === "denied") {
      setPermission("denied");
    }

    // Use Permissions API if available
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((status) => {
          const perm = status.state as LocationPermission;
          setPermission(perm);

          // Show prompt if permission hasn't been decided
          if (perm === "prompt" && !wasDismissed) {
            setShowPrompt(true);
          }

          status.onchange = () => {
            const newPerm = status.state as LocationPermission;
            setPermission(newPerm);
            if (newPerm === "granted") {
              // Re-request when user grants from browser settings
              requestLocation();
            }
          };
        })
        .catch(() => {
          // Permissions API not available, show prompt
          if (!wasDismissed) setShowPrompt(true);
        });
    } else if (!wasDismissed) {
      setShowPrompt(true);
    }

    // Don't auto-request on mount — wait for user interaction via banner or locate-me button.
    // Use stored location as initial fallback so widgets have data immediately.
    const stored = getStoredLocation();
    if (stored) {
      setLocation(stored);
    }
    setLoading(false);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start watching when permission is granted
  useEffect(() => {
    if (permission !== "granted" || typeof navigator === "undefined" || !navigator.geolocation) return;
    if (watchIdRef.current !== null) return; // Already watching

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        await processPosition(pos);
      },
      () => {
        // Ignore watch errors
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [permission, processPosition]);

  return (
    <LocationContext.Provider
      value={{
        location,
        permission,
        loading,
        requestLocation,
        showPrompt,
        dismissPrompt,
      }}
    >
      {children}

      {/* ══ Location Permission Prompt Banner ══ */}
      {showPrompt && permission !== "granted" && (
        <div className="fixed bottom-[72px] left-0 right-0 z-[60] px-4 pb-2 animate-slide-up">
          <div className="max-w-[768px] mx-auto bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] rounded-2xl p-4 shadow-2xl border border-green-600/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 text-lg">
                📍
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm mb-1">
                  লাইভ লোকেশন চালু করুন
                </div>
                <div className="text-white/70 text-[12px] leading-relaxed mb-3">
                  আপনার এলাকার সঠিক আবহাওয়া, বাজার মূল্য ও কৃষি পরামর্শ পেতে লোকেশন অনুমতি দিন।
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await requestLocation();
                    }}
                    className="bg-green-500 hover:bg-green-400 text-white font-bold text-[12px] rounded-full px-4 py-2 transition-colors active:scale-95 shadow-md border-none cursor-pointer"
                  >
                    📍 লোকেশন চালু করুন
                  </button>
                  <button
                    onClick={dismissPrompt}
                    className="bg-white/10 hover:bg-white/20 text-white/70 font-medium text-[12px] rounded-full px-4 py-2 transition-colors border border-white/10 cursor-pointer"
                  >
                    পরে
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Locate-Me Floating Button ══ */}
      {location && (
        <button
          onClick={requestLocation}
          className="fixed bottom-[76px] right-4 z-[55] w-11 h-11 bg-[#1b4332] hover:bg-[#2d6a4f] text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90 border-none cursor-pointer"
          title="আমার অবস্থান খুঁজুন"
          aria-label="Locate me"
        >
          {loading ? (
            <span className="animate-spin text-base">⟳</span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          )}
        </button>
      )}

      {/* ══ Location Denied Warning ══ */}
      {permission === "denied" && !loading && (
        <div className="fixed bottom-[72px] left-0 right-0 z-[55] px-4 pb-2">
          <div className="max-w-[768px] mx-auto bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <div className="flex-1 min-w-0">
              <div className="text-amber-800 text-[11px] font-semibold">
                লোকেশন অনুমতি দেওয়া হয়নি — ঢাকার তথ্য দেখানো হচ্ছে
              </div>
              <div className="text-amber-600 text-[10px]">
                ব্রাউজার সেটিংস থেকে লোকেশন অনুমতি দিন
              </div>
            </div>
            <button
              onClick={() => {
                // Try requesting again (may show browser prompt if reset)
                requestLocation();
              }}
              className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-3 py-1.5 border-none cursor-pointer flex-shrink-0"
            >
              আবার চেষ্টা
            </button>
          </div>
        </div>
      )}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextType {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return ctx;
}
