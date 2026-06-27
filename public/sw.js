// Minimal service worker — its only job (for now) is to make kizu installable.
// Intentionally NO caching: authed pages stay fresh, no stale-state surprises.
// Caching/offline + push handlers can be added in the push phase.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // No respondWith → the browser performs its normal network request.
});
