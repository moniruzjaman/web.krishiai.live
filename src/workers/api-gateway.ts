/**
 * KrishiAI Unified API Gateway — Cloudflare Worker
 *
 * Centralizes all API access through Cloudflare's edge network.
 * Routes requests to upstream Vercel Next.js API routes with:
 * - CORS handling
 * - Rate limiting per origin/client
 * - Response caching (KV-backed, graceful fallback to in-memory)
 * - Request validation & sanitization
 * - Logging & observability hooks
 */

import { checkRateLimiter } from "./middleware/rate-limit";
import { corsHeaders, handleCORS } from "./middleware/cors";

// ── Types ────────────────────────────────────────────────────────────────────
interface Env {
  // KV namespace for caching (optional — if not bound, falls back to in-memory)
  KV?: KVNamespace;
  // Rate limiter DO (optional)
  RATE_LIMITER?: DurableObjectNamespace;
}

interface UpstreamRoute {
  pattern: RegExp;
  upstream: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  cacheTtl?: number;
  auth?: boolean;
  description: string;
}

// ── In-memory cache fallback (per-isolate) ──────────────────────────────────
const memoryCache = new Map<string, { data: ResponseInit; expires: number }>();
const MEMORY_CACHE_TTL = 60_000; // 60s per-isolate cache

// ── Route Configuration ──────────────────────────────────────────────────────
const ROUTES: UpstreamRoute[] = [
  {
    pattern: /^\/api\/weather$/,
    upstream: "https://web.krishiai.live/api/weather",
    method: "GET",
    cacheTtl: 600,
    description: "Weather data — Open-Meteo proxy",
  },
  {
    pattern: /^\/api\/market$/,
    upstream: "https://web.krishiai.live/api/market",
    method: "GET",
    cacheTtl: 3600,
    description: "Market prices — DAM + seasonal fallback",
  },
  {
    pattern: /^\/api\/news$/,
    upstream: "https://web.krishiai.live/api/news",
    method: "GET",
    cacheTtl: 1800,
    description: "News — .gov.bd RSS + Google News + AI bulletin",
  },
  {
    pattern: /^\/api\/?$/,
    upstream: "https://web.krishiai.live/api",
    method: "GET",
    cacheTtl: 300,
    description: "API health & info endpoint",
  },
];

// ── Upstream endpoints by category ──────────────────────────────────────────
const UPSTREAMS: Record<string, string[]> = {
  weather: ["https://api.open-meteo.com/v1/forecast", "https://web.krishiai.live/api/weather"],
  market: ["https://market.dam.gov.bd/api/commodity-price", "https://market.dam.gov.bd/api/today-price", "https://web.krishiai.live/api/market"],
  news: ["https://news.google.com/rss/search", "https://dae.gov.bd/site/rss", "https://brri.gov.bd/site/rss", "https://api.allorigins.win/raw", "https://web.krishiai.live/api/news"],
  gov: ["https://bari.gov.bd/site/rss", "https://badc.gov.bd/site/rss", "https://moa.gov.bd/site/rss", "https://web.krishiai.live/api/news"],
  intl: ["https://www.fao.org/news/rss/crop-production.xml", "https://www.ifpri.org/rss.xml", "https://www.irri.org/rss.xml", "https://web.krishiai.live/api/news"],
};

// ── Helper: Build cache key ──────────────────────────────────────────────────
function cacheKey(req: Request): string {
  const url = new URL(req.url);
  return `${req.method}:${url.pathname}:${url.search}`;
}

// ── Helper: Get from KV cache ────────────────────────────────────────────────
async function getFromKV(env: Env, key: string): Promise<Response | null> {
  if (!env.KV) return null;
  try {
    const cached = await env.KV.get(key, "json");
    if (cached) {
      const { data, expires, headers } = cached as { data: unknown; expires: number; headers: Record<string, string> };
      if (Date.now() < expires) {
        return new Response(JSON.stringify(data), { headers });
      }
      // Expired — delete asynchronously
      env.KV.delete(key).catch(() => {});
    }
  } catch {
    // KV read failed — fall back
  }
  return null;
}

// ── Helper: Set KV cache ─────────────────────────────────────────────────────
async function setInKV(env: Env, key: string, data: unknown, ttl: number, baseHeaders: Record<string, string>) {
  if (!env.KV) return;
  try {
    await env.KV.put(key, JSON.stringify({
      data,
      expires: Date.now() + ttl * 1000,
      headers: baseHeaders,
    }), { expirationTtl: ttl });
  } catch {
    // KV write failed — non-critical
  }
}

// ── Helper: Get from memory cache ────────────────────────────────────────────
function getFromMemory(key: string): Response | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    memoryCache.delete(key);
    return null;
  }
  return new Response(JSON.stringify(entry.data), { headers: entry.data.headers });
}

function setInMemory(key: string, data: unknown, ttl: number, baseHeaders: Record<string, string>) {
  memoryCache.set(key, {
    data,
    expires: Date.now() + ttl * 1000,
  });
}

