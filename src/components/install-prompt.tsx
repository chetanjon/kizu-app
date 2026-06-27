"use client";

import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void> };

// "Add to home screen" nudge. Android/desktop fire the native prompt; iOS has
// no programmatic prompt, so we show Share → Add to Home Screen instructions.
// Hidden when already installed (standalone) or previously dismissed.
// `inline` mode = a permanent button (used on the You tab); otherwise a slim
// dismissible bar fixed above the bottom nav.
export default function InstallPrompt({ inline = false }: { inline?: boolean }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [howto, setHowto] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    if (!inline && localStorage.getItem("kizu-install-dismissed") === "1") return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (ios || inline) setShow(true);

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, [inline]);

  if (!show) return null;

  async function onInstall() {
    if (deferred) {
      await deferred.prompt();
      setShow(false);
    } else {
      setHowto((h) => !h); // iOS / no native prompt → toggle instructions
    }
  }

  const installBtn = (
    <button
      onClick={onInstall}
      className="font-h font-bold text-xs bg-vibe text-white border-[2px] border-ink rounded-full px-3.5 py-1.5 shrink-0"
    >
      install
    </button>
  );

  const howtoBox = howto ? (
    <div className="mt-2 bg-surface text-ink border-[2.5px] border-ink rounded-xl px-3 py-2.5 shadow-[3px_3px_0_#14110F] font-m text-[11px]">
      tap <span className="font-bold">Share</span>, then <span className="font-bold">Add to Home Screen</span>.
    </div>
  ) : null;

  if (inline) {
    return (
      <div>
        <div className="flex items-center gap-2 bg-surface border-[2.5px] border-ink rounded-xl px-3 py-2.5 shadow-[3px_3px_0_#14110F]">
          <span className="font-m text-[12px] font-bold flex-1">
            use kizu<span className="text-red">.</span> like an app
          </span>
          {installBtn}
        </div>
        {howtoBox}
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-[80px] z-30 px-3">
      <div className="mx-auto max-w-[520px]">
        <div className="flex items-center gap-2 bg-ink text-paper rounded-2xl px-3.5 py-3 shadow-[4px_4px_0_#6B4BD6]">
          <span className="font-m text-[12px] font-bold flex-1">
            add kizu<span className="text-red">.</span> to your home screen
          </span>
          {installBtn}
          <button
            onClick={() => {
              localStorage.setItem("kizu-install-dismissed", "1");
              setShow(false);
            }}
            aria-label="dismiss"
            className="text-paper/60 px-1 text-sm shrink-0"
          >
            ✕
          </button>
        </div>
        {howtoBox}
      </div>
    </div>
  );
}
