/**
 * KrishiAI — Rate Limiting & Security Proxy
 *
 * In-memory IP-based rate limiter for API routes.
 * Uses a sliding window counter with per-IP tracking.
 *
 * Limits:
 *   - /api/diagnose: 10 requests/minute (heavy AI compute)
 *   - /api/chat:     20 requests/minute (AI chat)
 *   - /api/*:        60 requests/minute (general)
 */

import { NextRequest, NextResponse } from "next/server";

// ── Rate Limit Configuration ─────────────────────────────────────────────────
interface RateLimitRule {
  pathPrefix: string;
  maxRequests: number;
  windowMs: number;
}

const RATE_LIMITS: RateLimitRule[] = [
  { pathPrefix: "/api/diagnose", maxRequests: 10, windowMs: 60_000 },
  { pathPrefix: "/api/chat", maxRequests: 20, windowMs: 60_000 },
  { pathPrefix: "/api/", maxRequests: 60, windowMs: 60_000 },
];

// ── In-Memory Store ──────────────────────────────────────────────────────────
interface RequestRecord {
  count: number;
  windowStart: number;
}

const ipStore = new Map<string, Map<string, RequestRecord>>();

// Clean up old entries every 2 minutes
const CLEANUP_INTERVAL = 120_000;
let lastCleanup = Date.now();

function cleanupStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [ip, pathMap] of ipStore.entries()) {
    for (const [key, record] of pathMap.entries()) {
      if (now - record.windowStart > 120_000) {
        pathMap.delete(key);
      }
    }
    if (pathMap.size === 0) {
      ipStore.delete(ip);
    }
  }
}

// ── Rate Limit Check ─────────────────────────────────────────────────────────
function checkRateLimit(ip: string, pathname: string): { allowed: boolean; limit: number; remaining: number; resetAt: number } {
  cleanupStore();

  // Find the most specific matching rule
  let matchedRule: RateLimitRule | undefined;
  for (const rule of RATE_LIMITS) {
    if (pathname.startsWith(rule.pathPrefix)) {
      if (!matchedRule || rule.pathPrefix.length > matchedRule.pathPrefix.length) {
        matchedRule = rule;
      }
    }
  }

  if (!matchedRule) {
    return { allowed: true, limit: 0, remaining: Infinity, resetAt: 0 };
  }

  const now = Date.now();
  const storeKey = matchedRule.pathPrefix;

  // Get or create IP entry
  if (!ipStore.has(ip)) {
    ipStore.set(ip, new Map());
  }
  const pathMap = ipStore.get(ip)!;

  if (!pathMap.has(storeKey)) {
    pathMap.set(storeKey, { count: 1, windowStart: now });
    return {
      allowed: true,
      limit: matchedRule.maxRequests,
      remaining: matchedRule.maxRequests - 1,
      resetAt: now + matchedRule.windowMs,
    };
  }

  const record = pathMap.get(storeKey)!;

  // Reset window if expired
  if (now - record.windowStart >= matchedRule.windowMs) {
    record.count = 1;
    record.windowStart = now;
    return {
      allowed: true,
      limit: matchedRule.maxRequests,
      remaining: matchedRule.maxRequests - 1,
      resetAt: now + matchedRule.windowMs,
    };
  }

  // Increment count
  record.count++;

  if (record.count > matchedRule.maxRequests) {
    return {
      allowed: false,
      limit: matchedRule.maxRequests,
      remaining: 0,
      resetAt: record.windowStart + matchedRule.windowMs,
    };
  }

  return {
    allowed: true,
    limit: matchedRule.maxRequests,
    remaining: matchedRule.maxRequests - record.count,
    resetAt: record.windowStart + matchedRule.windowMs,
  };
}

// ── Get Client IP ────────────────────────────────────────────────────────────
function getClientIP(request: NextRequest): string {
  // Check headers set by Vercel / CF / reverse proxy
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }
  return "unknown";
}

// ── Proxy ─────────────────────────────────────────────────────────────────────
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ip = getClientIP(request);
  const result = checkRateLimit(ip, pathname);

  // Add rate limit headers to all responses
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(Math.ceil((result.resetAt - Date.now()) / 1000));

    // Return Bengali error message for rate-limited requests
    const isDiagnose = pathname.startsWith("/api/diagnose");
    const isChat = pathname.startsWith("/api/chat");
    const message = isDiagnose
      ? "অনেকবার রোগ নির্ণয়ের অনুরোধ করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।"
      : isChat
        ? "অনেকবার চ্যাট বার্তা পাঠানো হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।"
        : "অতিরিক্ত অনুরোধ। কিছুক্ষণ পর আবার চেষ্টা করুন।";

    return NextResponse.json(
      { ok: false, error: message, retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000) },
      { status: 429, headers }
    );
  }

  const response = NextResponse.next();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// ── Matcher ──────────────────────────────────────────────────────────────────
export const config = {
  matcher: ["/api/:path*"],
};