// ── Main Worker Entry Point ──────────────────────────────────────────────────
export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const ip = url.hostname; // Use real client IP via CF headers in production
    const clientIp = req.headers.get("CF-Connecting-IP") || "unknown";

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return handleCORS(req);
    }

    // ── Root path — health info ──────────────────────────────────────────────
    if (url.pathname === "/" && req.method === "GET") {
      return new Response(
        JSON.stringify({
          ok: true,
          service: "KrishiAI Unified API Gateway (Cloudflare)",
          version: "1.0.0",
          description: "Bangladesh Agriculture AI Platform — Centralized Edge API",
          endpoints: {
            weather: "/api/weather",
            market: "/api/market",
            news: "/api/news",
            health: "/api",
          },
          upstreams: UPSTREAMS,
          sources: {
            weather: "Open-Meteo · BMD (via Next.js proxy)",
            market: "DAM live · market.dam.gov.bd (via Next.js proxy)",
            news: "Google News RSS · .gov.bd RSS · FAO · IRRI · IFPRI (via Next.js proxy)",
            gov: "DAE · BRRI · BARI · BADC · MoA · BMD → RSS + Google News",
            intl: "FAO · IFPRI · IRRI · CGIAR · World Bank",
          },
          deployed: {
            vercel: "web.krishiai.live (Next.js standalone, Docker-ready)",
            cloudflare: "Cloudflare Workers (this gateway)",
            github: "moniruzjaman/web.krishiai.live",
          },
          rateLimit: {
            max: 100,
            windowSec: 60,
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // ── Find matching API route ──────────────────────────────────────────────
    const matchedRoute = ROUTES.find((r) => r.pattern.test(url.pathname));
    if (!matchedRoute) {
      return new Response(
        JSON.stringify({ ok: false, error: "Not Found", message: `Route ${url.pathname} not configured in API gateway` }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ── Enforce CORS Origin whitelist ────────────────────────────────────────
    const allowedOrigins = [
      "https://krishiai.live",
      "https://www.krishiai.live",
      "https://web.krishiai.live",
    ];
    const origin = req.headers.get("Origin") || req.headers.get("Referer") || "";
    const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
    const isAllowed = allowedOrigins.some((o) => origin.startsWith(o));
    if (!isLocalhost && !isAllowed) {
      return new Response(
        JSON.stringify({ ok: false, error: "CORS rejected", origin }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ── Rate limiting ────────────────────────────────────────────────────────
    if (!checkRateLimiter(typeof clientIp === "string" ? clientIp : "unknown", 100, 60_000)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Rate limit exceeded", retryAfterSec: 60 }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders, "Retry-After": "60" } }
      );
    }

    // ── Auth (if route requires it) ──────────────────────────────────────────
    if (matchedRoute.auth && !checkAuth(req)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized", message: "Provide Authorization: Bearer <token> or X-API-Key header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ── Try cache (KV first, then memory, then upstream) ─────────────────────
    const cacheKeyStr = cacheKey(req);

    // Try KV cache
    const kvCached = await getFromKV(env, cacheKeyStr);
    if (kvCached) {
      return kvCached;
    }

    // Try memory cache
    const memCached = getFromMemory(cacheKeyStr);
    if (memCached) {
      return memCached;
    }

    // ── Fetch from upstream (with timeout) ───────────────────────────────────
    const upstreamUrl = new URL(matchedRoute.upstream);
    upstreamUrl.search = url.search;
    upstreamUrl.hash = url.hash;

    let upstreamResp: Response;
    try {
      upstreamResp = await fetch(upstreamUrl.toString(), {
        method: matchedRoute.method,
        headers: {
          "User-Agent": "KrishiAI-Gateway/1.0",
          "X-Forwarded-For": req.headers.get("CF-Connecting-IP") || "",
          "X-Forwarded-Host": url.host,
          "X-Forwarded-Proto": req.headers.get("CF-Visitor-Scheme") || "https",
        },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: "Upstream timeout", upstream: matchedRoute.upstream }),
        { status: 504, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ── Build response with CORS & caching headers ───────────────────────────
    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...corsHeaders,
      "X-Upstream-Status": upstreamResp.status.toString(),
      "X-Route": matchedRoute.description,
    };

    // Add cache headers based on route
    if (matchedRoute.cacheTtl) {
      responseHeaders["Cache-Control"] = `public, s-maxage=${matchedRoute.cacheTtl}, stale-while-revalidate=60`;
    }

    const responseBody = await upstreamResp.text();
    const responseData = {
      ok: upstreamResp.ok,
      status: upstreamResp.status,
      gateway: "cloudflare-workers",
      upstream: matchedRoute.upstream,
      timestamp: new Date().toISOString(),
      data: JSON.parse(responseBody),
    };

    const finalResponse = new Response(JSON.stringify(responseData), {
      status: upstreamResp.status,
      headers: responseHeaders,
    });

    // ── Store in cache (fire-and-forget via ctx.waitUntil) ───────────────────
    const ttl = matchedRoute.cacheTtl || 60;
    ctx.waitUntil(
      (async () => {
        // KV cache
        if (env.KV) {
          await setInKV(env, cacheKeyStr, responseData, ttl, responseHeaders);
        }
        // Memory cache
        setInMemory(cacheKeyStr, responseData, ttl, responseHeaders);
      })()
    );

    return finalResponse;
  },
} satisfies ExportedHandler<Env>;
