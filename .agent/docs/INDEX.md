# INDEX — Complete File & Route Map

## Project Identity
- **Name**: KrishiAI (কৃষি AI)
- **URL**: https://web.krishiai.live
- **Repo**: moniruzjaman/web.krishiai.live
- **Branches**: main, v4.0
- **Runtime**: Bun | **Framework**: Next.js 16 (App Router) | **Deploy**: Vercel (hkg1)
- **Backend**: Supabase (auth + DB + quota tracking) | **Mobile**: Expo (separate repo)
- **Architecture**: Vercel + Supabase — completely free with quota-tier fallback
- **Orchestration**: OpenProvider — central task router with dynamic provider mapping

## Source Tree

```
src/
├── app/
│   ├── layout.tsx              # Root layout: Bengali font, LocationProvider, TopNav, BottomNav, ClientShell
│   ├── page.tsx                # Home page: Hero + 6 widgets + 12 tool cards
│   ├── not-found.tsx           # 404 page
│   ├── globals.css             # Tailwind 4 globals
│   ├── analyzer/page.tsx       # Disease analyzer (photo upload + symptoms → CABI diagnosis)
│   ├── chat/page.tsx           # AI chat interface (Supabase + AI Provider Fallback)
│   ├── dashboard/page.tsx      # OpenProvider orchestration hub dashboard (token usage, DB status, deployments)
│   ├── learn/page.tsx          # Learning center
│   ├── profile/page.tsx        # User profile + install button
│   ├── tools/
│   │   ├── page.tsx            # Tools index (12 tools grid)
│   │   ├── satellite/page.tsx  # NDVI map + crop health + seasonal comparison
│   │   ├── soil/page.tsx       # AEZ soil analyzer
│   │   ├── irrigation/page.tsx # Irrigation advisor
│   │   ├── smart-decision/page.tsx # Crop decision engine
│   │   ├── crop-library/page.tsx   # Crop database (7 categories)
│   │   ├── pesticide/page.tsx      # Pesticide guide
│   │   ├── plant-health/page.tsx   # Plant health diagnostics
│   │   ├── crop-calendar/page.tsx  # Crop calendar (10 crops, 6 seasons)
│   │   └── yield/page.tsx         # Yield forecast
│   └── api/
│       ├── route.ts            # API health/info endpoint (v4.0.0)
│       ├── chat/route.ts       # AI chat (quota-aware: Gemini → OpenRouter → Groq → offline)
│       ├── diagnose/route.ts   # CABI diagnosis (AI client + offline CABI engine + emergency regex)
│       ├── weather/route.ts    # Open-Meteo proxy with agri indices
│       ├── market/route.ts     # DAM live + seasonal fallback prices
│       ├── news/route.ts       # .gov.bd RSS + Google News + AI bulletin
│       ├── alerts/route.ts     # Crop alerts from Supabase
│       ├── crop-database/route.ts # AI-generated crop info (AI client + static fallback)
│       ├── crop-prices/route.ts   # Simulated crop prices (DAM/DAE reference)
│       ├── soil-analysis/route.ts # AEZ zone + USDA soil classification (AI client + static)
│       └── smart-decision/route.ts # Combined weather+price+season scoring
│   └── api/dashboard/
│       ├── status/route.ts     # System status + provider health + DB connectivity
│       ├── usage/route.ts      # Token usage stats + quota reference
│       └── deployments/route.ts # Deployment history from git
├── components/
│   ├── TopNavbar.tsx           # Top nav bar
│   ├── BottomNav.tsx           # Bottom tab navigation
│   ├── ClientShell.tsx         # SSR-safe wrapper (dynamically imports InstallPrompt)
│   ├── InstallPrompt.tsx       # PWA install banner (beforeinstallprompt + iOS)
│   ├── MapWidget.tsx           # Home page OSM map card (street/satellite toggle, BD markers)
│   ├── InteractiveMap.tsx      # Leaflet map (15+ BD institution markers, GPS, locate-me)
│   ├── NDVIMap.tsx             # NDVI overlay map (20+ district circles, seasonal patterns)
│   ├── WeatherWidget.tsx       # Home page weather card (current + hourly + 5-day + agri indices)
│   ├── MarketWidget.tsx        # Home page market card (6 categories, search, price trends)
│   ├── NewsWidget.tsx          # Home page news card
│   ├── AIChatWidget.tsx        # Home page AI chat card
│   ├── PhotoGallery.tsx        # Home page photo gallery
│   └── ui/                     # shadcn/ui primitives
├── context/
│   └── LocationContext.tsx     # App-wide GPS provider (useLocation hook, Nominatim, Dhaka fallback)
├── hooks/
│   └── use-toast.ts            # Toast hook
├── lib/
│   ├── utils.ts                # cn() utility
│   ├── ai-client.ts            # Quota-aware AI client (Gemini → OpenRouter → Groq → offline)
│   ├── openrouter.ts           # App orchestrator (task routing, quota-aware waterfall, telemetry)
│   ├── cropCalendar.ts         # 10 crops, 6 seasons, risk alerts, Bengali months
│   ├── cropDiseases.ts         # Disease database
│   ├── cropPriceService.ts     # 14 crops, baseline prices, seasonal simulation, profitability
│   ├── weatherService.ts       # Open-Meteo integration, crop scoring, disease pressure, irrigation
│   ├── supabase/
│   │   ├── server.ts           # Server-side Supabase client (cookie auth)
│   │   ├── client.ts           # Browser-side Supabase client
│   │   ├── middleware.ts        # Session refresh middleware helper
│   │   ├── quota.ts            # Quota tracking (checkQuota + logUsage)
│   │   └── schema.sql          # Full DB schema (profiles, usage_logs, quota_limits, chat_messages, crop_alerts + RLS)
│   └── cabi/
│       ├── bengaliKeywords.ts  # Bengali→English symptom translation
│       ├── diagnosticEngine.ts # Offline CABI diagnosis engine
│       └── resistanceDB.ts     # Pesticide resistance database
├── middleware.ts               # Next.js middleware (Supabase session refresh)

public/
├── manifest.json               # PWA manifest (Bengali, standalone, portrait)
├── sw.js                       # Service worker for offline support
├── icons/                      # icon-192.png, icon-512.png
├── logo.svg
├── robots.txt
├── data/                       # aez-zones.json, crop-categories.json, usda-textures.json
├── disease/                    # ~60 CABI disease reference images
├── deficiency/                 # ~24 nutrient deficiency reference images
└── pest/                       # ~25 pest reference images

Config files:
├── tsconfig.json               # Next.js TypeScript config
├── next.config.ts              # Next.js config (standalone, reactStrictMode)
├── vercel.json                 # Vercel deploy config (bun, hkg1, security headers)
├── agentic.json                # OpenProvider orchestration config (agents, routes, providers)
├── .env.example                # Environment variables template (Supabase + AI keys)
└── .github/workflows/validate.yml  # CI: bun install → lint → build
```

