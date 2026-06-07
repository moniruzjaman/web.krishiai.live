# Components — React Component Reference

## Page Components (src/app/)

| Page | Lines | Key Features | Data Sources |
|------|-------|-------------|-------------|
| `page.tsx` (Home) | 481 | Hero, seasonal tip, stats bar, 6 widgets, 12 tool cards, testimonials, metrics | Mixed |
| `analyzer/page.tsx` | — | Photo upload + symptom picker → CABI diagnosis | `/api/diagnose` |
| `chat/page.tsx` | — | AI chat interface | `/api/chat` |
| `learn/page.tsx` | — | Learning center | — |
| `profile/page.tsx` | — | User profile, install button | — |
| `tools/page.tsx` | — | 12 tool cards grid | — |
| `tools/satellite/page.tsx` | 717 | 3 tabs: NDVI Map, Crop Health, Seasonal Comparison | useLocation, simulated NDVI |
| `tools/soil/page.tsx` | — | AEZ zone selector + soil sample input | `/api/soil-analysis` |
| `tools/irrigation/page.tsx` | — | Irrigation advisor | Open-Meteo |
| `tools/smart-decision/page.tsx` | — | Crop recommendation engine | `/api/smart-decision` |
| `tools/crop-library/page.tsx` | — | 7 category crop database | `/api/crop-database` |
| `tools/pesticide/page.tsx` | — | Pesticide guide | — |
| `tools/plant-health/page.tsx` | — | Plant health diagnostics | — |
| `tools/crop-calendar/page.tsx` | — | 10-crop calendar with seasons | cropCalendar.ts |
| `tools/yield/page.tsx` | — | Yield forecast | — |

## Widget Components (src/components/)

| Component | Lines | Props | Dependencies | Key Behavior |
|-----------|-------|-------|-------------|-------------|
| `MapWidget.tsx` | 135 | None | useLocation, InteractiveMap (dynamic) | Street/satellite toggle, district badge, 15+ BD markers, locate-me |
| `InteractiveMap.tsx` | 240 | lat, lon, height | Leaflet (dynamic, ssr:false, local CSS/icons) | OSM + Esri tiles, user marker + pulse, accuracy circle, category-colored markers |
| `NDVIMap.tsx` | 244 | lat, lon | Leaflet (dynamic, local CSS/icons) | 20+ district NDVI circles, seasonal color, legend overlay, Bangladesh border |
| `WeatherWidget.tsx` | 502 | None | useLocation, /api/weather | Current + hourly + 5-day + agri indices, auto-refresh 30min, Dhaka fallback 3s |
| `MarketWidget.tsx` | 480 | None | useLocation, /api/market | 6 category tabs, Bengali search, price change badges, PriceTrendBar mini-viz |
| `NewsWidget.tsx` | — | None | /api/news | Headlines + AI bulletin |
| `AIChatWidget.tsx` | — | None | /api/chat | Quick chat interface |
| `PhotoGallery.tsx` | — | None | — | Photo gallery |
| `InstallPrompt.tsx` | 185 | None | beforeinstallprompt, navigator.standalone | PWA install banner, iOS guide, 7-day dismiss |
| `ClientShell.tsx` | — | None | Service Worker + InstallPrompt | Registers /sw.js on mount, renders InstallPrompt via dynamic import |
| `TopNavbar.tsx` | — | None | — | App header |
| `BottomNav.tsx` | — | None | — | 5-tab navigation |

## UI Primitives (src/components/ui/)
shadcn/ui components: badge, button, card, input, scroll-area, skeleton, sonner, tabs, toast, toaster

## Context (src/context/)

| Context | Hook | State | Consumers |
|---------|------|-------|-----------|
| LocationContext | `useLocation()` | lat, lon, district, upazila, loading, error, permissionStatus (no auto-grant on mount) | MapWidget, InteractiveMap, NDVIMap, WeatherWidget, MarketWidget, satellite page |

## Dynamic Import Pattern

All Leaflet components use this pattern to avoid SSR crashes:
```tsx
const InteractiveMap = dynamic(() => import('./InteractiveMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full" />
});
```
