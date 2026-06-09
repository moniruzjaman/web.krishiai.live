# API Contracts — Request & Response Shapes

## POST /api/chat
**Purpose**: Bengali agricultural AI chat

Request:
```json
{ "messages": [{ "role": "user"|"assistant", "content": "string" }] }
```
- Max 20 messages, max 5000 chars each
- System prompt auto-injected with seasonal context

Response:
```json
{ "ok": true, "reply": "বাংলা উত্তর...", "model": "@cf/meta/llama-3-8b-instruct|z-ai|fallback" }
```
- Primary: Cloudflare Workers AI (Llama 3 8B Instruct)
- Fallback: z-ai-web-dev-sdk
Error: `{ "ok": false, "error": "বার্তা অত্যন্ত দীর্ঘ" }` (400/503)

---

## POST /api/diagnose
**Purpose**: CABI Plantwise crop disease diagnosis (8-provider waterfall)

Request:
```json
{
  "image": "data:image/...;base64,...",  // optional, max 10MB
  "symptoms": ["পাতায় হলুদ দাগ", "শুকিয়ে যাওয়া"],
  "crop": "ধান",                         // optional
  "weather": { "temp": 28, "humidity": 85, "rain24h": 5 }, // optional
  "description": "string"                 // optional
}
```

Response:
```json
{
  "ok": true,
  "provider": "z-ai-vlm|Cloudflare Workers AI (Llama 3 8B)|Gemini 2.5 Flash|OpenRouter Qwen-VL|Groq Llama 4 Scout|z-ai-text|Offline CABI Engine|Emergency Regex",
  "elapsed_ms": 3200,
  "text": "full markdown text (Bangla + English sections, JSON summary stripped)",
  "bangla": "Bangla section only",
  "english": "English section only",
  "json": {
    "disease_name": "Rice Leaf Blast",
    "disease_name_bn": "ধানের পাতা ব্লাস্ট",
    "confidence": "high|medium|low",
    "confidence_pct": 85,
    "severity": "moderate",
    "urgency": "immediate|within_3_days|within_week|monitor",
    "biotic_abiotic": "biotic",
    "cause_type": "fungal|bacterial|viral|insect|nutrient|environmental",
    "etl_exceeded": true,
    "action_required": true,
    "gate_results": {
      "a_insects": "excluded|retained|uncertain",
      "b_virus": "excluded",
      "c_bacteria": "excluded",
      "d_fungi": "confirmed"
    },
    "top_candidates": [...],
    "disease_triangle": { "host_score": 7, "pathogen_score": 8, "environment_score": 9 },
    "ipm_recommendations": [...],
    "chemical_options": [...]
  }
}
```

---

## GET /api/weather
**Params**: `lat`, `lon` (defaults: 23.685, 90.356)

Response: Current conditions + hourly + 7-day + agricultural indices (soil moisture, ET0, leaf wetness, GDD) + weather alerts + agricultural advisory. 10-min cache.

---

## GET /api/market
**Params**: `lat`, `lon`, `district`

Response: 24+ commodities across 5 categories (শস্য, সবজি, মসলা, ডাল, অন্যান্য) with current/last-week prices, change %, trend. 1-hour cache. Falls back to DAM reference + seasonal simulation.

---

## GET /api/news
**Params**: none

Response: `{ ok, date, season, bulletin, headlines[], englishHeadlines[], govHeadlines[], intlHeadlines[], sources }`. 30-min cache. AI-generated daily bulletin + .gov.bd RSS + Google News + FAO/IRRI/IFPRI.

---

## GET /api/crop-database
**Params**: `category` (Grains|Oils|Spices|Pulses|Fruits|Vegetables|High Value Crops)

Response: `{ ok, category, crops: [{ name, scientificName, description, cultivationAreas, soilRequirements, ... }] }`. AI-generated, 30-min cache.

---

## GET /api/crop-prices
**Params**: `crop` (Bengali name, optional), `month` (1-12), `compare=true`

Response (single crop): `{ ok, price: SimulatedPrice, display: { priceBDT, trendIcon, trendLabel, ... } }`
Response (all): `{ ok, prices: SimulatedPrice[], summary: { total, trending_up, trending_down, trending_stable } }`
Response (compare): `{ ok, profitability: ProfitabilityResult[] }`

---

## GET /api/soil-analysis
**Params**: `aezId` (1-30)

Response: `{ ok, zone, analysis: "AI-generated Bengali soil analysis", sources: ["SRDI", "BARC", "BRRI", "BARI"] }`

## POST /api/soil-analysis
**Body**: `{ sand, silt, clay, organicMatter?, aezId? }` (percentages, sand+silt+clay ≈ 100%)

Response: `{ ok, composition, usdaClassification, zone, analysis, sources }`

---

## GET /api/smart-decision
**Params**: `lat`, `lon`, `city`

Response: `{ ok, topRecommendations: [{crop, combinedScore, weatherScore, priceScore, seasonScore, reason}], cropDetails[], diseasePressure[], sprayWindows[], climateComparison, profitability[], weather }`. 10-min cache.
