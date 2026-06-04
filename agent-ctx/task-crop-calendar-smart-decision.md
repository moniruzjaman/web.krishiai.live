# Task: Create Crop Calendar + Smart Decision Pages with Shared Data Modules

## Agent: Main Developer
## Status: COMPLETED

## Files Created

### 1. Shared Data Module: `/src/lib/cropCalendar.ts`
- TypeScript types: `CropSeason`, `CropEntry`, `SeasonColors`, `CurrentCrop`, `RiskAlert`, `GregorianMonth`
- `CROP_CALENDAR` array with all 10 crops (ধান, পাট, আলু, টমেটো, বেগুন, সরিষা, কলা, আম, গম, ভুট্টা)
- `BENGALI_MONTHS` and `GREGORIAN_MONTHS` arrays
- `SEASON_COLORS` object with color coding for each season
- `getCurrentCrops()` function
- `getCurrentRiskAlerts()` function
- `getPlantingCrops()` function

### 2. Shared Data Module: `/src/lib/cropPriceService.ts`
- TypeScript types: `CropPriceInfo`, `BaselinePrice`, `SimulatedPrice`, `ProfitabilityResult`, `TrendDisplay`
- `CROP_PRICE_MAP` with crop codes and market names
- `BASELINE_PRICES` with seasonal pricing for all 15 crops
- `simulateCurrentPrice()` function (fixed Date.now() bug)
- `getAllCropPrices()` function
- `compareCropProfitability()` function
- `formatPriceBDT()` function
- `getTrendDisplay()` function

### 3. Shared Data Module: `/src/lib/weatherService.ts`
- TypeScript types: `CropTempRange`, `ClimateAverage`, `ForecastDay`, `ParsedForecast`, `SuitabilityScore`, `DiseasePressure`, `IrrigationNeed`, `SprayWindow`
- `CROP_TEMP_RANGES` for crop-specific optimal temperatures
- `CROP_WATER_NEEDS` for irrigation planning
- `BD_CLIMATE_AVERAGES` for Bangladesh monthly climate data
- `fetch7DayForecast()` function
- `parseForecast()` function
- `scoreCropWeatherSuitability()` function
- `forecastDiseasePressure()` function
- `estimateIrrigationNeed()` function
- `findSprayWindows()` function
- `compareWithClimate()` function
- `getClimateAverage()` function

### 4. Crop Calendar Page: `/src/app/tools/crop-calendar/page.tsx`
- Green gradient header matching other tools pages
- Current season banner with active crops
- Risk alerts section for current month
- Visual 12-month × 10-crop calendar grid with color-coded seasons
- Season legend
- Per-crop expandable detail cards with seasons, diseases, pests, tips
- Mobile-responsive, dark mode support, Bengali text throughout

### 5. Smart Decision Page: `/src/app/tools/smart-decision/page.tsx`
- Green gradient header matching other tools pages
- 5-tab interface: Recommend, Weather, Price, Irrigation, Compare
- Top 3 crop recommendations with combined scoring (weather 40%, price 35%, season 25%)
- Weather suitability scores per crop
- Price trend analysis with direction indicators
- Irrigation needs assessment
- Disease pressure forecast
- Spray window recommendations
- Side-by-side crop comparison tool with dropdown selectors
- Fetches current weather from /api/weather
- Mobile-responsive, dark mode support, Bengali text throughout

### 6. API Route: `/src/app/api/smart-decision/route.ts`
- GET endpoint accepting lat, lon, city params
- Fetches weather forecast from Open-Meteo
- Combines with crop calendar, price data, and weather scoring
- Returns comprehensive analysis JSON with topRecommendations, cropDetails, diseasePressure, sprayWindows, climateComparison, profitability
- CORS support and caching

### 7. Updated Files
- `/src/app/page.tsx` — Added Crop Calendar and Smart Decision entries to TOOLS array (before কৃষি শিখন কেন্দ্র)
- `/src/app/tools/page.tsx` — Added Crop Calendar and Smart Decision cards with "নতুন" badges

## Bug Fixed
- Fixed `Date.now()` - `new Date().getTime()` ordering bug in `simulateCurrentPrice()` that caused 500 error

## All Routes Verified
- `/` — 200 ✅
- `/tools` — 200 ✅
- `/tools/crop-calendar` — 200 ✅
- `/tools/smart-decision` — 200 ✅
- `/api/smart-decision` — 200 ✅

## Lint Check
- No errors or warnings in any of the new files ✅
