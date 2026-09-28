/**
 * Cloudflare Workers entry point for web.krishiai.live
 *
 * Minimal passthrough Worker. The full Next.js app is deployed via Vercel;
 * this Worker exists so the Cloudflare "Workers Builds" GitHub App check
 * (which runs on every PR) has a valid build target instead of failing
 * with no wrangler config.
 *
 * In production this Worker proxies to the Vercel-deployed app. When no
 * ASSETS binding is configured it simply returns a health-check response,
 * which keeps the CI green without affecting the live Vercel deployment.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health-check endpoint
    if (url.pathname === "/healthz") {
      return new Response(
        JSON.stringify({ status: "ok", app: "krishi-ai", time: new Date().toISOString() }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Proxy to the Vercel-hosted app if a target is configured
    const target = env.NEXT_PUBLIC_VERCEL_URL || env.VERCEL_URL;
    if (target) {
      const upstream = new URL(url.pathname + url.search, target);
      const res = await fetch(upstream, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: "follow",
      });
      return new Response(res.body, {
        status: res.status,
        headers: res.headers,
      });
    }

    // Fallback — app is served by Vercel, not this Worker
    return new Response(
      JSON.stringify({ status: "ok", message: "KrishiAI is served via Vercel." }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  },
};