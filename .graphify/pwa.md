# PWA — Install, Manifest & Service Worker

## Components

### 1. Manifest (public/manifest.json)
```json
{
  "name": "KrishiAI — কৃষি AI প্ল্যাটফর্ম",
  "short_name": "KrishiAI",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "lang": "bn",
  "theme_color": "#1b4332",
  "background_color": "#1b4332",
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

### 3. InstallPrompt Component (src/components/InstallPrompt.tsx)
- **Android/Chrome**: Listens for `beforeinstallprompt` event, stores it in global deferred prompt
- **iOS Safari**: Detects standalone mode via `navigator.standalone`, shows manual instructions
- **Dismissing**: Stores in localStorage (`krishiai-install-dismissed`), hides for 7 days
- **Profile page**: Also has an install button that dispatches custom event to trigger prompt
- **Rendered via**: `ClientShell.tsx` (dynamic import with `{ ssr: false }`)

### 4. ClientShell (src/components/ClientShell.tsx)
```tsx
"use client";
import dynamic from "next/dynamic";
const InstallPrompt = dynamic(() => import("./InstallPrompt"), { ssr: false });
export default function ClientShell() {
  return <InstallPrompt />;
}
```

## Install Flow

```
1. User visits web.krishiai.live
2. Browser fires beforeinstallprompt (Chrome/Edge/Android)
   └─ InstallPrompt stores event in window.__krishiDeferredPrompt
3. Banner appears: "অ্যাপ ইনস্টল করুন" button
4. User clicks → deferredPrompt.prompt()
5. If accepted → app installs
6. If dismissed → localStorage set, banner hidden 7 days

iOS Safari:
1. No beforeinstallprompt event
2. Detect standalone=false → show iOS instructions
3. "Share → Add to Home Screen" guide
```

## Icons
- `/public/icons/icon-192.png` — Standard PWA icon
- `/public/icons/icon-512.png` — High-res PWA icon
- Both set as `purpose: "any maskable"` for adaptive icon support

## Notes
- No custom service worker — relies on browser's default PWA behavior
- Next.js generates basic SW automatically with standalone output
- All pages are client-rendered for PWA compatibility
