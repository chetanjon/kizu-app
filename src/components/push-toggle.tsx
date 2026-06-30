"use client";

import { useEffect, useState } from "react";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = "loading" | "hidden" | "ios-needs-install" | "blocked" | "on" | "off" | "busy";

// Opt-in Web Push toggle (You tab). No auto-prompt. Hidden where unsupported or
// unconfigured; on iOS Safari (not installed) it guides to "add to home screen".
export default function PushToggle() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    const supported =
      !!PUBLIC_KEY && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;
      setState(ios && !standalone ? "ios-needs-install" : "hidden");
      return;
    }
    if (Notification.permission === "denied") {
      setState("blocked");
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    });
  }, []);

  async function enable() {
    setState("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "blocked" : "off");
        return;
      }
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
      setState("on");
    } catch {
      setState("off");
    }
  }

  async function disable() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("on");
    }
  }

  if (state === "loading" || state === "hidden") return null;

  const shell =
    "flex items-center gap-3 bg-surface border border-hair rounded-2xl px-4 py-3.5";

  if (state === "ios-needs-install") {
    return (
      <div className={shell}>
        <span className="font-m text-[12px] text-muted">add kizu to your home screen to get notified.</span>
      </div>
    );
  }
  if (state === "blocked") {
    return (
      <div className={shell}>
        <span className="font-m text-[12px] text-muted">notifications are blocked — turn them on in your browser settings.</span>
      </div>
    );
  }

  const on = state === "on";
  return (
    <div className={shell}>
      <span className="font-b font-semibold text-[14px] flex-1">push notifications</span>
      <button
        onClick={on ? disable : enable}
        disabled={state === "busy"}
        aria-pressed={on}
        className={`relative h-[26px] w-[46px] rounded-full transition-colors shrink-0 disabled:opacity-60 ${on ? "bg-vibe" : "bg-surface-2 border border-hair"}`}
      >
        <span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all ${on ? "left-[24px]" : "left-[3px]"}`} />
      </button>
    </div>
  );
}
