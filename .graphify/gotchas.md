# Gotchas — Known Issues & Non-Obvious Behaviors

## Critical

1. **No `@react-leaflet`**: Leaflet is used directly (not react-leaflet). Map components are dynamically imported with `{ ssr: false }` because Leaflet requires `window`. If you import Leaflet components without dynamic(), SSR will crash.

2. **ClientShell is required**: `InstallPrompt` cannot be imported directly in `layout.tsx` (a Server Component). `ClientShell.tsx` wraps it with `"use client"` + dynamic import. Don't remove it.

3. **LocationContext wraps everything**: The entire app body is inside `<LocationProvider>`. All GPS-dependent widgets will break if removed from the tree.

4. **TypeScript ignoreBuildErrors**: Set to `true` in next.config.ts. Build will succeed even with TS errors. Check types manually before changes.

5. **DAM API is unreliable**: `market.dam.gov.bd` often returns 403/timeout from datacenter IPs. The CORS proxy fallback is essential.

## Moderate

6. **NDVI is simulated**: There is NO Sentinel Hub integration. NDVI values are generated deterministically from month + lat/lng. Don't try to add Sentinel Hub API key — it would require a complete rewrite.

7. **Market prices are simulated**: Even when DAM live API works, the response is augmented with seasonal adjustments and daily jitter. Prices are realistic but not real-time market quotes.

8. **News RSS parsing is fragile**: The `parseRSS()` function uses regex-based XML parsing, not a real XML parser. Malformed RSS from .gov.bd sites may silently fail.

9. **Nominatim rate limit**: 1 request/second. The LocationContext caches geocode results in localStorage (24h TTL). Don't add more Nominatim calls without caching.

10. **Bengali font loading**: Uses `next/font/google` with `Noto_Sans_Bengali`. The CSS variable `--font-bengali` is applied to `<body>`. If you change fonts, ensure Bengali rendering still works.

11. **Standalone output**: `next.config.ts` sets `output: "standalone"`. This is for Docker deployment. Don't remove it — it's required for production.

12. **React Strict Mode off**: `reactStrictMode: false` in next.config. This was intentional (likely to avoid double-render effects with Leaflet/GPS). Turning it on may cause map/GPS issues.

13. **`noImplicitAny: false`**: TypeScript is in relaxed mode. Function parameters may lack explicit types. Be careful when refactoring.

14. **Cloudflare Workers AI requires env vars**: `CF_ACCOUNT_ID` and `CF_API_TOKEN` must be set in Vercel environment variables. If missing, CF Workers AI is skipped and routes fall through to z-ai-web-dev-sdk. The `.env.local` file has them for local dev but is gitignored.

15. **CF Workers AI response format varies**: CF Workers AI can return either `{ result: { response: "..." } }` or `{ result: { choices: [{ message: { content: "..." } }] } }`. The utility handles both formats, but if Cloudflare changes their API, the parser may break.

## Minor

14. **Toast redundancy**: Both `@radix-ui/react-toast` and `sonner` are installed. Only `sonner` is used (via `<Toaster />` in layout). The Radix toast is unused.

15. **Upload directory**: Added to `.gitignore`. Was causing `EBUSY` errors during builds. Don't recreate it.

16. **Package-lock.json exists alongside bun.lock**: Both lockfiles present. Bun uses `bun.lock`, npm uses `package-lock.json`. The npm one is likely stale.

17. **Workers are not deployed**: `src/workers/` contains the Cloudflare Worker code but it's deployed separately from the Next.js app. Changes to workers don't affect Vercel deployment.

18. **`mini-services/` directory**: Exists in root but purpose unclear. Not referenced by Next.js build.

19. **GitHub PAT**: A personal access token was used in previous sessions for pushing. If expired, generate a new one from GitHub Settings > Developer Tokens with repo scope.

20. **All 3 branches should stay synced**: main, production, production-v2 all point to the same commit. When pushing, update all three.
