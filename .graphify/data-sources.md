# Data Sources — External APIs, Keys, and Fallbacks

## Primary Data Sources (No API Key Required)

| Source | URL | Used By | Fallback |
|--------|-----|---------|----------|
| Open-Meteo | `api.open-meteo.com/v1/forecast` | `/api/weather`, `/api/smart-decision`, WeatherWidget | Seasonal fallback data by month |
| Nominatim | `nominatim.openstreetmap.org/reverse` | LocationContext | Dhaka (23.685, 90.356) |
| OpenStreetMap | `tile.openstreetmap.org` | MapWidget, InteractiveMap | None (CDN) |
| Esri Satellite | `server.arcgisonline.com/ArcGIS/rest/services` | InteractiveMap satellite layer | OSM street layer |
| Google News RSS | `news.google.com/rss/search` | `/api/news` | Curated seasonal advisories |
| DAM Live | `market.dam.gov.bd/api/commodity-price` | `/api/market` | DAM reference + seasonal simulation |
| .gov.bd RSS | DAE/BRRI/BARI/BADC/MoA/BMD feeds | `/api/news` | Google News site:gov.bd, then curated |
| FAO/IRRI/IFPRI RSS | Various international feeds | `/api/news` intlHeadlines | Curated seasonal |
| CORS Proxies | allorigins.win, corsproxy.io | `/api/news`, `/api/market` | Direct fetch |

## AI Providers (z-ai-web-dev-sdk Primary)

| Provider | How Used | Key Required | Priority |
|----------|----------|-------------|----------|
| z-ai-web-dev-sdk (chat) | `/api/chat`, `/api/crop-database`, `/api/soil-analysis` | No (built-in) | Primary for all text |
| z-ai-web-dev-sdk (VLM) | `/api/diagnose` vision | No (built-in) | 1st in waterfall |
| Gemini 2.5 Flash | `/api/diagnose` | `GEMINI_API_KEY` env | 2nd in waterfall |
| OpenRouter Qwen-VL | `/api/diagnose` | `OPENROUTER_API_KEY` env | 3rd in waterfall |
| Groq Llama 4 Scout | `/api/diagnose` | `GROQ_API_KEY` env | 4th in waterfall |
| z-ai-web-dev-sdk (text) | `/api/diagnose` | No (built-in) | 5th in waterfall |

## Fallback Chain for Diagnosis

```
1. z-ai-vlm (GLM-4V-Plus, vision) → best for image analysis
2. Gemini 2.5 Flash (vision)       → if env key set
3. OpenRouter Qwen-VL (vision)     → if env key set
4. Groq Llama 4 Scout (text-only)  → if env key set
5. z-ai-text (GLM text)            → text-only fallback
6. Offline CABI Engine             → pure algorithmic, no API
7. Emergency Regex                 → keyword matching, always available
```

## Simulated Data (No External API)

| Feature | Source File | Method |
|---------|------------|--------|
| NDVI values | `NDVIMap.tsx` | Deterministic seasonal: month + lat/lng → NDVI 0.2-0.85 |
| Crop prices | `cropPriceService.ts` | DAM baseline + seasonal multiplier + daily jitter (hash) |
| Market widget | `MarketWidget.tsx` + `/api/market` | DAM live attempt → CORS proxy → simulated |
| Agri indices | `/api/weather` | Estimated from temp/humidity/rain (soil moisture, ET0, GDD, leaf wetness) |

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `GEMINI_API_KEY` | Gemini diagnosis fallback | No |
| `GROQ_API_KEY` | Groq diagnosis fallback | No |
| `OPENROUTER_API_KEY` | OpenRouter diagnosis fallback | No |
| `DATABASE_URL` | SQLite path (unused in prod) | No |

## Caching Layers

1. **In-memory (per serverless instance)**: Each API route maintains its own `Map` with TTL
2. **Vercel CDN**: Static assets immutable, API routes use `s-maxage` headers
3. **Cloudflare KV** (gateway): Route-specific TTL, falls back to per-isolate memory
4. **Browser**: Standard HTTP caching via Cache-Control headers
5. **Nominatim**: Geocode results cached in localStorage (24h TTL)
