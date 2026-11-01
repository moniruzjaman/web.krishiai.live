/**
 * rate-limit.ts — Lightweight in-memory rate limiting for AI-backed endpoints
 *
 * Protects quota-expensive routes (/api/chat, /api/copilot, /api/diagnose, …)
 * from anonymous abuse without breaking legitimate use:
 *   - Authenticated Supabase users are keyed by user id (generous limit).
 *   - Anonymous visitors are keyed by IP (moderate limit per window).
 *
 * Note: serverless instances each keep their own counters, so limits are
 * best-effort per instance — which is exactly what's needed to blunt
 * automated quota-drain attacks while keeping the free platform usable.
 */

import { NextRequest } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically drop stale entries so the map can't grow unbounded.
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Check and consume one request from the caller's bucket.
 * Returns `ok: false` when the limit for the window is exhausted.
 */
export async function checkRateLimit(
  request: NextRequest,
  feature: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  sweep(now);

  // Prefer authenticated identity; fall back to IP.
  let identity = "anon";
  try {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) identity = `u:${user.id}`;
  } catch {
    /* Supabase not configured — fall through to IP-based keying */
  }

  if (identity === "anon") {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "local";
    identity = `ip:${ip}`;
  }

  const key = `${feature}:${identity}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count++;
  return { ok: true, remaining: limit - bucket.count, retryAfterSec: 0 };
}
