"use client";

import { useEffect } from "react";

// Registers the minimal service worker (required for installability) and clears
// stale "drop" push notifications whenever the user is actually looking at kizu —
// once you're in the app, "someone dropped something." is already answered by the feed.
export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});

    const clearDropNotifs = () => {
      if (document.visibilityState !== "visible") return;
      navigator.serviceWorker.ready
        .then((reg) => reg.getNotifications())
        .then((ns) =>
          ns.forEach((n) => {
            if (n.data?.kind === "drop") n.close();
          }),
        )
        .catch(() => {});
    };

    clearDropNotifs();
    document.addEventListener("visibilitychange", clearDropNotifs);
    window.addEventListener("focus", clearDropNotifs);
    return () => {
      document.removeEventListener("visibilitychange", clearDropNotifs);
      window.removeEventListener("focus", clearDropNotifs);
    };
  }, []);
  return null;
}
