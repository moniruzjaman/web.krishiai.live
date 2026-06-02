/**
 * CORS middleware for the API gateway
 */

export const ALLOWED_ORIGINS = [
  "https://krishiai.live",
  "https://www.krishiai.live",
  "https://web.krishiai.live",
] as const;

export function resolveOrigin(origin: string | null): string {
  if (!origin) return "https://web.krishiai.live";
  const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
  if (isLocalhost) return origin;
  if (ALLOWED_ORIGINS.some((o) => origin === o)) return origin;
  return "https://web.krishiai.live";
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const acao = resolveOrigin(origin);
  return {
    "Access-Control-Allow-Origin": acao,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key, CF-Connecting-IP",
    "Access-Control-Expose-Headers": "X-Upstream-Status, X-Route, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function handleCORS(req: Request): Response {
  const origin = req.headers.get("Origin") || req.headers.get("Referer") || "";
  const acao = resolveOrigin(origin);

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": acao,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
      "Access-Control-Expose-Headers": "X-Upstream-Status, X-Route, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    },
  });
}
