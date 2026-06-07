# Data Sources — External APIs, Keys, and Fallbacks

## Primary Data Sources (No API Key Required)

| Source | URL | Used By | Fallback |
|--------|-----|---------|----------|
| Open-Meteo | `api.open-meteo.com/v1/forecast` | `/api/weather`, `/api/smart-decision`, WeatherWidget | Seasonal fallback data by month |
| Nominatim | `nominatim.openstreetmap.org/reverse` | LocationContext | Dhaka (23.685, 90.356) |
| OpenStreetMap | `tile.openstreetmap.org` | MapWidget, InteractiveMap | Local Leaflet CSS/icons in /public/ |
| Esri Satellite | `server.arcgisonline.com/ArcGIS/rest/services` | InteractiveMap satellite layer | OSM street layer |
| Google News RSS | `news.google.com/rss/search` | `/api/news` | Curated seasonal advisories |
| DAM Live | `market.dam.gov.bd/api/commodity-price` | `/api/market` | DAM reference + seasonal simulation |
| .gov.bd RSS | DAE/BRRI/BARI/BADC/MoA/BMD feeds | `/api/news` | Google News site:gov.bd, then curated |
| FAO/IRRI/IFPRI RSS | Various international feeds | `/api/news` intlHeadlines | Curated seasonal |
| CORS Proxies | allorigins.win, corsproxy.io | `/api/news`, `/api/market` | Direct fetch |

## AI Providers (Cloudflare Workers AI Primary)

| Provider | How Used | Key Required | Priority |
|----------|----------|-------------|----------|
| **Cloudflare Workers AI** (Llama 3 8B) | `/api/chat`, `/api/crop-database`, `/api/soil-analysis`, `/api/diagnose`, `/api/news` bulletin | `CF_API_TOKEN` in Vercel env | **Primary for all AI** |
| z-ai-web-dev-sdk (chat) | `/api/chat`, `/api/crop-database`, `/api/soil-analysis`, `/api/news` | No (built-in) | Fallback |
| z-ai-web-dev-sdk (VLM) | `/api/diagnose` vision | No (built-in) | 1st in waterfall |
| Gemini 2.5 Flash | `/api/diagnose` | `GEMINI_API_KEY` env | 3rd in waterfall |
| OpenRouter Qwen-VL | `/api/diagnose` | `OPENROUTER_API_KEY` env | 4th in waterfall |
| Groq Llama 4 Scout | `/api/diagnose` | `GROQ_API_KEY` env | 5th in waterfall |
| z-ai-web-dev-sdk (text) | `/api/diagnose` | No (built-in) | 6th in waterfall |

### Cloudflare Workers AI Configuration

- **Account ID**: Set via `CF_ACCOUNT_ID` env var
- **API Token**: Set via `CF_API_TOKEN` env var (must be added in Vercel dashboard)
- **Models**: `@cf/meta/llama-3-8b-instruct` (default), `@cf/mistral/mistral-7b-instruct`, `@cf/meta/llama-3-70b-instruct`
- **Utility**: `callCloudflareAI()` (full response), `cfAIChat()` (simple system+user), `cfAIChatFull()` (chat with history)
- **Timeout**: 15s default, configurable per call
- **Fallback**: If env vars not set, throws error and routes fall through to z-ai-web-dev-sdk
- **No edge gateway**: CF Worker gateway was removed. All requests go through direct REST API.

## Fallback Chain for Diagnosis (8 providers)

```
1. z-ai-vlm (GLM-4V-Plus, vision)     → best for image analysis (built-in, no key)
2. CF Workers AI (Llama 3 8B, text)    → primary text diagnosis (CF_API_TOKEN)
3. Gemini 2.5 Flash (vision)           → if GEMINI_API_KEY set
4. OpenRouter Qwen-VL (vision)         → if OPENROUTER_API_KEY set
5. Groq Llama 4 Scout (text-only)      → if GROQ_API_KEY set
6. z-ai-text (GLM text)                → text-only fallback (built-in, no key)
7. Offline CABI Engine                 → pure algorithmic, no API
8. Emergency Regex                     → keyword matching, always available
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
| `CF_ACCOUNT_ID` | Cloudflare Workers AI account ID | Yes (for CF AI) |
| `CF_API_TOKEN` | Cloudflare Workers AI API token | Yes (for CF AI) |
| `GEMINI_API_KEY` | Gemini diagnosis fallback | No |
| `GROQ_API_KEY` | Groq diagnosis fallback | No |
| `OPENROUTER_API_KEY` | OpenRouter diagnosis fallback | No |
| `DATABASE_URL` | SQLite path (unused in prod) | No |

## Caching Layers

1. **In-memory (per serverless instance)**: Each API route maintains its own `Map` with TTL
2. **Vercel CDN**: Static assets immutable, API routes use `s-maxage` headers
3. **Browser**: Standard HTTP caching via Cache-Control headers
4. **Service Worker** (`public/sw.js`): 3-tier caching (static cache-first, API network-first, navigation network-first → offline)
5. **Nominatim**: Geocode results cached in localStorage (24h TTL)
