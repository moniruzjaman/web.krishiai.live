# Architecture — System Design & Data Flow

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser (PWA)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │LocationCtx│  │Widgets   │  │Pages     │  │InstallPrompt│  │
│  │(GPS/Geo) │  │(6 home)  │  │(12 tools)│  │(PWA)       │  │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └────────────┘  │
│        │             │             │                         │
│        └─────────────┼─────────────┘                         │
│                      ▼                                       │
│              Next.js App Router (React 19)                   │
│              Bun runtime · Tailwind 4 · shadcn/ui            │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┼───────────────────────┐
          ▼            ▼                       ▼
   ┌─────────────┐ ┌──────────────┐  ┌──────────────────┐
   │ Vercel Edge │ │ Vercel       │  │ CF Worker        │
   │ (Static)    │ │ Server API   │  │ Edge AI Gateway  │
   │ Pages/Assets│ │ Routes       │  │ (krishiai-gateway│
   └─────────────┘ └────┬─────────┘  │  .workers.dev)   │
                        │            │  Native AI binding│
                        │            └────────┬──────────┘
                        │                     │
          ┌─────────────┼─────────────────────┤
          ▼             ▼                     ▼
   ┌───────────┐ ┌──────────────┐  ┌──────────────────┐
   │Open-Meteo │ │CF Workers AI │  │ env.AI.run()     │
   │(weather)  │ │REST API      │  │ (Llama 3 8B)     │
   │No key     │ │(Bearer token)│  │ In-process, fast │
   └───────────┘ └──────┬───────┘  └──────────────────┘
                        │
          ┌─────────────┼───────────────┐
          ▼             ▼               ▼
   ┌───────────────┐ Gemini  Groq  OpenRouter
   │DAM/DAE/RSS    │ (opt)   (opt)  (opt)
   │(.gov.bd APIs) │ env keys env    env keys
   │CORS proxy     │
   └───────────────┘
```

## AI Dual-Path Architecture

```
Vercel API Route (e.g., /api/chat)
    │
    ├── CF_GATEWAY_URL set?
    │   ├── YES → POST CF_GATEWAY_URL/api/chat
    │   │         └── CF Worker: env.AI.run("@cf/meta/llama-3-8b-instruct", {messages})
    │   │             └── Native binding (no HTTP round-trip to REST API)
    │   │             └── Faster: in-process on CF edge
    │   │         ← On failure → fall through to REST
    │   │
    │   └── NO → Direct REST API
    │         POST api.cloudflare.com/.../ai/run/@cf/meta/llama-3-8b-instruct
    │         Authorization: Bearer CF_API_TOKEN
    │         └── Standard HTTP call, works everywhere
    │
    └── On all failures → Offline/fallback response
```

## Key Design Decisions

1. **Dual AI path** — Gateway (fast) + REST (reliable). Gateway uses native Workers AI binding (no REST + Bearer), running in-process on CF's edge. REST path is the fallback when gateway is unavailable or for local dev.

2. **Waterfall provider pattern** — The diagnose API tries 5 providers in sequence: CF Workers AI → Gemini → OpenRouter → Groq → Offline CABI → Emergency regex. First success wins.

3. **Centralized location** — `LocationContext` is the single source of GPS truth. All widgets consume via `useLocation()`. Auto-fallback to Dhaka after 3s timeout.

4. **Bengali-first** — All UI text, API responses, and error messages are in Bengali. English is secondary in diagnosis output only.

5. **Simulated data over API dependency** — NDVI uses deterministic seasonal simulation, not Sentinel Hub. Market prices use DAM baseline + seasonal multipliers + daily jitter, not hardcoded values.

6. **Server-side API proxying** — All external API calls happen in Next.js API routes (or Cloudflare Worker), never from the client. This avoids CORS issues and hides credentials.

7. **Progressive fallback** — Every feature has 2-3 fallback levels. Weather → seasonal data. Market → DAM reference prices. News → curated advisories. Diagnosis → offline engine → regex.

## Shell Layout

```
┌─────────────────────────────────────────┐
│ TopNavbar (fixed)                       │
├─────────────────────────────────────────┤
│                                         │
│  max-w-[768px] md:768px lg:900px        │
│  xl:1024px                              │
│                                         │
│  Content area (flex-1, pb-16)           │
│                                         │
├─────────────────────────────────────────┤
│ BottomNav (fixed, 5 tabs)              │
└─────────────────────────────────────────┘
```

## Caching Strategy

| Layer | What | TTL |
|-------|------|-----|
| Vercel CDN | Static assets | Immutable |
| Next.js API | Weather | 10 min in-memory |
| Next.js API | Market | 1 hour in-memory |
| Next.js API | News | 30 min in-memory |
| Next.js API | Crop prices | 5 min in-memory |
| Next.js API | Smart decision | 10 min in-memory |
| Next.js API | Crop database | 30 min in-memory |
| Browser | Service worker (PWA) | Standard |
