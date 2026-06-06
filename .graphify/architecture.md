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
          ┌────────────┼────────────────┐
          ▼            ▼                ▼
   ┌─────────────┐ ┌─────────┐  ┌──────────────┐
   │ Vercel Edge │ │ Vercel  │  │ Cloudflare   │
   │ (Static)    │ │ Server  │  │ Workers      │
   │ Pages/Assets│ │ API     │  │ API Gateway  │
   └─────────────┘ └────┬────┘  └──────┬───────┘
                        │               │
          ┌─────────────┼───────────────┤
          ▼             ▼               ▼
   ┌───────────┐ ┌──────────┐  ┌──────────────┐
   │Open-Meteo │ │z-ai SDK  │  │DAM/DAE/RSS   │
   │(weather)  │ │(AI fallback) │(.gov.bd APIs)│
   │No key     │ │chat/soil/ │  │CORS proxy    │
   │           │ │crop/news  │  │required      │
   └───────────┘ └──────────┘  └──────────────┘
                        │
          ┌─────────────┼───────────────┐
          ▼             ▼               ▼
   ┌───────────────┐ Gemini  Groq  OpenRouter
   │CF Workers AI  │ (opt)   (opt)  (opt)
   │(Llama 3 8B)   │ env keys env    env keys
   │PRIMARY AI     │
   │Built-in token │
   └───────────────┘
```

## Key Design Decisions

1. **No external API keys required for core features** — All primary data sources (Open-Meteo, Nominatim, OSM) are keyless. Optional providers (Gemini, Groq, OpenRouter) enhance diagnosis if keys are set.

2. **Waterfall provider pattern** — The diagnose API tries 8 providers in sequence: z-ai-vlm → CF Workers AI (Llama 3) → Gemini → OpenRouter → Groq → z-ai-text → Offline CABI → Emergency regex. First success wins. Chat, soil, and crop-database routes use CF Workers AI as primary with z-ai as fallback.

3. **Centralized location** — `LocationContext` is the single source of GPS truth. All widgets consume via `useLocation()`. Auto-fallback to Dhaka after 3s timeout.

4. **Bengali-first** — All UI text, API responses, and error messages are in Bengali. English is secondary in diagnosis output only.

5. **Simulated data over API dependency** — NDVI uses deterministic seasonal simulation, not Sentinel Hub. Market prices use DAM baseline + seasonal multipliers + daily jitter, not hardcoded values.

6. **Server-side API proxying** — All external API calls happen in Next.js API routes (or Cloudflare Workers), never from the client. This avoids CORS issues and hides implementation.

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
| Cloudflare KV | Weather/Market/News | Route-specific |
| Cloudflare Memory | Same as KV | 60s fallback |
| Browser | Service worker (PWA) | Standard |
