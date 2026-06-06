# Deployment Guide

## Vercel (Primary)
- **Domain:** web.krishiai.live
- **Region:** hkg1 (Hong Kong)
- **Build:** `bun run build`
- **Install:** `bun install`
- **Framework:** Next.js (auto-detected)
- **Env vars:** Set `CF_ACCOUNT_ID` and `CF_API_TOKEN` in Vercel dashboard

## What NOT to Deploy
- ❌ **No Cloudflare Pages deployment** — `wrangler.toml` has been removed
- ❌ **No CF Workers deployment** — `src/workers/` has been removed
- ❌ **No CF AI Gateway** — Vercel API routes are the gateway

## Branches
All branches are synced to the same commit:
- `main`
- `production`
- `production-v2`

## Push Workflow
```bash
git add -A
git commit -m "descriptive message"
git push origin main
git push origin production
git push origin production-v2
```

## PWA
- Manifest at `public/manifest.json`
- Service worker via Next.js built-in PWA support
- Install prompt handled by `InstallPrompt.tsx`
- Apple Web App meta tags in `layout.tsx`

## Verification
After deployment, verify:
1. `https://web.krishiai.live` loads
2. `/api` health check returns `{"ok":true}`
3. Weather widget shows data (Open-Meteo)
4. Chat widget responds (CF Workers AI)
5. Map loads with markers (OpenStreetMap/Leaflet)
6. Market prices display (DAM + fallback)
