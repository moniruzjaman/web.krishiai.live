/**
 * Rate Limiting middleware for the API gateway
 */

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const globalBuckets = new Map<string, { count: number; reset: number }>();

export function createRateLimiter(limit = 100, windowMs = 60_000): (clientId: string) => { allowed: boolean; remaining: number; reset: number } {
  const bucket = new Map<string, { count: number; reset: number }>();
  const windowSec = Math.floor(windowMs / 1000);

  return (clientId: string) => {
    const now = Date.now();
    const entry = bucket.get(clientId);

    if (!entry || now > entry.reset) {
      bucket.set(clientId, { count: 1, reset: now + windowMs });
      return { allowed: true, remaining: limit - 1, reset: windowSec };
    }

    entry.count++;
    const remaining = limit - entry.count;

    if (remaining <= 0) {
      return { allowed: false, remaining: 0, reset: Math.ceil((entry.reset - now) / 1000) };
    }

    if (bucket.size > 10000) {
      for (const [k, v] of bucket) {
        if (v.reset < now - windowMs) bucket.delete(k);
      }
    }

    return { allowed: true, remaining, reset: Math.ceil((entry.reset - now) / 1000) };
  };
}

export function checkRateLimiter(
  clientId: string,
  limit = 100,
  windowSec = 60
): { allowed: boolean; remaining: number; reset: number } {
  const windowMs = windowSec * 1000;
  const now = Date.now();
  const entry = globalBuckets.get(clientId);

  if (!entry || now > entry.reset) {
    globalBuckets.set(clientId, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1, reset: windowSec };
  }

  entry.count++;
  const remaining = limit - entry.count;

  if (remaining <= 0) {
    return { allowed: false, remaining: 0, reset: Math.ceil((entry.reset - now) / 1000) };
  }

  if (globalBuckets.size > 10000) {
    for (const [k, v] of globalBuckets) {
      if (v.reset < now - windowMs) globalBuckets.delete(k);
    }
  }

  return { allowed: true, remaining, reset: Math.ceil((entry.reset - now) / 1000) };
}
