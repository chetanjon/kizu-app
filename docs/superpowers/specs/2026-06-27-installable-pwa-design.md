# kizu — installable app (PWA), Step 1

**Date:** 2026-06-27
**Status:** approved, building

## Goal

Make kizu installable to the home screen on **iOS, Android, and desktop** so it behaves like a real app — own icon, full-screen (no browser chrome), faster launch, and **stays logged in** (no re-bookmarking / re-login). This is Step 1; it also lays the groundwork for Web Push later (especially on iOS, where push requires the app be installed).

Out of scope (later): Web Push, email notifications, offline content caching, SMS/iMessage (iMessage is impossible — no third-party API; SMS rejected: paid + compliance, breaks $0).

## Decisions (locked)

- **Icon = "D · framed"**: cream tile, thick ink border, bold `k.` with the precious red dot. iOS rounds it gently (frame survives); Android gets a **mask-safe variant** (cream bleeds to the edge, frame inset within the safe zone, `k.` centered) so the round crop doesn't slice the border.
- **Install prompt:** a slim, dismissible bar on the app. Android/desktop → fires the native install prompt; iPhone → opens a small instruction popover ("tap Share → Add to Home Screen") since iOS has no programmatic prompt. Shows only when not already installed and not previously dismissed (remembered). Plus a permanent quiet "install" entry on the **You** tab.
- **$0 / no new deps:** icons rendered via Next's built-in `next/og` `ImageResponse` (already used by `opengraph-image.tsx`); service worker is hand-written and minimal.

## Files

### Icons (next/og ImageResponse)
- **`src/lib/app-icon.tsx`** — shared JSX builder `kizuIconResponse(size, { maskable })` returning an `ImageResponse`. Framed look: outer cream; for maskable, ~16% cream bleed then the inset ink-bordered tile; `k.` (ink) + `.` (`#FF2E4D`) centered, bold sans, ~62% of the tile. (Default font is fine at icon scale — exact Archivo not required.)
- **`src/app/apple-icon.tsx`** — 180×180, framed (non-maskable). Next auto-links `apple-touch-icon` → **the iOS home-screen icon**.
- **`src/app/icon.tsx`** — 512×512, framed. Next auto-links it (favicon/general); replaces the default `favicon.ico` (delete `src/app/favicon.ico`).
- **`src/app/icons/icon.png/route.tsx`** — 512 "any" PNG at a stable URL `/icons/icon.png` (`export const dynamic = "force-static"`).
- **`src/app/icons/maskable.png/route.tsx`** — 512 "maskable" PNG at `/icons/maskable.png` (force-static).

### Manifest + viewport/meta
- **`src/app/manifest.ts`** → `MetadataRoute.Manifest`: `name` "kizu — good taste runs in the group", `short_name` "kizu", `description`, `start_url: "/home"`, `scope: "/"`, `display: "standalone"`, `background_color`/`theme_color` `#EDE3CE`, `icons` = the two `/icons/*.png` (purpose `any` + `maskable`). Next auto-injects `<link rel="manifest">`.
- **`src/app/layout.tsx`** — add to `metadata`: `appleWebApp: { capable: true, title: "kizu", statusBarStyle: "default" }`; add `export const viewport: Viewport = { themeColor: "#EDE3CE" }`. (Gives the iOS standalone title + status bar, and the Android theme color.)

### Service worker (installability; minimal + safe)
- **`public/sw.js`** — `skipWaiting` on install, `clients.claim` on activate, and a **fetch listener that does NOT call `respondWith`** (pass-through to network). This satisfies Chrome's installability requirement without caching anything — deliberately no caching now, to avoid serving stale authed pages. (Offline/caching can come with the push phase.)
- **`src/components/pwa-register.tsx`** (client) — registers `/sw.js` on mount; rendered once in `src/app/layout.tsx` `<body>`.

### Install prompt
- **`src/components/install-prompt.tsx`** (client):
  - Captures `beforeinstallprompt` (Android/desktop), prevents default, stashes the event.
  - Detects **iOS** (`/iphone|ipad|ipod/i` on UA) **and not standalone**.
  - Hides entirely if running standalone (`matchMedia("(display-mode: standalone)")` or `navigator.standalone`) or if `localStorage["kizu-install-dismissed"]` is set.
  - Renders a slim fixed bar above the bottom nav (`fixed inset-x-0 bottom-[76px] z-30`): text "add kizu to your home screen" + an **install** button + a dismiss ✕.
    - Android/desktop: install → `evt.prompt()`.
    - iOS: install → toggles a small popover: "tap ⎙ Share, then **Add to Home Screen**".
  - Dismiss writes the localStorage flag.
  - Rendered in **`src/app/(app)/layout.tsx`** (self-hides; shows across the signed-in app).
- **You tab** (`src/app/(app)/you/page.tsx`): a small permanent **"install kizu"** affordance reusing the same component in an inline (non-fixed) mode, for users who dismissed the bar. (If the You page structure makes this awkward, ship the bar first and add the You entry as a tiny follow-up — noted.)

## Behavior / edge cases
- Already-installed users: prompt never shows; `start_url=/home` opens straight into the app (auth session persists in the standalone window — the "no re-login" win).
- Non-installable browsers (e.g. iOS shows instructions, not a button that auto-installs).
- No service-worker caching of API/auth responses (avoids stale/broken authed states).
- Brand: bar uses tokens (`bg-ink`/`bg-surface`, `border-ink`, hard shadow); copy stays sparse/lowercase; RED only on the icon dot.

## Verification
- `npm run build` clean; confirm `/manifest.webmanifest`, `/icons/icon.png`, `/icons/maskable.png`, `/apple-icon`, `/icon` all generate.
- Manual: Chrome desktop/Android → install prompt appears, installs, launches standalone at /home; Lighthouse PWA "installable" check passes.
- Manual (iPhone Safari): bar shows the Share→Add-to-Home-Screen instructions; after install, the framed icon appears, launches full-screen, stays logged in.
- No deploy without explicit approval.
