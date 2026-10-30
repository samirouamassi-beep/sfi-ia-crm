// Service worker RetroGame Vault.
// - Ressources statiques Next (_next/static, icônes) : cache d'abord (fichiers immuables).
// - Navigations : réseau d'abord, repli sur la dernière version en cache puis page hors ligne.
// - API et server actions : jamais mis en cache (données financières toujours fraîches).

const VERSION = "v1";
const STATIC_CACHE = `static-${VERSION}`;
const PAGES_CACHE = `pages-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES_CACHE).then((c) => c.add(OFFLINE_URL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pwa-icon/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && !res.redirected) {
            const copy = res.clone();
            caches.open(PAGES_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match(OFFLINE_URL)))
    );
  }
});
