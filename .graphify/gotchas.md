# Gotchas — Known Issues & Non-Obvious Behaviors

## Critical

1. **No `@react-leaflet`**: Leaflet is used directly (not react-leaflet). Map components are dynamically imported with `{ ssr: false }` because Leaflet requires `window`. If you import Leaflet components without dynamic(), SSR will crash.

2. **ClientShell is required**: `InstallPrompt` cannot be imported directly in `layout.tsx` (a Server Component). `ClientShell.tsx` wraps it with `"use client"` + dynamic import. Don't remove it. ClientShell also registers the service worker.

3. **LocationContext wraps everything**: The entire app body is inside `<LocationProvider>`. All GPS-dependent widgets will break if removed from the tree.

4. **Service worker intercepts all navigations**: `public/sw.js` uses network-first for navigation. If a page fails to load, it serves `/offline`. Test offline behavior by toggling "Offline" in DevTools > Network.

5. **DAM API is unreliable**: `market.dam.gov.bd` often returns 403/timeout from datacenter IPs. The CORS proxy fallback is essential.

## Moderate

6. **NDVI is simulated**: There is NO Sentinel Hub integration. NDVI values are generated deterministically from month + lat/lng. Don't try to add Sentinel Hub API key — it would require a complete rewrite.

7. **Market prices are simulated**: Even when DAM live API works, the response is augmented with seasonal adjustments and daily jitter. Prices are realistic but not real-time market quotes.

8. **News RSS parsing is fragile**: The `parseRSS()` function uses regex-based XML parsing, not a real XML parser. Malformed RSS from .gov.bd sites may silently fail.

9. **Nominatim rate limit**: 1 request/second. The LocationContext caches geocode results in localStorage (24h TTL). Don't add more Nominatim calls without caching. LocationContext no longer auto-requests geolocation on mount — user must click banner/locate-me.

10. **Bengali font loading**: Uses `next/font/google` with `Noto_Sans_Bengali`. The CSS variable `--font-bengali` is applied to `<body>`. If you change fonts, ensure Bengali rendering still works.

11. **Standalone output**: `next.config.ts` sets `output: "standalone"`. This is for Docker deployment. Don't remove it — it's required for production.

12. **Leaflet assets are local copies for PWA**: `public/leaflet.css`, `public/marker-icon*.png`, `public/marker-shadow.png` were downloaded from unpkg and are served locally for offline reliability. Both `InteractiveMap.tsx` and `NDVIMap.tsx` reference these local URLs instead of CDN. If you update Leaflet, re-download these assets.

13. **Cloudflare Workers AI requires env vars**: `CF_ACCOUNT_ID` and `CF_API_TOKEN` must be set in Vercel environment variables. If missing, CF Workers AI is skipped and routes fall through to z-ai-web-dev-sdk. The `.env.local` file has them for local dev but is gitignored.

14. **CF Workers AI response format varies**: CF Workers AI can return either `{ result: { response: "..." } }` or `{ result: { choices: [{ message: { content: "..." } }] } }`. The utility handles both formats, but if Cloudflare changes their API, the parser may break.

15. **`middleware.ts` → `proxy.ts`**: Renamed per Next.js 16 deprecation. The file is now `src/proxy.ts` and the export is `proxy()` instead of `middleware()`. The functionality (IP-based rate limiting for API routes) is identical.

## Minor

16. **Toast redundancy**: Both `@radix-ui/react-toast` and `sonner` are installed. Only `sonner` is used (via `<Toaster />` in layout). The Radix toast is unused.

17. **Upload directory**: Added to `.gitignore`. Was causing `EBUSY` errors during builds. Don't recreate it.

18. **Package-lock.json exists alongside bun.lock**: Both lockfiles present. Bun uses `bun.lock`, npm uses `package-lock.json`. The npm one is likely stale.

19. **No Cloudflare Worker anymore**: `src/workers/`, `wrangler.toml`, `tsconfig.worker.json`, `.github/workflows/deploy-full.yml`, and `@cloudflare/workers-types` were all removed. Vercel alone handles everything. The GitHub Actions deploy workflow was also removed.

20. **Production branch is `v4.0`**: Not `main`, `production`, or `production-v2`. The Vercel production branch must be set to `v4.0` in the Vercel Dashboard > Settings > Git.

21. **SW cache invalidation**: The SW version is `"v1"` in `public/sw.js`. When deploying new SW logic, increment the `CACHE_VERSION` constant to force re-caching of all assets.
