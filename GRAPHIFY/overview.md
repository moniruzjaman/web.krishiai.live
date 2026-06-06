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
         ├── Next.js UI (pages + components)
         └── API Routes (server-side AI gateway)
              │
              ├── Path 1: CF Edge Gateway (FAST — native AI binding)
              │   └── CF_GATEWAY_URL/api/chat → Worker calls env.AI.run()
              │
              ├── Path 2: Direct REST (FALLBACK)
              │   └── api.cloudflare.com/.../ai/run/@cf/meta/llama-3-8b-instruct
              │
              ├── /api/diagnose   → CF AI + Gemini + OpenRouter + Groq + Offline CABI
              ├── /api/weather    → Open-Meteo (free, no key)
              ├── /api/market     → DAM live + seasonal fallback
              ├── /api/news       → Google News + .gov.bd RSS + FAO/IRRI
              ├── /api/crop-database → CF Workers AI + static fallback
              ├── /api/crop-prices   → cropPriceService simulation
              ├── /api/smart-decision → weather + crop calendar + prices
              └── /api/soil-analysis  → CF Workers AI + USDA classification

CF Workers (Edge AI Gateway)
         ├── krishiai-gateway worker (api.krishiai.live)
         ├── Native AI binding → env.AI.run() (no REST + Bearer needed)
         └── Routes: /api/chat, /api/diagnose, /api/analyze
```

## Dual AI Architecture
- **Edge Path (FAST):** CF Worker Gateway at `CF_GATEWAY_URL` — uses native Workers AI binding, in-process on CF edge, no HTTP round-trip to REST API
- **REST Path (FALLBACK):** Direct CF Workers AI REST API using `CF_ACCOUNT_ID` + `CF_API_TOKEN`
- **Routing:** If `CF_GATEWAY_URL` env var is set → gateway first, REST on failure. If not set → REST only.
- **Module:** `src/lib/cloudflareAI.ts` — dual-path client for Next.js routes
- **Worker:** `src/workers/index.ts` — standalone CF Worker with native AI binding

## Key Directories
| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages + API routes |
| `src/components/` | React components (widgets, maps, nav) |
| `src/context/` | React Context providers (LocationContext) |
| `src/lib/` | Shared utilities, AI client, crop data |
| `src/lib/cabi/` | Offline CABI Plantwise diagnostic engine |
| `src/workers/` | Cloudflare Worker (Edge AI Gateway) |
| `public/data/` | Static JSON data (AEZ zones, crop categories) |
| `public/icons/` | PWA icons (192px, 512px) |
