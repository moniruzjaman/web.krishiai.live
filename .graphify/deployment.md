# Deployment Guide

## Vercel (Primary — Next.js)
- **Domain:** web.krishiai.live
- **Build:** `bun run build`
- **Install:** `bun install`
- **Framework:** Next.js (auto-detected)
- **Production branch:** `v4.0` (set in Vercel Dashboard > Settings > Git)
- **Env vars:** Set `CF_ACCOUNT_ID` and `CF_API_TOKEN` in Vercel dashboard
- **Deploy:** Vercel Git integration auto-deploys from `v4.0` branch. Manual deploy via `npx vercel --prod`

## No Cloudflare Worker or GitHub Actions
- CF Worker (`src/workers/`), `wrangler.toml`, and `.github/workflows/deploy-full.yml` have been removed
- No separate edge gateway — Vercel handles all routing and API logic
- Rate limiting is done by `src/proxy.ts` (in-process, no external service needed)

## Push Workflow
```bash
git add -A
git commit -m "descriptive message"
git push origin v4.0
```

## PWA
- Manifest at `public/manifest.json` (scope, display_override, edge_side_panel configured)
- Custom service worker at `public/sw.js` (3-tier caching: static cache-first, API network-first, nav offline fallback)
- Offline fallback page at `src/app/offline/page.tsx`
- Service worker registered by `ClientShell.tsx` on mount
- Leaflet CSS and marker icons served locally from `public/` for offline PWA support

## Verification
After deployment, verify:
1. `https://web.krishiai.live` loads
2. `/api` health check returns `{"ok":true}`
3. Weather widget shows data (Open-Meteo)
4. Chat widget responds (CF Workers AI)
5. Map loads with markers (OpenStreetMap/Leaflet) — both street and satellite
6. Market prices display (DAM + fallback)
7. Service worker installed (check Application > Service Workers in DevTools)
8. Offline fallback works (DevTools > Network > Offline)
