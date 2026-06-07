const CACHE_VERSION = "v1";
const STATIC_CACHE = `krishiai-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `krishiai-dynamic-${CACHE_VERSION}`;
const API_CACHE = `krishiai-api-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

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
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => {
            return key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE;
          })
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/data/") ||
    url.pathname.startsWith("/deficiency/") ||
    url.pathname.startsWith("/disease/") ||
    url.pathname.startsWith("/pest/") ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|gif|svg|ico|woff2?|json)$/)
  );
}

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(networkFirstWithFallback(event.request, API_CACHE));
    return;
  }

  if (isStaticAsset(url)) {
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
    if (response && response.status === 200 && response.type === "basic") {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(OFFLINE_URL);
  }
}

async function networkFirstWithFallback(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
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
