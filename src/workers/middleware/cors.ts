/**
 * CORS middleware for the API gateway
 *
 * Handles:
 * - Origin whitelist validation
 * - Preflight OPTIONS responses
 * - Standard CORS headers
 */

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "https://web.krishiai.live",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key, CF-Connecting-IP",
  "Access-Control-Expose-Headers": "X-Upstream-Status, X-Route, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
  "Access-Control-Max-Age": "86400",
};

export function handleCORS(req: Request, allowedOrigins?: string[]): Response {
  const origin = req.headers.get("Origin") || req.headers.get("Referer") || "";
  const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
  const isAllowed = allowedOrigins
    ? allowedOrigins.some((o) => origin.startsWith(o))
    : origin.includes("web.krishiai.live");

  const finalOrigin = isLocalhost || isAllowed ? origin : "https://web.krishiai.live";

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": finalOrigin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
      "Access-Control-Expose-Headers": "X-Upstream-Status, X-RateLimit-Limit",
      "Access-Control-Max-Age": "86400",
    },
  });
}