## Architecture: Vercel + Supabase

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                         │
│  Next.js 16 App Router — SSR + Static + API Routes          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │  Pages    │  │ Widgets  │  │  API Routes              │  │
│  │  (28)     │  │ (6)      │  │  chat, diagnose, soil,   │  │
│  │          │  │          │  │  news, crop-db, weather,   │  │
│  │          │  │          │  │  market, alerts...         │  │
│  └──────────┘  └──────────┘  └──────────┬───────────────┘  │
│                                        │                    │
│         ┌──────────────────────────────┤                    │
│         │     ai-client.ts             │                    │
│         │  Quota-aware AI waterfall    │                    │
│         │  Gemini→OpenRouter→Groq→Off  │                    │
│         └──────────┬───────────────────┘                    │
└────────────────────┼────────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │                       │
    ┌────▼─────┐          ┌─────▼──────┐
    │ Supabase │          │ AI APIs    │
    │          │          │            │
    │ Auth     │          │ Gemini     │
    │ DB       │          │ OpenRouter │
    │ Quota    │          │ Groq       │
    │ RLS      │          │            │
    └──────────┘          └────────────┘
```

## Quota Tier System

| Tier | Chat/day | Diagnose/day | Soil/day | Crop DB/day | News/day |
|------|----------|-------------|----------|-------------|----------|
| **Free** (default) | 30 | 15 | 20 | 30 | 50 |
| **Basic** | 100 | 50 | 80 | 100 | 200 |
| **Pro** | 500 | 200 | 300 | 500 | 1000 |
| **Unlimited** | ∞ | ∞ | ∞ | ∞ | ∞ |
| **Anonymous** | 10 | 5 | 10 | 10 | 20 |

## AI Provider Waterfall

```
1. Gemini 2.5 Flash ──── primary (fast, free tier generous)
   ↓ (fails)
2. OpenRouter ─────────── fallback (Gemini via OR)
   ↓ (fails)
3. Groq (Llama 3.1 8B) ─ fast text-only fallback
   ↓ (fails)
