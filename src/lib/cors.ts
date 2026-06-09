/**
 * KrishiAI — Centralized CORS Utility
 *
 * Single source of truth for CORS headers across all API routes.
 * Import this instead of duplicating ALLOWED_ORIGINS + corsHeaders in every route.
 */

export const ALLOWED_ORIGINS = [
  "https://krishiai.live",
  "https://www.krishiai.live",
  "https://web.krishiai.live",
] as const;

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";

/**
 * Generate CORS headers for a response.
 * Allows requests from known origins, localhost, and 127.0.0.1.
 */
export function corsHeaders(
  origin: string | null,
  methods: HttpMethod[] = ["GET", "OPTIONS"]
): Record<string, string> {
  const allowed =
    !!origin &&
    (origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      (ALLOWED_ORIGINS as readonly string[]).includes(origin));

  return {
    "Access-Control-Allow-Origin": allowed
      ? origin
      : "https://krishiai.live",
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