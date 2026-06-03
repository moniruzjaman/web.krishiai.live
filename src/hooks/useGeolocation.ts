/**
 * useGeolocation.ts — Shared Geolocation Hook with Permission Management
 *
 * Features:
 * - Tracks browser geolocation permission state (granted / denied / prompt)
 * - Requests live GPS position with high accuracy
 * - Stores last known position in localStorage for offline fallback
 * - Provides Bengali district/upazila via Nominatim reverse geocoding
 * - watchPosition for continuous tracking
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface GeoPosition {
  lat: number;
  lon: number;
  accuracy: number;
  district: string;
  upazila: string;
  city: string;
  address: string;
}

export type PermissionStatus = "granted" | "denied" | "prompt" | "unavailable";

const STORAGE_KEYS = {
  lat: "krishi_lat",
  lon: "krishi_lon",
  district: "krishi_district",
  upazila: "krishi_upazila",
  city: "krishi_city",
  address: "krishi_address",
  permission: "krishi_location_permission",
};

const DHAKA_FALLBACK: GeoPosition = {
  lat: 23.8103,
  lon: 90.4125,
  accuracy: 0,
  district: "ঢাকা",
  upazila: "",
  city: "ঢাকা",
  address: "",
};

/** Read previously stored location from localStorage */
function getStoredPosition(): GeoPosition | null {
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

/** Save position to localStorage */
function storePosition(pos: GeoPosition) {
  try {
    localStorage.setItem(STORAGE_KEYS.lat, String(pos.lat));
    localStorage.setItem(STORAGE_KEYS.lon, String(pos.lon));
    localStorage.setItem(STORAGE_KEYS.district, pos.district);
    localStorage.setItem(STORAGE_KEYS.upazila, pos.upazila);
    localStorage.setItem(STORAGE_KEYS.city, pos.city);
    localStorage.setItem(STORAGE_KEYS.address, pos.address);
    localStorage.setItem(STORAGE_KEYS.permission, "granted");
  } catch {
    // Ignore storage errors
  }
}

/** Reverse geocode using Nominatim (through our proxy or directly) */
async function reverseGeocode(lat: number, lon: number): Promise<Pick<GeoPosition, "district" | "upazila" | "city" | "address">> {
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

export function useGeolocation(options?: { watch?: boolean }) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [permission, setPermission] = useState<PermissionStatus>("prompt");
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const reverseGeoCacheRef = useRef<Map<string, Pick<GeoPosition, "district" | "upazila" | "city" | "address">>>(new Map());

  // Check initial permission state
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission("unavailable");
      const stored = getStoredPosition();
      setPosition(stored || DHAKA_FALLBACK);
      setLoading(false);
      return;
    }

    // Check stored permission first
    const storedPerm = localStorage.getItem(STORAGE_KEYS.permission);
    if (storedPerm === "granted") {
      setPermission("granted");
    }

    // Use Permissions API if available
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((status) => {
          setPermission(status.state as PermissionStatus);
          status.onchange = () => {
            setPermission(status.state as PermissionStatus);
          };
        })
        .catch(() => {
          // Permissions API not supported, continue with prompt
        });
    }
  }, []);

  // Convert raw GeolocationPosition to our GeoPosition
  const processPosition = useCallback(async (pos: GeolocationPosition) => {
    const { latitude: lat, longitude: lon, accuracy } = pos.coords;

    // Check reverse geocode cache
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    let geoData = reverseGeoCacheRef.current.get(cacheKey);
    if (!geoData) {
      geoData = await reverseGeocode(lat, lon);
      reverseGeoCacheRef.current.set(cacheKey, geoData);
    }

    const newPos: GeoPosition = {
      lat,
      lon,
      accuracy,
      ...geoData,
    };

    setPosition(newPos);
    storePosition(newPos);
    setPermission("granted");
    setLoading(false);
  }, []);

  // Request location (one-shot)
  const requestLocation = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      const stored = getStoredPosition();
      setPosition(stored || DHAKA_FALLBACK);
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
    } catch (err) {
      // Geolocation denied or unavailable
      const code = (err as GeolocationPositionError)?.code;
      if (code === 1) {
        // PERMISSION_DENIED
        setPermission("denied");
        localStorage.setItem(STORAGE_KEYS.permission, "denied");
      }
      // Use stored or fallback
      const stored = getStoredPosition();
      setPosition(stored || DHAKA_FALLBACK);
      setLoading(false);
    }
  }, [processPosition]);

  // Auto-request location on mount
  useEffect(() => {
    // Try to get location immediately
    requestLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Optional: continuous watchPosition
  useEffect(() => {
    if (!options?.watch || typeof navigator === "undefined" || !navigator.geolocation) return;

    // Only start watching if permission is granted
    if (permission !== "granted") return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        await processPosition(pos);
      },
      () => {
        // Ignore watch errors, keep last known position
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
  }, [options?.watch, permission, processPosition]);

  return {
    position,
    permission,
    loading,
    requestLocation, // Re-request (e.g., after user enables location in settings)
  };
}
