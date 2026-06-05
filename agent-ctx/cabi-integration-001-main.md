# Task: CABI Plantwise Diagnosis System Integration

## Task ID: cabi-integration-001

## Summary
Successfully replaced the simple analyzer section with the professional CABI Plantwise diagnosis system.

## What was done:

### 1. Added 3 missing functions to `src/lib/cropDiseases.ts`
- `matchDiseasesBySymptoms()` — matches diseases by symptom keywords
- `estimateInoculumPressure()` — estimates inoculum pressure by season
- `getVarietySusceptibility()` — determines variety susceptibility

### 2. Created CABI library files in `src/lib/cabi/`
- `bengaliKeywords.ts` — 90+ Bengali→English symptom keyword mappings
- `cropCalendar.ts` — 10 crops, seasons, months, diseases, pests, tips
- `diagnosticEngine.ts` — Offline CABI diagnostic engine (exclusion gates, disease triangle, IPM)
- `agronomicEngine.ts` — Season/weather scoring, ensemble scoring, weather risk summary

### 3. Created `/api/diagnose` route with multi-provider waterfall
- Primary: z-ai-web-dev-sdk VLM (always available)
- Fallback 1: Gemini 2.5 Flash (requires GEMINI_API_KEY)
- Fallback 2: OpenRouter Qwen-VL (requires OPENROUTER_API_KEY)
- Fallback 3: Groq Llama4 Scout (requires GROQ_API_KEY)
- Fallback 4: z-ai-web-dev-sdk text-only
- Fallback 5: Offline CABI engine
- Fallback 6: Emergency regex-based diagnosis

### 4. Rewrote `/analyzer` page with CABI methodology UI
- CABI Plantwise branding header
- Crop selector (10 Bangladesh crops)
- Symptom chips organized by 6 categories
- Image upload (camera + gallery)
- Full structured diagnosis display:
  - Exclusion gates visualization (color-coded)
  - Disease candidates with confidence bars
  - Disease triangle assessment (scored 1-10)
  - Field confirmation methods
  - Severity & economic threshold
  - IPM recommendations (cultural → biological → chemical)
  - Chemical options with FRAC/IRAC groups
  - Prevention & DAE consultation
  - Provider badge
- All Bengali-first output

### 5. Updated environment variables
- Added GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY placeholders

### 6. Updated references
- `src/app/page.tsx` — Updated first tool description
- `src/app/tools/page.tsx` — Updated subtitle
- `src/app/tools/plant-health/page.tsx` — Updated how-it-works description

### 7. Added deprecation note to old API route
- `src/app/api/analyze/route.ts` — Marked as @deprecated

## Build Status
✅ Build passes successfully (`next build`)
✅ Dev server running without errors
✅ All lint errors are from pre-existing code (not new files)
