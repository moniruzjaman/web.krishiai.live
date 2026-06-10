# API Routes Reference

All routes are under `src/app/api/` and use Next.js App Router.

## Vercel API Routes

| Route | Method | Purpose | AI Provider | Fallback |
|-------|--------|---------|-------------|----------|
| `/api/chat` | POST | Bengali agricultural chat | CF Workers AI (gateway → REST) | Season-aware generic |
| `/api/diagnose` | POST | CABI Plantwise crop diagnosis | CF Workers AI → Gemini → OpenRouter → Groq | Offline CABI Engine |
| `/api/weather` | GET | Weather + agri indices | Open-Meteo (no key) | Seasonal mock data |
| `/api/market` | GET | Crop market prices | DAM live API | Seasonal prices + daily jitter |
| `/api/news` | GET | Agricultural news | Google News + .gov.bd RSS | Curated seasonal |
| `/api/crop-database` | GET | Crop info by category | CF Workers AI | Static crop database |
| `/api/crop-prices` | GET | Price simulation | cropPriceService | N/A |
| `/api/smart-decision` | GET | Crop decision support | Weather + calendar + prices | N/A |
| `/api/soil-analysis` | GET/POST | AEZ zone + USDA analysis | CF Workers AI | Static USDA classification |
| `/api` | GET | Health check | None | N/A |

## CF Worker Routes (Edge Gateway)

| Route | Method | Purpose | AI Binding |
|-------|--------|---------|------------|
| `/health` | GET | Worker health check | None |
| `/api/chat` | POST | Bengali agricultural chat | `env.AI.run()` native |
| `/api/diagnose` | POST | CABI crop diagnosis | `env.AI.run()` native |
| `/api/analyze` | POST | General AI analysis | `env.AI.run()` native |

## Authentication
- No user auth required — all APIs are public
- AI credentials secured server-side via Vercel env vars (REST path)
- CF Worker uses native AI binding — no token needed (gateway path)
- CORS restricted to `krishiai.live` domains + localhost

## Caching
| Route | Cache Duration | Strategy |
|-------|---------------|----------|
| weather | 10 min | In-memory |
| market | 60 min | In-memory |
| news | 30 min | In-memory + day-based invalidation |
| crop-database | 30 min | In-memory per category |
| smart-decision | 10 min | In-memory |

## Diagnose Waterfall (5 providers)
1. **CF Workers AI** (Llama 3 8B) — text-only, fast
2. **Gemini 2.5 Flash** — vision-capable (needs `GEMINI_API_KEY`)
3. **OpenRouter Qwen-VL** — vision-capable (needs `OPENROUTER_API_KEY`)
4. **Groq Llama 4 Scout** — text-only (needs `GROQ_API_KEY`)
5. **Offline CABI Engine** — always available, no API needed
