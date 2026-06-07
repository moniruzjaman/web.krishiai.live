# PWA — Install, Manifest & Service Worker

## Components

### 1. Manifest (public/manifest.json)
```json
{
  "name": "KrishiAI — কৃষি AI প্ল্যাটফর্ম",
  "short_name": "KrishiAI",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "minimal-ui", "standalone"],
  "orientation": "portrait-primary",
  "lang": "bn",
  "theme_color": "#1b4332",
  "background_color": "#1b4332",
  "edge_side_panel": { "preferred_width": 400 },
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### 2. Layout Meta Tags (src/app/layout.tsx)
- `<link rel="manifest" href="/manifest.json">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- `<meta name="apple-mobile-web-app-title" content="KrishiAI">`
- `<link rel="icon" href="/icons/icon-192.png">`
- `<link rel="apple-touch-icon" href="/icons/icon-192.png">`

### 3. Service Worker (public/sw.js)
Custom service worker with 3-tier caching:

| Strategy | Scope | Behavior |
|----------|-------|----------|
| **Cache-first** | `_next/static/*`, `.css`, `.js`, `.png`, `/icons/`, `/data/`, Leaflet assets | Serve from cache immediately. On miss, fetch + cache. |
| **Network-first** | `/api/*` | Try network first. On success, cache response. On failure, serve cached copy. |
| **Network-first** | Navigation (HTML pages) | Try network first. On success, cache HTML. On failure, serve `/offline` fallback page. |

Precached on install:
```js
const PRECACHE_URLS = [
  "/", "/offline", "/manifest.json",
  "/icons/icon-192.png", "/icons/icon-512.png", "/logo.svg",
  "/leaflet.css",
  "/marker-icon.png", "/marker-icon-2x.png", "/marker-shadow.png",
];
```

#### SW Registration (src/components/ClientShell.tsx)
```tsx
useEffect(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
  }
}, []);
```

### 4. InstallPrompt Component (src/components/InstallPrompt.tsx)
- **Android/Chrome**: Listens for `beforeinstallprompt` event, stores it in global deferred prompt
- **iOS Safari**: Detects standalone mode via `navigator.standalone`, shows manual instructions
- **Dismissing**: Stores in localStorage (`krishiai-install-dismissed`), hides for 7 days
- **Profile page**: Also has an install button that dispatches custom event to trigger prompt
- **Rendered via**: `ClientShell.tsx` (dynamic import with `{ ssr: false }`)

### 5. ClientShell (src/components/ClientShell.tsx)
```tsx
"use client";
import dynamic from "next/dynamic";
const InstallPrompt = dynamic(() => import("./InstallPrompt"), { ssr: false });
export default function ClientShell() {
  // Registers service worker, renders InstallPrompt
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  return <InstallPrompt />;
}
```

### 6. Offline Fallback Page (src/app/offline/page.tsx)
- Static page served by the service worker when navigation fails
- Contains Bengali message, DAE hotline number, retry button
- Precached by SW so it's available offline

## Install Flow

```
1. User visits web.krishiai.live
2. Service worker installs + precaches URLs
3. Browser fires beforeinstallprompt (Chrome/Edge/Android)
   └─ InstallPrompt stores event in window.__krishiDeferredPrompt
4. Banner appears: "অ্যাপ ইনস্টল করুন" button
5. User clicks → deferredPrompt.prompt()
6. If accepted → app installs
7. If dismissed → localStorage set, banner hidden 7 days

iOS Safari:
1. No beforeinstallprompt event
2. Detect standalone=false → show iOS instructions
3. "Share → Add to Home Screen" guide

Offline:
1. SW intercepts navigation request → network fails
2. SW serves cached offline page (/offline)
3. Retry button triggers location.reload()
```

## Icons
- `/public/icons/icon-192.png` — Standard PWA icon
- `/public/icons/icon-512.png` — High-res PWA icon
- Both set as `purpose: "any maskable"` for adaptive icon support

## Leaflet Assets (Offline PWA)
- `/public/leaflet.css` — Local copy of Leaflet styles (downloaded from unpkg)
- `/public/marker-icon.png`, `/marker-icon-2x.png`, `/marker-shadow.png` — Local marker icons
- Both InteractiveMap.tsx and NDVIMap.tsx use local URLs (`/leaflet.css`, `/marker-icon*.png`) instead of CDN
- Precached by SW for offline map rendering
