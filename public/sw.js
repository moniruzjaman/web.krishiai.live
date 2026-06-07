/**
 * KrishiAI — Service Worker for PWA Offline Support
 *
 * Strategy: Cache-first for static assets, Network-first for API calls
 * Version: 3.0.0
 */

const CACHE_NAME = 'krishi-v3.0.0';
const STATIC_CACHE = 'krishi-static-v3.0.0';
const DYNAMIC_CACHE = 'krishi-dynamic-v3.0.0';

// Static assets to pre-cache on install
const PRE_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event — pre-cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRE_CACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-cache failed for some URLs:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event — routing strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // API routes — Network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE, 300)); // 5 min stale
    return;
  }

  // External API calls (Open-Meteo, etc.) — Network-only, no caching
  if (!url.origin.includes(self.location.origin)) {
    // For CDN assets (leaflet, fonts), use cache-first
    if (url.hostname.includes('unpkg.com') ||
        url.hostname.includes('cdn.jsdelivr.net') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com')) {
      event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
      return;
    }
    return; // Network-only for external APIs
  }

  // Static assets — Cache-first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages — Network-first with cache fallback
  event.respondWith(networkFirst(request, DYNAMIC_CACHE, 3600));
});

// ── Cache Strategies ────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function networkFirst(request, cacheName, maxAgeSeconds = 300) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      // Check if cache is stale (but still serve it)
      const dateHeader = cached.headers.get('date');
      if (dateHeader) {
        const age = (Date.now() - new Date(dateHeader).getTime()) / 1000;
        if (age > maxAgeSeconds) {
          // Stale but usable — add warning header
          const headers = new Headers(cached.headers);
          headers.set('X-Cache-Status', 'STALE');
          return new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers,
          });
        }
      }
      return cached;
    }
    return new Response(JSON.stringify({ ok: false, error: 'অফলাইন — ইন্টারনেট সংযোগ নেই' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
