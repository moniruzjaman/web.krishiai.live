// Service Worker — Krishi AI
// Version: __BUILD_ID__
const CACHE_VERSION = "krishiai-__BUILD_ID__";
const STATIC_CACHE  = "krishiai-static-__BUILD_ID__";
const APP_SHELL = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await cache.addAll(APP_SHELL);
      const staticCache = await caches.open(STATIC_CACHE);
      await staticCache.addAll(APP_SHELL);
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
  // Enable navigation preload
  if (self.registration?.navigationPreload) {
    self.registration.navigationPreload.enable().catch(() => {});
  }
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Network-only for API calls
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Only handle GET
  if (request.method !== "GET") return;

  // Stale-while-revalidate for navigation
  if (request.mode === "navigate") {
    e.respondWith(
      (async () => {
        try {
          const cached = await caches.match(request);
          const fetchPromise = fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, clone));
            return res;
          }).catch(async () => {
            return await caches.match("/offline.html") || cached;
          });
          return cached || fetchPromise;
        } catch {
          return await caches.match("/offline.html") || new Response("Offline", { status: 503 });
        }
      })()
    );
    return;
  }

  // Stale-while-revalidate for static assets (JS, CSS, fonts, images)
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|ico|avif)(\?.*)?$/i)
  ) {
    e.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const fetchPromise = fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })()
    );
    return;
  }
});

// Background sync — notify clients to drain the offline queue
self.addEventListener("sync", (e) => {
  if (e.tag === "sync-api-post") {
    e.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: "process-queue" }));
      })
    );
  }
});

// Listen for queue-processed acknowledgment
self.addEventListener("message", (e) => {
  if (e.data?.type === "queue-processed") {
    // Client confirmed queue drained
  }
});

// Push notifications
self.addEventListener("push", (e) => {
  let data = { title: "কৃষি AI", body: "", icon: "/icon-192.png" };
  try {
    if (e.data) data = { ...data, ...e.data.json() };
  } catch {}
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    badge: "/icon-192.png",
    data: data.data || {},
  });
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  e.waitUntil(clients.openWindow(url));
});

// Placeholder for Workbox injection
// self.__WB_MANIFEST
