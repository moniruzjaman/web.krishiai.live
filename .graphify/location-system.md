# Location System — GPS, Permissions & Geocoding

## Architecture

```
User Browser
    │
    ▼ (navigator.geolocation.getCurrentPosition)
LocationContext (src/context/LocationContext.tsx)
    │
    ├── State: { lat, lon, district, upazila, loading, error, permissionStatus }
    ├── Hook: useLocation() — consumed by ALL widgets
    ├── Permission prompt UI (Bengali)
    ├── Locate-me floating button
    │
    ├── GPS Flow:
    │   1. Request geolocation permission
    │   2. getCurrentPosition → { lat, lon, accuracy }
    │   3. watchPosition for continuous tracking
    │   4. Reverse geocode via Nominatim
    │   5. Map OSM address components → Bengali district/upazila
    │   6. Persist to localStorage
    │   7. Fallback: Dhaka (23.685, 90.356) after 3s timeout
    │
    └── Nominatim Reverse Geocoding:
        URL: https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&accept-language=bn
        Cache: localStorage, 24h TTL
        Mapping: address.state → district (Bengali)
                 address.suburb/village → upazila
```

## Permission Handling

- **First visit**: LocationContext does NOT auto-request geolocation on mount (prevents double-prompt confusion)
- **Permission trigger**: User must click permission banner or locate-me button to trigger `getCurrentPosition`
- **Denied**: Silently falls back to Dhaka, shows locate-me button to retry
- **Granted**: Stores position, watchPosition for updates
- **Permission change**: Listens via `navigator.permissions.query({ name: 'geolocation' })` onchange event

## Consumers of useLocation()

| Component | What It Uses |
|-----------|-------------|
| MapWidget | lat, lon for map center + district badge |
| InteractiveMap | lat, lon for user marker + accuracy circle |
| NDVIMap | lat, lon for NDVI calculation + user marker |
| WeatherWidget | lat, lon for weather API call |
| MarketWidget | district for price regionalization |
| /tools/satellite page | lat, lon for NDVI + crop health |

## Geocode District Mapping

The LocationContext maps English Nominatim state names to Bengali:
- "Dhaka Division" → "ঢাকা"
- "Chittagong Division" → "চট্টগ্রাম"
- "Rajshahi Division" → "রাজশাহী"
- etc. (8 divisions)

## Gotchas

- Nominatim has 1 req/s rate limit — results cached aggressively in localStorage
- Auto-fallback to Dhaka after 3 seconds if GPS hasn't responded
- watchPosition is used for continuous tracking but only in LocationContext
- District names in Bengali are essential for DAM market price regionalization
- The locate-me floating button is rendered by LocationContext, not individual widgets
