# KrishiAI — Project Overview

## Identity
- **Name:** KrishiAI (কৃষি AI)
- **URL:** https://web.krishiai.live
- **Stack:** Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + TypeScript
- **Runtime:** Bun (build + install) | Vercel (deploy, HK region)
- **Repo:** github.com/moniruzzaman/web.krishiai.live
- **Branches:** main, production, production-v2 (all synced to same commit)

## Purpose
Bengali-first AI agricultural platform for Bangladesh farmers.
Provides crop disease diagnosis, weather forecasts, market prices, news, soil analysis, NDVI maps, and AI chat — all in Bengali.

## Architecture
```
User → Vercel (web.krishiai.live)
         ├── Service Worker (public/sw.js) — offline fallback, caching
         └── Next.js App (pages + API routes)
              │
              ├── proxy.ts (rate limiter: 10/20/60 rpm per IP)
              │
              └── API Routes (server-side AI):
                    └── CF Workers AI REST (direct, no edge gateway)
                    ├── /api/diagnose   → 8-provider waterfall
                    ├── /api/chat       → CF Workers AI + fallback
                    ├── /api/weather    → Open-Meteo (free, no key)
                    ├── /api/market     → DAM live + seasonal fallback
                    ├── /api/news       → Google News + .gov.bd RSS + FAO/IRRI
                    └── ... etc.
```

## AI Architecture
- **Single Path:** Direct CF Workers AI REST API using `CF_ACCOUNT_ID` + `CF_API_TOKEN` (edge gateway and dual-path routing removed)
- **Module:** `src/lib/cloudflareAI.ts` — simplified single-path client for Next.js routes

## Key Directories
| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages + API routes |
| `src/components/` | React components (widgets, maps, nav) |
| `src/context/` | React Context providers (LocationContext) |
| `src/lib/` | Shared utilities, AI client, crop data |
| `src/lib/cabi/` | Offline CABI Plantwise diagnostic engine |
| `src/proxy.ts` | API rate limiter (replaces deprecated middleware.ts) |
| `public/sw.js` | Service worker (3-tier caching, offline fallback) |
| `public/data/` | Static JSON data (AEZ zones, crop categories) |
| `public/icons/` | PWA icons (192px, 512px) |
| `public/leaflet.css`, `marker-*.png` | Local Leaflet assets for PWA offline support |
