/**
 * /api/v1/aez-zones — Shared platform data: Bangladesh Agro-Ecological Zones
 *
 * Full SRDI (Soil Resource Development Institute) official dataset — 30 zones,
 * each with soil type, texture, topography, pH range, and a 13-nutrient
 * profile. Ported from an earlier prototype's structured dataset into the
 * shared, durable /api/v1 platform layer used by web, mobile, cabi, game.
 *
 * GET /api/v1/aez-zones                → list all 30 zones (id + names only)
 * GET /api/v1/aez-zones?id=28           → full detail for one zone
 * GET /api/v1/aez-zones?lat=23.8&lng=90.4
 *                                        → nearest zone to a GPS coordinate
 *                                          (powers "detect my zone automatically")
 *
 * No auth required — public, read-heavy platform data. CORS open to any
 * *.krishiai.live origin (see src/lib/cors.ts); native app fetches are
 * unaffected by CORS entirely.
 */

import { NextRequest } from "next/server";
import { corsNextResponse, handleOptions } from "@/lib/cors";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const API_VERSION = "1.0.0";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createServiceClient(url, serviceKey);
}

export async function OPTIONS(req: NextRequest) {
  return handleOptions(req.headers.get("origin"), ["GET", "OPTIONS"]);
}

interface AEZZoneRow {
  id: number;
  name_en: string;
  name_bn: string;
  lat: number;
  lng: number;
  soil_type: string;
  texture: string;
  topography: string;
  ph_range: string;
  nutrients: Record<string, string>;
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id");
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");

  let supabase;
  try {
    supabase = serviceClient();
  } catch (e) {
    return corsNextResponse(
      { ok: false, version: API_VERSION, error: (e as Error).message },
      { status: 500, origin }
    );
  }

  // ── ?lat=&lng= : nearest zone by GPS coordinate ──────────────────────────
  if (latParam && lngParam) {
    const lat = Number(latParam);
    const lng = Number(lngParam);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return corsNextResponse(
        { ok: false, version: API_VERSION, error: "lat and lng must be numbers" },
        { status: 400, origin }
      );
    }

    const { data: zones, error } = await supabase
      .from("aez_zones")
      .select("*")
      .returns<AEZZoneRow[]>();

    if (error) {
      return corsNextResponse({ ok: false, version: API_VERSION, error: error.message }, { status: 500, origin });
    }
    if (!zones || zones.length === 0) {
      return corsNextResponse(
        { ok: false, version: API_VERSION, error: "No AEZ zone data available" },
        { status: 404, origin }
      );
    }

    let nearest = zones[0];
    let minDist = Infinity;
    for (const z of zones) {
      const d = Math.hypot(z.lat - lat, z.lng - lng);
      if (d < minDist) {
        minDist = d;
        nearest = z;
      }
    }

    return corsNextResponse(
      { ok: true, version: API_VERSION, zone: nearest, source: "db" },
      { origin, headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  }

  // ── ?id= : single zone detail ────────────────────────────────────────────
  if (idParam) {
    const id = Number(idParam);
    const { data: zone, error } = await supabase
      .from("aez_zones")
      .select("*")
      .eq("id", id)
      .maybeSingle<AEZZoneRow>();

    if (error) {
      return corsNextResponse({ ok: false, version: API_VERSION, error: error.message }, { status: 500, origin });
    }
    if (!zone) {
      return corsNextResponse(
        { ok: false, version: API_VERSION, error: `Unknown AEZ zone id: ${idParam}` },
        { status: 404, origin }
      );
    }

    return corsNextResponse(
      { ok: true, version: API_VERSION, zone, source: "db" },
      { origin, headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  }

  // ── No params: list all zones (lightweight — no nutrient payload) ───────
  const { data: zones, error } = await supabase
    .from("aez_zones")
    .select("id, name_en, name_bn, lat, lng, soil_type, ph_range")
    .order("id")
    .returns<Partial<AEZZoneRow>[]>();

  if (error) {
    return corsNextResponse({ ok: false, version: API_VERSION, error: error.message }, { status: 500, origin });
  }

  return corsNextResponse(
    { ok: true, version: API_VERSION, count: zones?.length ?? 0, zones },
    { origin, headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
