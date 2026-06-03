/**
 * Rate Limiting middleware for the API gateway
 */

const globalBuckets = new Map<string, { count: number; reset: number }>();

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
