# Components Reference

## Widget Components (Home Page)

### WeatherWidget.tsx
- Live GPS via LocationContext, 30-min auto-refresh
- Shows: temp, alerts, agri advisory, UV/dew/pressure/cloud, soil moisture/ET0/GDD
- Dhaka fallback after 3s if location unavailable
- WMO weather codes with Bengali descriptions

### MapWidget.tsx
- Wrapper with street/satellite toggle + district badge
- Dynamic import of InteractiveMap (SSR: false)
- Height: 300px (mobile) → 360px (sm) → 420px (lg)

### InteractiveMap.tsx
- Leaflet map with 15+ BD agricultural institution markers
- Categories: extension (green), research (blue), corporation (purple), weather (amber)
- User location marker with pulse animation + accuracy circle
- Esri World Imagery satellite toggle
- Uses local Leaflet CSS (`/leaflet.css`) and icons (`/marker-icon*.png`) for PWA offline

### NDVIMap.tsx
- Simulated NDVI overlay across 20+ BD districts
- Seasonal adjustment by month (Boro/Aman/Aus factors)
- Color-coded circles: bare soil → dense vegetation
- No real satellite API — uses static simulation
- Uses local Leaflet CSS (`/leaflet.css`) and fixed icon URLs for PWA offline

### MarketWidget.tsx
- Displays DAM prices from /api/market
- Categories: শস্য, সবজি, মসলা, ডাল, অন্যান্য

### NewsWidget.tsx
- 4 tabs: Headlines, English, Gov, International
- Sources: Google News RSS, .gov.bd RSS, FAO/IRRI

### AIChatWidget.tsx
- Inline chat widget on home page
- Connects to /api/chat

## Navigation Components

### TopNavbar.tsx
- App title + logo + notification icon

### BottomNav.tsx
- 5 tabs: Home, Tools, Chat, Learn, Profile

### ClientShell.tsx
- SSR-safe wrapper for LocationProvider + InstallPrompt + Toaster
- Registers service worker (`/sw.js`) on mount
- Dynamically imports InstallPrompt with `ssr: false`

## PWA Components

### InstallPrompt.tsx
- Detects `beforeinstallprompt` event (Chrome/Edge/Samsung)
- iOS Safari manual instructions
- Stores dismissal in localStorage
- Profile page can trigger install via `getInstallPrompt()`

## Context

### LocationContext.tsx
- App-wide GPS provider with Nominatim reverse geocoding
- Permission prompt banner + locate-me floating button
- Stores last known location in localStorage
- Dhaka fallback when permission denied
