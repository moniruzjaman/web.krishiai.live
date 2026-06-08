const CACHE_VERSION = "v2";
const STATIC_CACHE = `krishiai-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `krishiai-dynamic-${CACHE_VERSION}`;
const API_CACHE = `krishiai-api-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";
const NEXT_ROUTES = ["/", "/chat", "/tools", "/profile", "/learn", "/analyzer", "/offline"];

const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/logo.svg",
  "/leaflet.css",
  "/marker-icon.png",
  "/marker-icon-2x.png",
  "/marker-shadow.png",
  "/fonts/noto-sans-bengali.woff2",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Allow install to proceed even if some assets fail
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE)
            .map((key) => caches.delete(key))
        );
      }),
      self.clients.claim(),
    ])
  );
});

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isNextStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/^\/_next\/static\/.+\/.+\.(js|css|json)$/)
  );
}

function isPublicAsset(url) {
  return (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/data/") ||
    url.pathname.startsWith("/deficiency/") ||
    url.pathname.startsWith("/disease/") ||
    url.pathname.startsWith("/pest/") ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|gif|svg|ico|woff2?)$/)
  );
}

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

async function handleNextData(url) {
  if (url.pathname.startsWith("/_next/data/")) {
    const cached = await caches.match(url);
    if (cached) return cached;
  }
  return null;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  // Next.js data routes (RSC payloads)
  if (url.pathname.startsWith("/_next/data/")) {
    event.respondWith(networkFirstWithFallback(event.request, DYNAMIC_CACHE, { cacheOpaque: true }));
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(networkFirstWithFallback(event.request, API_CACHE, { networkTimeout: 5000 }));
    return;
  }

  if (isNextStaticAsset(url) || isPublicAsset(url)) {
    event.respondWith(cacheFirstWithFallback(event.request, STATIC_CACHE));
    return;
  }

  if (isNavigationRequest(event.request)) {
    event.respondWith(networkFirstWithNavigationFallback(event.request));
    return;
  }

  event.respondWith(networkFirstWithFallback(event.request, DYNAMIC_CACHE));
});

async function cacheFirstWithFallback(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && (response.status === 200 || response.status === 0) && response.type === "basic") {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(OFFLINE_URL);
  }
}

async function networkFirstWithFallback(request, cacheName, opts = {}) {
  const { networkTimeout = 7000, cacheOpaque = false } = opts;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Network timeout")), networkTimeout)
  );

  try {
    const response = await Promise.race([fetch(request), timeoutPromise]);
    if (response && (response.status === 200 || (cacheOpaque && response.status === 0))) {
      const cache = await caches.open(cacheName);
      try {
        cache.put(request, response.clone());
      } catch {
        // Ignore cache put failures for opaque responses
      }
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return caches.match(OFFLINE_URL);
  }
}

async function networkFirstWithNavigationFallback(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return caches.match(OFFLINE_URL);
  }
}

// Listen for skip-waiting message from client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
