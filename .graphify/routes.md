# Routes — Complete Route Reference

## Pages (14 routes)

| Route | File | Key Features |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | Hero + 6 live widgets + 12 tool cards + testimonials |
| `/analyzer` | `src/app/analyzer/page.tsx` | Photo upload + symptom selection → AI diagnosis |
| `/chat` | `src/app/chat/page.tsx` | Full AI chat interface |
| `/learn` | `src/app/learn/page.tsx` | Learning center |
| `/profile` | `src/app/profile/page.tsx` | User profile, PWA install trigger |
| `/tools` | `src/app/tools/page.tsx` | Tools index |
| `/tools/satellite` | `src/app/tools/satellite/page.tsx` | NDVI map + crop health + seasonal comparison |
| `/tools/soil` | `src/app/tools/soil/page.tsx` | AEZ zone analysis + USDA soil classifier |
| `/tools/irrigation` | `src/app/tools/irrigation/page.tsx` | Irrigation scheduling |
| `/tools/smart-decision` | `src/app/tools/smart-decision/page.tsx` | Crop decision engine |
| `/tools/crop-library` | `src/app/tools/crop-library/page.tsx` | Crop database browser |
| `/tools/pesticide` | `src/app/tools/pesticide/page.tsx` | Pesticide reference |
| `/tools/plant-health` | `src/app/tools/plant-health/page.tsx` | Plant health diagnostics |
| `/tools/crop-calendar` | `src/app/tools/crop-calendar/page.tsx` | Crop calendar with seasons |
| `/tools/yield` | `src/app/tools/yield/page.tsx` | Yield forecast |

## API Routes (10 endpoints)

| Route | Method | Params | Cache | Response Shape |
|-------|--------|--------|-------|----------------|
| `/api` | GET | — | 300s | Health info + upstream list |
| `/api/chat` | POST | messages[] | no-store | `{ ok, reply, model }` |
| `/api/diagnose` | POST | image?, symptoms[], crop?, weather? | no-store | `{ ok, provider, text, bangla, english, json }` |
| `/api/weather` | GET | lat, lon | 600s | Current + hourly + daily + agri indices + alerts |
| `/api/market` | GET | lat, lon, district | 3600s | 24+ commodities, 5 categories, price changes |
| `/api/news` | GET | — | 1800s | Bulletin + headlines + gov + intl |
| `/api/crop-database` | GET | category | 600s | 5-7 crops per category, AI-generated |
| `/api/crop-prices` | GET | crop?, month?, compare? | 300s | Price data + trends + profitability |
| `/api/soil-analysis` | GET/POST | aezId (GET) or sand/silt/clay (POST) | no-store | Zone/sample analysis + USDA class |
| `/api/smart-decision` | GET | lat, lon, city | 600s | Top recommendations + scoring + disease pressure |

## Navigation

### Top Navbar
- Logo + app name
- Language toggle (if implemented)

### Bottom Nav (5 tabs)
| Tab | Route | Icon |
|-----|-------|------|
| Home | `/` | 🏠 |
| Tools | `/tools` | 🔧 |
| Chat | `/chat` | 💬 |
| Learn | `/learn` | 📚 |
| Profile | `/profile` | 👤 |

## Tool Route → Data Source Mapping

| Tool Page | Primary API | Fallback |
|-----------|-------------|----------|
| Satellite/NDVI | Simulated (client-side) | None |
| Soil Analysis | `/api/soil-analysis` (z-ai) | AEZ zone data |
| Irrigation | Open-Meteo (via weatherService) | Climate averages |
| Smart Decision | `/api/smart-decision` | BD_CLIMATE_AVERAGES |
| Crop Library | `/api/crop-database` (z-ai) | None |
| Pesticide | Static/local | — |
| Plant Health | `/api/diagnose` | Offline CABI engine |
| Crop Calendar | cropCalendar.ts (local) | — |
| Yield | Local computation | — |
