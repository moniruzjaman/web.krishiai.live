/**
 * KrishiAI — Centralized CORS Utility
 *
 * Single source of truth for CORS headers across all API routes.
 * Import this instead of duplicating ALLOWED_ORIGINS + corsHeaders in every route.
 *
 * Widened for the shared /api/v1 platform surface: any *.krishiai.live
 * subdomain is allowed (web, cabi, game, api, and future subdomains) so
 * other KrishiAI projects can call this API directly from the browser.
 * Native apps (Expo/React Native fetch) are not subject to CORS at all,
 * so the mobile app is unaffected either way.
 */

const ALLOWED_ORIGIN_SUFFIX = ".krishiai.live";

export const ALLOWED_ORIGINS = [
  "https://krishiai.live",
  "https://www.krishiai.live",
  "https://web.krishiai.live",
  "https://cabi.krishiai.live",
  "https://game.krishiai.live",
  "https://api.krishiai.live",
] as const;

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";

function isAllowedOrigin(origin: string): boolean {
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) return true;
  if ((ALLOWED_ORIGINS as readonly string[]).includes(origin)) return true;
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === "https:" && hostname.endsWith(ALLOWED_ORIGIN_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * Generate CORS headers for a response.
 * Allows requests from any *.krishiai.live subdomain, localhost, and 127.0.0.1.
 */
export function corsHeaders(
  origin: string | null,
  methods: HttpMethod[] = ["GET", "OPTIONS"]
): Record<string, string> {
  const allowed = !!origin && isAllowedOrigin(origin);

  return {
    "Access-Control-Allow-Origin": allowed
      ? origin
      : "https://krishiai.live",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": [...new Set([...methods, "OPTIONS"])].join(", "),
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

/**
 * Handle OPTIONS preflight requests — returns 204 with CORS headers.
 */
export function handleOptions(
  origin: string | null,
  methods: HttpMethod[] = ["GET", "OPTIONS"]
): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin, methods),
  });
}

/**
 * Standard CORS-safe NextResponse helper for route.ts files.
 */
import { NextResponse } from "next/server";

export function corsNextResponse(
  body: unknown,
  init?: {
    status?: number;
    headers?: Record<string, string>;
    origin?: string | null;
    methods?: HttpMethod[];
  }
) {
  const { status = 200, headers = {}, origin = null, methods } = init ?? {};
  return NextResponse.json(body, {
    status,
    headers: {
      ...corsHeaders(origin, methods),
      ...headers,
    },
  });
}