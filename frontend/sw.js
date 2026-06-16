/**
 * AtlasPi Service Worker — PWA
 * v1.0 Mainnet
 */

const CACHE_NAME = "atlaspi-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/discover.html",
  "/profile.html",
  "/vip.html",
  "/payments.html",
  "/map.html",
  "/support.html",
  "/style.css",
  "/config.js",
  "/notifications.js",
  "/mobile-menu.js",
  "/logo-atlaspi.png",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.hostname.includes("onrender.com") ||
      url.hostname.includes("minepi.com")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (event.request.method === "GET" && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return caches.match("/index.html");
        });
      })
  );
});
