// Minimal service worker — its only job (for now) is to make kizu installable.
// Intentionally NO caching: authed pages stay fresh, no stale-state surprises.
// Caching/offline + push handlers can be added in the push phase.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // No respondWith → the browser performs its normal network request.
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
