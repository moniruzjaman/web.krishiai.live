# Deployment Guide

## Vercel (Primary — Next.js)
- **Domain:** web.krishiai.live
- **Region:** hkg1 (Hong Kong)
- **Build:** `bun run build`
- **Install:** `bun install`
- **Framework:** Next.js (auto-detected)
- **Env vars:** Set `CF_ACCOUNT_ID`, `CF_API_TOKEN`, and optionally `CF_GATEWAY_URL` in Vercel dashboard

## Cloudflare Workers (Edge AI Gateway)
- **Worker name:** webkrishiailive
- **Entry point:** `src/workers/index.ts`
- **Config:** `wrangler.toml`
- **AI binding:** Native `env.AI.run()` (no REST + Bearer token)
- **Routes:**
  - `GET  /health` — Health check
  - `POST /api/chat` — Bengali agricultural chat
  - `POST /api/diagnose` — CABI crop diagnosis
  - `POST /api/analyze` — General AI analysis
- **Deploy:** `wrangler deploy` or auto-deploy via GitHub Actions on `main` push
- **Dev:** `wrangler dev`

### CF Worker vs Vercel API Routes
Both the CF Worker and Vercel API routes provide AI capabilities, but:
- **CF Worker** uses native AI binding (in-process, faster) and runs on CF's edge globally
- **Vercel routes** use REST API or gateway call (server-side, credentials secured)
- They serve different purposes: Worker = edge-optimized AI, Vercel = full app with all features

## GitHub Actions
- **Workflow:** `.github/workflows/deploy-full.yml`
- **Triggers:** Push to `main`, `production`, `production-v2`
- **Validate job:** Bun install + lint + build + check wrangler.toml exists
- **Deploy job:** `wrangler deploy` on `main` branch only (requires `CLOUDFLARE_API_TOKEN` secret)

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
3. CF Worker health: `https://webkrishiailive.<account>.workers.dev/health`
4. Weather widget shows data (Open-Meteo)
5. Chat widget responds (CF Workers AI)
6. Map loads with markers (OpenStreetMap/Leaflet)
7. Market prices display (DAM + fallback)
