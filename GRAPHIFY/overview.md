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
              ├── /api/chat       → CF Workers AI (Llama 3 8B)
              ├── /api/diagnose   → CF Workers AI + Gemini + OpenRouter + Groq + Offline CABI
              ├── /api/weather    → Open-Meteo (free, no key)
              ├── /api/market     → DAM live + seasonal fallback
              ├── /api/news       → Google News + .gov.bd RSS + FAO/IRRI
              ├── /api/crop-database → CF Workers AI + static fallback
              ├── /api/crop-prices   → cropPriceService simulation
              ├── /api/smart-decision → weather + crop calendar + prices
              └── /api/soil-analysis  → CF Workers AI + USDA classification
```

## AI Provider
- **Primary:** Cloudflare Workers AI (Llama 3 8B Instruct)
- **Env vars:** `CF_ACCOUNT_ID`, `CF_API_TOKEN` (stored in Vercel)
- **Module:** `src/lib/cloudflareAI.ts` — unified REST client
- **No CF Pages/Workers deployment** — Vercel calls CF AI via REST API

## Key Directories
| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages + API routes |
| `src/components/` | React components (widgets, maps, nav) |
| `src/context/` | React Context providers (LocationContext) |
| `src/lib/` | Shared utilities, AI client, crop data |
| `src/lib/cabi/` | Offline CABI Plantwise diagnostic engine |
| `public/data/` | Static JSON data (AEZ zones, crop categories) |
| `public/icons/` | PWA icons (192px, 512px) |
