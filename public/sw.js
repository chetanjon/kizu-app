// Service worker: installability + push + IMMUTABLE-ASSET caching only.
// Pages and APIs are deliberately never cached (authed pages stay fresh, no
// stale-state surprises). What IS cached never changes for a given url:
//  - /_next/static/* (content-hashed js/css/fonts) → cache-first
//  - cover art (tmdb posters, apple album art)     → cache-first, capped
// This makes PWA re-opens stop re-downloading the heavy stuff on cellular.
const STATIC_CACHE = "kizu-static-v1";
const IMG_CACHE = "kizu-img-v1";
const IMG_MAX = 150; // art entries kept; oldest evicted past this

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, IMG_CACHE]);
      for (const k of await caches.keys()) if (!keep.has(k)) await caches.delete(k);
      await self.clients.claim();
    })()
  );
});

async function trimCache(cache, max) {
  const keys = await cache.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(k);
}

async function cacheFirst(cacheName, request, max) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  // opaque = the no-cors <img> case; still cacheable. put() can throw on
  // quota — a miss just means the network keeps serving, so swallow it.
  if (res.ok || res.type === "opaque") {
    try {
      await cache.put(request, res.clone());
      if (max) trimCache(cache, max);
    } catch (e) {
      /* quota — keep going uncached */
    }
  }
  return res;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // hashed build assets + self-hosted fonts — immutable per url
  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(STATIC_CACHE, req));
    return;
  }
  // cover art — poster/artwork urls never change content
  if (url.hostname === "image.tmdb.org" || url.hostname.endsWith("mzstatic.com")) {
    event.respondWith(cacheFirst(IMG_CACHE, req, IMG_MAX));
    return;
  }
  // everything else (pages, api, supabase) → normal network request.
});

// Web Push: show the notification.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }
  const title = data.title || "kizu.";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon.png",
      badge: "/icons/icon.png",
      // `tag` collapses same-tag pings into one tray entry (kizu-curate bursts
      // become a single "kizu drop."). Absent on member drops → they stack.
      tag: data.tag || undefined,
      // `kind` lets the app find + clear these once the user opens kizu
      // (e.g. drop pings are stale the moment you're looking at the feed).
      data: { url: data.url || "/home", kind: data.kind || null },
    })
  );
});

// Tapping a notification: focus an open tab (navigating it) or open a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/home";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
