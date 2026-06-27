# kizu — Web Push (Step 2)

**Date:** 2026-06-27
**Status:** approved, building

## Goal

Deliver kizu's existing earned, cryptic notifications (`rec_for_you`, `it_landed`) to the **lock screen** via Web Push, for users who opt in — piggybacking on the existing `notify()` path so push stays sparse, capped, and on-brand. Builds on the installable PWA shipped in Step 1.

Out of scope: new notification events; `weekly_read` push (that's Phase 5, not built); email; offline caching.

## Decisions (locked)

- **Library:** `web-push` (approved) for VAPID signing + payload encryption. New dep + `@types/web-push`.
- **Keys:** a VAPID pair (generated locally). Env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:jonnalagadda8800@gmail.com`). User adds all three to Vercel; written to `.env.local` for dev.
- **Opt-in only.** A toggle on the **You** tab. No auto-prompt. On iPhone, push works only inside the installed PWA — the toggle detects non-standalone iOS and tells the user to add to home screen first.
- **Graceful when unconfigured:** if VAPID env is missing, the send path no-ops and the client toggle hides — so deploying the code before the env vars are set never breaks prod.

## Architecture

### DB — migration `supabase/migrations/20260627_push_subscriptions.sql`
`push_subscriptions`: `id uuid pk`, `user_id uuid → users`, `endpoint text unique not null`, `p256dh text not null`, `auth text not null`, `created_at timestamptz default now()`. Index on `user_id`. RLS owner-only (reads/writes happen via the service-role admin client in routes). Applied by the user in the Supabase SQL editor. Hand-update `database.types.ts`.

### Send — `src/lib/push.ts`
- Configures `web-push` VAPID details from env once (module load), guarded: if any VAPID env var is missing, `sendPushToUser` returns immediately (no-op).
- `sendPushToUser(admin, userId, payload: { title: string; body?: string; url?: string })`: load the user's subscriptions; `webpush.sendNotification(sub, JSON.stringify(payload))` for each; on `404`/`410` delete that subscription (pruning). Wrapped so failures never throw to the caller.

### Emit — extend `src/lib/notify.ts`
After the in-app insert, call `sendPushToUser(admin, userId, { title: body, url: href ?? "/home" })` inside a try/catch (push failure must not affect the in-app notification). The cryptic line is the push title; tapping opens `href`. The existing `capHours` already gates frequency, so push inherits the cap. (When `capHours` skips the insert, it returns early — no push either, correct.)

### Service worker — `public/sw.js`
Add:
- `push` listener → `event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/icons/icon.png", badge: "/icons/icon.png", data: { url: data.url } }))`.
- `notificationclick` listener → close the notification; focus an existing client if one is open, else `clients.openWindow(url)`.
Keep the existing install/activate/fetch handlers.

### API
- `POST /api/push/subscribe` `{ subscription }` — `getUser()`; upsert `{ user_id, endpoint, p256dh, auth }` by `endpoint` via admin. Returns `{ ok: true }`.
- `POST /api/push/unsubscribe` `{ endpoint }` — `getUser()`; delete the row for `(user_id, endpoint)` via admin.

### Client — `src/components/push-toggle.tsx`
- Hides entirely if `!("serviceWorker" in navigator)`, `!("PushManager" in window)`, or `!NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- iOS + not standalone → render a short "add kizu to your home screen to get notified" note instead of the toggle.
- On enable: `Notification.requestPermission()`; if granted, `reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY) })` → POST `/api/push/subscribe`. Reflect state (on/off). On disable: unsubscribe + POST `/api/push/unsubscribe`.
- Reads current state from `reg.pushManager.getSubscription()` on mount.
- Placed on the **You** tab (near the install entry).

## Edge cases / safeguards
- Missing VAPID env → send no-ops, toggle hidden (safe deploy before env set).
- Permission denied → toggle shows "blocked; enable in browser settings."
- Re-subscribe idempotent (upsert by endpoint).
- Expired/invalid subscriptions pruned on send (404/410).
- iOS pre-install → guidance, not a dead button.
- Push send never blocks or breaks the in-app notification (try/catch).

## Deploy prerequisites (user actions, I'll guide with exact values)
1. Apply `20260627_push_subscriptions.sql` in Supabase.
2. Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` to Vercel (Production). (Generated locally; I'll print them.)
Then push to deploy.

## Verification
- `npm run build` + `tsc` clean.
- Local (desktop Chrome, installed or localhost): enable toggle → permission granted → subscription stored; trigger a `rec_for_you`/`it_landed` → lock-screen/system notification appears; tap → opens the right page.
- Dead-subscription pruning on send.
- iPhone (installed PWA): toggle enables; receives push.
- Safe-deploy: with env unset, app builds and runs; toggle hidden; sends no-op.
