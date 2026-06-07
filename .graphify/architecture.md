# Architecture — System Design & Data Flow

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    User's Browser (PWA)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │LocationCtx│  │Widgets   │  │Pages     │  │Service Worker │   │
│  │(GPS/Geo) │  │(6 home)  │  │(12 tools)│  │(public/sw.js) │   │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  │ 3-tier cache  │   │
│        │             │             │        └───────┬───────┘   │
│        └─────────────┼─────────────┘                │           │
│                      ▼                              │ (offline) │
│              Next.js App Router (React 19)          │           │
│              Bun runtime · Tailwind 4 · shadcn/ui  ◄┘           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
           ┌────────────┼──────────────┐
           ▼            ▼              ▼
    ┌─────────────┐ ┌──────────────┐  ┌───────────┐
    │ Vercel Edge │ │ Vercel       │  │ proxy.ts  │
    │ (Static)    │ │ Server API   │  │ Rate Lim. │
    │ Pages/Assets│ │ Routes       │  │ (10/20/60)│
    └─────────────┘ └────┬─────────┘  └───────────┘
                         │
           ┌─────────────┼───────────────┐
           ▼             ▼               ▼
    ┌───────────┐ ┌──────────────┐  ┌───────────┐
    │Open-Meteo │ │CF Workers AI │  │CABI Offline│
    │(weather)  │ │REST API      │  │Engine      │
    │No key     │ │(Bearer token)│  │(no API)    │
    └───────────┘ └──────┬───────┘  └───────────┘
                         │
           ┌─────────────┼───────────────┐
           ▼             ▼               ▼
    ┌───────────────┐ Gemini  Groq  OpenRouter
    │DAM/DAE/RSS    │ (opt)   (opt)   (opt)
    │(.gov.bd APIs) │ env keys env    env keys
    │CORS proxy     │
    └───────────────┘
```

## AI Single-Path Architecture (Gateway Removed)

```
Vercel API Route (e.g., /api/chat)
    │
    └── Direct REST API (only path — CF Worker gateway removed)
          POST api.cloudflare.com/.../ai/run/@cf/meta/llama-3-8b-instruct
          Authorization: Bearer CF_API_TOKEN
          └── Standard HTTP call
          └── On failure → Offline/fallback response
```

## Key Design Decisions

1. **AI path** — Direct CF Workers AI REST API. Gateway (CF Worker with native AI binding) was removed to simplify architecture. Vercel alone handles all API routing and rate limiting via `src/proxy.ts`.

2. **Waterfall provider pattern** — The diagnose API tries 8 providers in sequence: z-ai-vlm → CF Workers AI → Gemini → OpenRouter → Groq → z-ai-text → Offline CABI → Emergency regex. First success wins.

3. **Centralized location** — `LocationContext` is the single source of GPS truth. All widgets consume via `useLocation()`. Auto-fallback to Dhaka after 3s timeout.

4. **Bengali-first** — All UI text, API responses, and error messages are in Bengali. English is secondary in diagnosis output only.

5. **Simulated data over API dependency** — NDVI uses deterministic seasonal simulation, not Sentinel Hub. Market prices use DAM baseline + seasonal multipliers + daily jitter, not hardcoded values.

6. **Server-side API proxying** — All external API calls happen in Next.js API routes, never from the client. This avoids CORS issues and hides credentials.

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
| Browser SW | Static assets (_next/static, CSS, icons) | Cache-first, never expires |
| Browser SW | API routes | Network-first, cache as fallback |
| Browser SW | Navigation | Network-first, offline page (`/offline`) as fallback |
