/**
 * In-memory sliding-window rate limiter.
 *
 * Used to throttle anonymous (not-logged-in) traffic on a per-IP / per-key basis
 * before any AI provider call is made. This protects the platform from abuse
 * even when Supabase auth is not in play (the Supabase-backed `quota.ts` only
 * enforces limits for authenticated users — anonymous users were previously
 * unlimited, which is the rate-limit hole we close here).
 *
 * Design notes:
 *  - Pure in-memory Map. Each entry stores an array of request timestamps.
 *  - Sliding window: on every check, drop timestamps older than `windowMs`
 *    and reject if the remaining count >= `maxRequests`.
 *  - Self-pruning: empty buckets are deleted to prevent memory growth.
 *  - Edge-runtime safe: no Node-specific APIs, no setTimeout leaks.
 *
 * Limits are conservative for a free hobby-tier deployment. Tune via env if
 * needed: RATE_LIMIT_PER_MINUTE_ANON, RATE_LIMIT_PER_MINUTE_DIAGNOSE.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  key: string;
  namespace: string;
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  current: number;
  limit: number;
}

export function checkRateLimit(opts: RateLimitOptions): RateLimitResult {
  const compositeKey = `${opts.namespace}::${opts.key}`;
  const now = Date.now();
  const cutoff = now - opts.windowMs;

  let bucket = buckets.get(compositeKey);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(compositeKey, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter(t => t > cutoff);

  const current = bucket.timestamps.length;
  if (current >= opts.maxRequests) {
    const oldest = bucket.timestamps[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, oldest + opts.windowMs - now),
      current,
      limit: opts.maxRequests,
    };
  }

  bucket.timestamps.push(now);
  return {
    allowed: true,
    remaining: opts.maxRequests - bucket.timestamps.length,
    retryAfterMs: 0,
    current: bucket.timestamps.length,
    limit: opts.maxRequests,
  };
}

export function peekRateLimit(namespace: string, key: string): { current: number; remaining: number } | null {
  const compositeKey = `${namespace}::${key}`;
  const bucket = buckets.get(compositeKey);
  if (!bucket) return null;
  return {
    current: bucket.timestamps.length,
    remaining: Math.max(0, 0 - bucket.timestamps.length),
  };
}

export function gcRateLimitBuckets(): number {
  let pruned = 0;
  for (const [k, b] of buckets.entries()) {
    if (b.timestamps.length === 0) {
      buckets.delete(k);
      pruned++;
    }
  }
  return pruned;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export const ANON_DIAGNOSE_RPM = envInt('RATE_LIMIT_PER_MINUTE_DIAGNOSE', 8);
export const ANON_CHAT_RPM = envInt('RATE_LIMIT_PER_MINUTE_CHAT', 12);
export const AUTH_RPM = envInt('RATE_LIMIT_PER_MINUTE_AUTH', 30);
export const WINDOW_MS = envInt('RATE_LIMIT_WINDOW_MS', 60_000);

export function resolveClientIp(req: Request): string {
  const headers = req.headers;
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return 'unknown-ip';
}

export function msToRetryAfterSeconds(ms: number): number {
  return Math.max(1, Math.ceil(ms / 1000));
}