4. Offline Bengali ───── graceful degradation message
```

## Route Table (25+ routes)

| Route | Type | Method | Cache | Data Source |
|-------|------|--------|-------|-------------|
| `/` | Page | GET | — | Mixed |
| `/analyzer` | Page | GET | — | — |
| `/chat` | Page | GET | — | — |
| `/learn` | Page | GET | — | — |
| `/profile` | Page | GET | — | — |
| `/tools` | Page | GET | — | — |
| `/tools/satellite` | Page | GET | — | Simulated NDVI |
| `/tools/soil` | Page | GET | — | AI client + AEZ |
| `/tools/irrigation` | Page | GET | — | Open-Meteo |
| `/tools/smart-decision` | Page | GET | — | Open-Meteo + cropPriceService |
| `/tools/crop-library` | Page | GET | — | AI client generated |
| `/tools/pesticide` | Page | GET | — | — |
| `/tools/plant-health` | Page | GET | — | — |
| `/tools/crop-calendar` | Page | GET | — | cropCalendar.ts |
| `/tools/yield` | Page | GET | — | — |
| `/api` | API | GET | 300s | Static info (v4.0.0) |
| `/api/chat` | API | POST | no-store | AI client (Gemini→OR→Groq→offline) |
| `/api/diagnose` | API | POST | no-store | AI client + CABI offline + emergency regex |
| `/api/weather` | API | GET | 600s | Open-Meteo + seasonal fallback |
| `/api/market` | API | GET | 3600s | DAM live + seasonal fallback |
| `/api/news` | API | GET | 1800s | .gov.bd RSS + Google News + AI bulletin |
| `/api/alerts` | API | GET | 300s | Supabase crop_alerts |
| `/api/crop-database` | API | GET | 600s | AI client + static fallback |
| `/api/crop-prices` | API | GET | 300s | Simulated from DAM/DAE baselines |
| `/api/soil-analysis` | API | GET/POST | no-store | AI client + AEZ/USDA |
| `/api/smart-decision` | API | GET | 600s | Open-Meteo + cropPriceService |
| `/dashboard` | Page | GET | — | OpenProvider monitoring dashboard |
| `/api/dashboard/status` | API | GET | no-store | Provider health + DB connectivity |
| `/api/dashboard/usage` | API | GET | no-store | Token usage + quota reference |
| `/api/dashboard/deployments` | API | GET | 60s | Deployment history from git |

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `GEMINI_API_KEY` | Primary AI provider | Yes |
| `GROQ_API_KEY` | Text-only AI fallback | Recommended |
| `OPENROUTER_API_KEY` | Vision-capable AI fallback | Recommended |

## Orchestration Hub

Two distinct layers — see `.agent/docs/orchestration.md` for the full breakdown
(app AI-provider waterfall vs. dev-agent meta hub). Summary:

```
┌───────────────┐
│  App Waterfall │  ← src/lib/openrouter.ts, orchestrate()
└───────┬───────┘
        │
   Gemini 3.5 Flash → OpenRouter Qwen2.5-VL-72B → Groq Llama-3.2-11B-Vision
        │
       ┌▼──────────────┐
       │ offline degrade│  ← Bengali graceful fallback, all providers exhausted
       └────────────────┘

┌──────────────────────────┐
│ Dev-Agent Meta Hub        │  ← .agent/orchestration/agents/openprovider.js
│ (codebase automation only)│
└────────────┬──────────────┘
   ┌──────────┼───────────┐
┌───────┐┌────────┐┌───────────┐
│ Cline ││ Kilo   ││ Opencode  │
│Schema ││ Infra  ││ Refactor  │
└───────┘└────────┘└───────────┘
        + Claude/Kimi/Z.ai (free-tier external models, via openprovider.js)
```

### App task routing (root `agentic.json`)

| Task | Provider Priority Chain |
|------|------------------------|
| `chat` | Gemini → OpenRouter → Groq |
| `diagnose` | Gemini → OpenRouter → Groq |
| `soil_analysis` | Gemini → OpenRouter |
| `crop_database` | Gemini → OpenRouter |
| `news_bulletin` | Groq → Gemini |

### Dev-agent roles (`.agent/orchestration/agentic.json`)

| Agent | Role | Best assigned task | Module |
|-------|------|-----------|--------|
| Cline | File-editor | DB schema generation + sync | `agents/cline.js` |
| Kilo | Infra | CI/CD workflow generation | `agents/kilo.js` |
| Opencode | Refactor | Dry-run refactors, env injection | `agents/opencode.js` |
| Graphify | Visualization | `.agent/docs` knowledge graph | `agents/graphify.js` |
| Claude (external) | Reasoning | Compliance-sensitive validation | `agents/external.js` |
| Kimi (external) | Presentation | Bilingual polish, report formatting | `agents/external.js` |
| Z.ai (external) | Automation | Structured content, workflow cloning | `agents/external.js` |

### Monitoring Dashboard

- **Page**: `/dashboard` — Real-time token usage, DB sync status, deployment logs
- **API**: `/api/dashboard/status`, `/api/dashboard/usage`, `/api/dashboard/deployments`
- **Config**: `agentic.json` at project root
- **Visualization**: `.graphify/orchestration.md`
