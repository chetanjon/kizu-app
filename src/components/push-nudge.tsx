"use client";

import { useEffect, useState } from "react";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const DISMISS_KEY = "kizu-push-nudge-dismissed";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = "checking" | "show" | "hidden" | "busy";

// Slim, one-time-dismissible Home banner pointing people at push. Shows ONLY for
// users who can enable push but haven't (supported, not denied, no subscription,
// not dismissed). iOS-not-installed is left to InstallPrompt (push needs the PWA).
export default function PushNudge() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    const supported =
      !!PUBLIC_KEY && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    // Stay in "checking" (renders null) on every bail-out; only flip to "show"
    // async, once we confirm there's no existing subscription.
    if (!supported || Notification.permission === "denied") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "hidden" : "show"))
      .catch(() => {});
  }, []);

  async function enable() {
    setState("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState(perm === "denied" ? "hidden" : "show");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY!),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });
      setState("hidden");
    } catch {
      setState("show");
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setState("hidden");
  }

  if (state === "checking" || state === "hidden") return null;

  return (
    <div className="mt-4 max-w-[520px]">
      <div className="flex items-center gap-2 bg-surface border-[2.5px] border-ink rounded-xl px-3 py-2.5 shadow-[3px_3px_0_#14110F]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <span className="font-m text-[12px] font-bold flex-1">get a ping when someone drops</span>
        <button
          onClick={enable}
          disabled={state === "busy"}
          className="font-h font-bold text-xs bg-vibe text-white border-[2px] border-ink rounded-full px-3.5 py-1.5 shrink-0"
        >
          {state === "busy" ? "…" : "turn on"}
        </button>
        <button onClick={dismiss} aria-label="dismiss" className="text-muted px-1 text-sm shrink-0">
          ✕
        </button>
      </div>
    </div>
  );
}
