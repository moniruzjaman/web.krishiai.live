# INDEX — Complete File & Route Map

## Project Identity
- **Name**: KrishiAI (কৃষি AI)
- **URL**: https://web.krishiai.live
- **Repo**: moniruzjaman/web.krishiai.live
- **Production branch**: v4.0
- **Runtime**: Bun | **Framework**: Next.js 16 (App Router) | **Deploy**: Vercel (iad1)

## Source Tree

```
src/
├── app/
│   ├── layout.tsx              # Root layout: Bengali font, LocationProvider, TopNav, BottomNav, ClientShell
│   ├── page.tsx                # Home page: Hero + 6 widgets + 12 tool cards
│   ├── not-found.tsx           # 404 page
│   ├── globals.css             # Tailwind 4 globals
│   ├── analyzer/page.tsx       # Disease analyzer (photo upload + symptoms → CABI diagnosis)
│   ├── chat/page.tsx           # AI chat interface
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
│       ├── route.ts            # API health/info endpoint
│       ├── chat/route.ts       # AI chat (CF Workers AI: REST → offline fallback)
│       ├── diagnose/route.ts   # CABI diagnosis (8-provider waterfall: z-ai-vlm → CF AI → Gemini → OpenRouter → Groq → z-ai → Offline → Regex)
│       ├── weather/route.ts    # Open-Meteo proxy with agri indices
│       ├── market/route.ts     # DAM live + seasonal fallback prices
│       ├── news/route.ts       # .gov.bd RSS + Google News + AI bulletin
│       ├── crop-database/route.ts # AI-generated crop info (CF Workers AI + static fallback)
│       ├── crop-prices/route.ts   # Simulated crop prices (DAM/DAE reference)
│       ├── soil-analysis/route.ts # AEZ zone + USDA soil classification (CF Workers AI)
│       └── smart-decision/route.ts # Combined weather+price+season scoring
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
│   └── LocationContext.tsx     # App-wide GPS provider (useLocation hook, Nominatim, Dhaka fallback, no auto-grant on mount)
├── hooks/
│   └── use-toast.ts            # Toast hook
├── lib/
│   ├── utils.ts                # cn() utility
│   ├── cropCalendar.ts         # 10 crops, 6 seasons, risk alerts, Bengali months
│   ├── cropDiseases.ts         # Disease database
│   ├── cropPriceService.ts     # 14 crops, baseline prices, seasonal simulation, profitability
│   ├── weatherService.ts       # Open-Meteo integration, crop scoring, disease pressure, irrigation
│   ├── cloudflareAI.ts         # CF Workers AI REST client for Next.js routes (gateway path removed)
│   └── cabi/
│       ├── bengaliKeywords.ts  # Bengali→English symptom translation
│       └── diagnosticEngine.ts # Offline CABI diagnosis engine
├── proxy.ts                    # API rate limiter (10/20/60 rpm per IP, replaces middleware.ts)
├── middleware.ts               # REMOVED — renamed to proxy.ts (Next.js 16)

public/
├── sw.js                       # Service worker (3-tier caching: static cache-first, API network-first, nav offline fallback)
├── manifest.json               # PWA manifest (Bengali, standalone, portrait, scope, display_override, edge_side_panel)
├── icons/                      # icon-192.png, icon-512.png
├── logo.svg
├── robots.txt
├── leaflet.css                 # Local copy for PWA offline support
├── marker-icon.png             # Local Leaflet marker icon
├── marker-icon-2x.png          # Local Leaflet hi-res marker icon
├── marker-shadow.png           # Local Leaflet marker shadow
├── data/                       # aez-zones.json, crop-categories.json, usda-textures.json
├── disease/                    # ~60 CABI disease reference images
├── deficiency/                 # ~24 nutrient deficiency reference images
└── pest/                       # ~25 pest reference images

Config files:
├── next.config.ts              # Next.js config (standalone, CORS headers, SW headers)
├── vercel.json                 # Vercel deploy config (bun, security headers)
├── proxy.ts                    # API rate limiter (replaces middleware.ts)
└── .github/workflows/deploy-full.yml  # REMOVED — no CF Worker to deploy
```

## Route Table (25+ routes)

| Route | Type | Method | Cache | Data Source |
|-------|------|--------|-------|-------------|
| `/` | Page | GET | — | Mixed |
| `/analyzer` | Page | GET | — | — |
| `/chat` | Page | GET | — | — |
| `/offline` | Page | GET | — | Static offline fallback |
| `/learn` | Page | GET | — | — |
| `/profile` | Page | GET | — | — |
| `/tools` | Page | GET | — | — |
| `/tools/satellite` | Page | GET | — | Simulated NDVI |
| `/tools/soil` | Page | GET | — | CF Workers AI + AEZ |
| `/tools/irrigation` | Page | GET | — | Open-Meteo |
| `/tools/smart-decision` | Page | GET | — | Open-Meteo + cropPriceService |
| `/tools/crop-library` | Page | GET | — | CF Workers AI generated |
| `/tools/pesticide` | Page | GET | — | — |
| `/tools/plant-health` | Page | GET | — | — |
| `/tools/crop-calendar` | Page | GET | — | cropCalendar.ts |
| `/tools/yield` | Page | GET | — | — |
| `/api` | API | GET | 300s | Static info |
| `/api/chat` | API | POST | no-store | CF Workers AI (REST → offline) |
| `/api/diagnose` | API | POST | no-store | 8-provider waterfall |
| `/api/weather` | API | GET | 600s | Open-Meteo + seasonal fallback |
| `/api/market` | API | GET | 3600s | DAM live + seasonal fallback |
| `/api/news` | API | GET | 1800s | .gov.bd RSS + Google News + AI |
| `/api/crop-database` | API | GET | 600s | CF Workers AI + static fallback |
| `/api/crop-prices` | API | GET | 300s | Simulated from DAM/DAE baselines |
| `/api/soil-analysis` | API | GET/POST | no-store | CF Workers AI + AEZ/USDA |
| `/api/smart-decision` | API | GET | 600s | Open-Meteo + cropPriceService |

## Proxy (Rate Limiter)

| Export | Path | Purpose |
|--------|------|---------|
| `proxy()` | `src/proxy.ts` | IP-based rate limiter for API routes (replaces deprecated middleware.ts) |

## Service Worker (public/sw.js)

| Strategy | Scope | Behavior |
|----------|-------|----------|
| Cache-first | `_next/static/*`, `.css`, `.js`, `.png`, icons, Leaflet assets | Serve from cache, fetch on miss |
| Network-first | `/api/*` | Fetch from network, cache on success, serve cached on failure |
| Network-first | Navigation requests | Fetch HTML, cache on success, serve `/offline` on failure |
