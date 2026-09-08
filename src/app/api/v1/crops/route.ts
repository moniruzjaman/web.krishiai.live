/**
 * /api/v1/crops — Shared platform data (durable, versioned)
 *
 * This is the canonical source of crop/category data for ALL KrishiAI
 * projects — web.krishiai.live, the Expo mobile app, cabi.krishiai.live,
 * game.krishiai.live. Unlike the legacy /api/crop-database route (which
 * regenerated crops via AI into an in-memory Map that reset on every
 * server restart and was never shared across projects), this route
 * persists AI-generated results to Supabase on first request, then serves
 * every subsequent request — from any project — straight from the DB.
 *
 * GET /api/v1/crops                       → list all 7 categories
 * GET /api/v1/crops?category=Grains       → list crops in a category
 *                                            (generates + persists on first call)
 * GET /api/v1/crops?category=Grains&refresh=true
 *                                          → force AI regeneration (admin use)
 *
 * No auth required — this is intentionally public, read-heavy platform data.
 * CORS is open to any *.krishiai.live origin (see src/lib/cors.ts) and to
 * native app fetches (unaffected by CORS entirely).
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

interface CategoryRow {
  id: string;
  name: string;
  name_bn: string;
  examples: string | null;
  sort_order: number;
}

interface CropRow {
  id: string;
  category_id: string;
  name: string;
  name_bn: string;
  description: string | null;
  description_bn: string | null;
  season: string | null;
  source: string;
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const { searchParams } = new URL(req.url);
  const rawCategory = searchParams.get("category");
  const forceRefresh = searchParams.get("refresh") === "true";

  let supabase;
  try {
    supabase = serviceClient();
  } catch (e) {
    return corsNextResponse(
      { ok: false, version: API_VERSION, error: (e as Error).message },
      { status: 500, origin }
    );
  }

  // ── No category param: list all categories ─────────────────────────────
  if (!rawCategory) {
    const { data, error } = await supabase
      .from("crop_categories")
      .select("id, name, name_bn, examples, sort_order")
      .order("sort_order")
      .returns<CategoryRow[]>();

    if (error) {
      return corsNextResponse({ ok: false, version: API_VERSION, error: error.message }, { status: 500, origin });
    }

    return corsNextResponse(
      { ok: true, version: API_VERSION, categories: data },
      { origin, headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  }

  // ── Category param: resolve to a category_id ────────────────────────────
  const categoryId = rawCategory.trim().toLowerCase().replace(/\s+/g, "_");

  const { data: category, error: categoryError } = await supabase
    .from("crop_categories")
    .select("id, name, name_bn, examples, sort_order")
    .eq("id", categoryId)
    .maybeSingle<CategoryRow>();

  if (categoryError) {
    return corsNextResponse({ ok: false, version: API_VERSION, error: categoryError.message }, { status: 500, origin });
  }
  if (!category) {
    return corsNextResponse(
      { ok: false, version: API_VERSION, error: `Unknown category: ${rawCategory}` },
      { status: 400, origin }
    );
  }

  // ── Serve from DB if we already have crops for this category ────────────
  if (!forceRefresh) {
    const { data: existingCrops, error: cropsError } = await supabase
      .from("crops")
      .select("id, category_id, name, name_bn, description, description_bn, season, source")
      .eq("category_id", category.id)
      .returns<CropRow[]>();

    if (cropsError) {
      return corsNextResponse({ ok: false, version: API_VERSION, error: cropsError.message }, { status: 500, origin });
    }

    if (existingCrops && existingCrops.length > 0) {
      return corsNextResponse(
        { ok: true, version: API_VERSION, category: category.name, crops: existingCrops, source: "db" },
        { origin, headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
      );
    }
  }

  // ── Nothing in DB yet (or forced refresh): generate via AI, then persist ─
  try {
    const { callAI } = await import("@/lib/ai-client");

    const prompt = `List 8 important ${category.name} crops grown in Bangladesh as a JSON array.
Each item must have: "name" (English), "nameBn" (Bengali), "description" (1 sentence, English), "descriptionBn" (1 sentence, Bengali), "season" (one of: Rabi, Kharif-1, Kharif-2, Year-round).
Respond with ONLY the JSON array, no markdown fences, no commentary.`;

    const result = await callAI(
      [{ role: "user", content: prompt }],
      { feature: "crop_database", temperature: 0.4, maxTokens: 1200 }
    );

    const cleaned = result.text.replace(/```json|```/g, "").trim();
    const generated: Array<{
      name: string;
      nameBn: string;
      description: string;
      descriptionBn: string;
      season: string;
    }> = JSON.parse(cleaned);

    const rowsToInsert = generated.map((c) => ({
      category_id: category.id,
      name: c.name,
      name_bn: c.nameBn,
      description: c.description,
      description_bn: c.descriptionBn,
      season: c.season,
      source: "ai_generated",
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("crops")
      .upsert(rowsToInsert, { onConflict: "category_id,name" })
      .select("id, category_id, name, name_bn, description, description_bn, season, source")
      .returns<CropRow[]>();

    if (insertError) {
      // Generation succeeded but persistence failed — still return the data,
      // just flag that it wasn't saved (next request will retry generation).
      return corsNextResponse(
        {
          ok: true,
          version: API_VERSION,
          category: category.name,
          crops: rowsToInsert,
          source: "ai_generated_unpersisted",
          warning: insertError.message,
        },
        { origin }
      );
    }

    return corsNextResponse(
      { ok: true, version: API_VERSION, category: category.name, crops: inserted, source: "ai_generated" },
      { origin }
    );
  } catch (e) {
    return corsNextResponse(
      { ok: false, version: API_VERSION, error: `AI generation failed: ${(e as Error).message}` },
      { status: 502, origin }
    );
  }
}
