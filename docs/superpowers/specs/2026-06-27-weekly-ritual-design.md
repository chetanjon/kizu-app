# kizu — Weekly ritual (group vibe read) · Module 5

**Date:** 2026-06-27
**Status:** shipping incrementally (see implementation note)

> **Implementation note (2026-07-01).** The MVP shipped earlier as a **Vercel Cron**
> (`vercel.json` → `GET /api/cron/weekly-read`, Fri 22:00 UTC) using
> `buildAndStoreVibe`, gated by `MIN_VIBE_DROPS` (≥3), pushing members to `/home`.
> This pass adds the spec's higher-value, no-migration pieces: a **`weekly` tone
> variant** on `generateVibe`, a **dedicated `/read/[id]` page** (membership-gated,
> reusing an extracted shared `vibe-card.tsx`), and the weekly notification now
> opens that page instead of `/home`. **Deferred** (needs a hand-applied Supabase
> migration): `source`/`period_start` columns + partial unique index for true
> idempotency. The pg_cron approach below was superseded by the existing Vercel Cron.

## Goal

Manufacture a recurring **appointment** that fights kizu's #1 risk (low frequency): once a week a group that's had a real week gets an automatic **vibe read** — a short, honest, funny recap of what they dropped — delivered as an in-app + web-push notification that opens a dedicated read page. Builds entirely on existing parts (`generateVibe`, `vibe_reads`, `notify`, the pg_cron pattern); the design work is orchestration + one idempotency guard + a tone variant + a read page.

Out of scope (deliberate later adds, door left open): **email delivery** (fast-follow module — needs Resend + DNS + unsubscribe); an **add-to-queue action layer** on the read's picks; sharing a read outside the group; per-person "whose week it was" callouts.

## Decisions (locked)

- **Cadence:** weekly, Friday ~5pm Mountain Time (weekend-priming, action-leaning). pg_cron runs in UTC, so the job is `0 23 * * 5` (Fri 23:00 UTC = Fri 5pm MDT / 4pm MST). The ±1h DST drift is harmless because of the idempotency guard.
- **Earned gate:** only groups with **≥3 new items in the trailing 7 days** get a read. Quiet groups stay silent — no hollow read, honors "you're all caught up is a feature" and the $0 budget.
- **Tone:** simple, honest, funny — dry and a little knowing, never SaaS hype. A new `variant: "weekly"` on `generateVibe` swaps the prompt; grounded in the real week's drops so it can't bluff. Same `VibeRead` return shape.
- **Delivery:** in-app notification + existing web push, via `notify(..., "weekly_read", ...)` (`weekly_read` is already in `NotifKind` and the `notifications` CHECK). One per member per week.
- **Landing:** a dedicated, membership-gated page **`/read/[id]`** rendering the stored read — same URL for every group member. Reuses the vibe-read card UI (extracted to a shared component).
- **Idempotency:** exactly one weekly read per group per week, enforced at the DB layer (partial unique index), so a double-firing cron physically cannot duplicate.
- **Coexistence:** the existing on-demand "vibe read" button (`/api/vibe`) is unchanged and stored as `source:'manual'`.

## Architecture

### Schema — migration `supabase/migrations/20260628_p5_weekly_ritual.sql`
- `ALTER TABLE public.vibe_reads ADD COLUMN source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','weekly'));`
- `ALTER TABLE public.vibe_reads ADD COLUMN period_start DATE;` (the week's Monday for weekly rows; null for manual)
- `CREATE UNIQUE INDEX vibe_reads_weekly_uniq ON public.vibe_reads (group_id, period_start) WHERE source = 'weekly';`
- Schedule the cron (mirrors `20260503_v1_witness_cron.sql` — pg_cron + pg_net POST with `Authorization: Bearer ' || current_setting('app.cron_secret', true)`):
  ```sql
  select cron.schedule('kizu-weekly-reads', '0 23 * * 5', $$
    select net.http_post(
      url := 'https://kizu.app/api/cron/weekly-reads',
      headers := jsonb_build_object('Authorization','Bearer '||current_setting('app.cron_secret',true),'Content-Type','application/json'),
      body := '{}'::jsonb
    );
  $$);
  ```
- Applied by the user in the Supabase SQL editor. Hand-update `src/lib/database.types.ts` (`vibe_reads` Row/Insert/Update gain `source`, `period_start`).

### Tone variant — `src/lib/vibe.ts`
- Add an optional 4th param: `generateVibe(groupName, members, items, variant: "default" | "weekly" = "default")`.
- When `variant === "weekly"`, use a weekly prompt: short, dry, honest, funny; recap *this week*; no hype, no invented facts; keep the existing `VibeRead` JSON shape (title, body, person_lines, tags, top_picks). Default path untouched.

### Cron route — `src/app/api/cron/weekly-reads/route.ts`  (`runtime = "nodejs"`)
1. **Auth:** `req.headers.get("authorization") === "Bearer " + process.env.CRON_SECRET`, else `401`. (Same check the sunset tick uses.)
2. Compute `weekAgo = now − 7d` and `periodStart = Monday of the current week` (UTC date).
3. **Find qualifying groups:** select `group_id` from `items` where `created_at >= weekAgo`; tally counts in JS; keep `group_id`s with `count >= 3`. (Fine at ~50-friends scale; index `idx_items_group_created` backs the range scan.)
4. **For each qualifying group** (best-effort; wrap each in try/catch so one failure never aborts the loop):
   - Skip if a weekly read already exists for `(group_id, periodStart)`.
   - Load the group name, member `{id,name}` list, and the week's items (the `/api/vibe` select, filtered `created_at >= weekAgo`); map to `VibeItem[]`.
   - `const read = await generateVibe(name, memberNames, vibeItems, "weekly")`.
   - Insert `vibe_reads { group_id, summary: read.body, card_data: read, source: 'weekly', period_start: periodStart }` → returning `id`. On unique-violation (concurrent run) catch and skip.
   - For each member: `notify(admin, member.id, "weekly_read", "good taste ran in the group this week.", \`/read/${id}\`, 168)`.
5. Return `{ ok: true, processed, created }`.

### Read page — `src/app/read/[id]/page.tsx` (server component)
- `getCurrentUser()`; if none → `/login`.
- Admin-fetch the `vibe_reads` row by `id`; if missing → `notFound()`.
- Verify the user is a member of `row.group_id` (`group_members` lookup); if not → `notFound()` (don't leak existence).
- Render `row.card_data` (cast to `VibeRead`) via the shared card component.

### Shared card — `src/components/vibe-card.tsx`
- Extract the presentational card (aurora-framed title/body/person_lines/tags/top_picks) out of `vibe-read.tsx` into `vibe-card.tsx` taking a `VibeRead` prop.
- `vibe-read.tsx` (the on-demand modal) imports and renders it — behavior unchanged. `/read/[id]` renders the same component. No duplicated card markup.

## Edge cases / safeguards
- **Double cron fire / DST overlap:** partial unique index → at most one weekly read per group-week; duplicate insert is caught and skipped.
- **Quiet group (<3 drops):** skipped entirely — no read, no notification.
- **`generateVibe` failure for a group:** caught, logged, skipped; other groups still processed; no half-written notification (insert happens before notify).
- **Push not configured / no subscription:** `notify` still writes the in-app notification; push is best-effort (existing behavior).
- **Notification spam:** `capHours: 168` plus generation idempotency → one `weekly_read` per member per week.
- **Manual vibe reads:** unaffected (`source:'manual'`, `period_start` null → excluded from the partial unique index).
- **Bad/no `CRON_SECRET`:** route returns 401; nothing runs.

## Deploy prerequisites (user actions; I'll guide with exact values)
1. Apply `20260628_p5_weekly_ritual.sql` in the Supabase SQL editor (adds columns + index + schedules the cron). `app.cron_secret` is already set (used by the sunset tick); `CRON_SECRET` already in Vercel + `.env.local`.
2. Confirm `cron.schedule` registered: `select jobname, schedule from cron.job;` shows `kizu-weekly-reads`.
Then push to deploy. No new env vars, no new deps, no new paid service.

## Verification
- `npx tsc --noEmit` + `npm run build` clean.
- **Manual route test:** `curl -X POST http://localhost:3000/api/cron/weekly-reads -H "Authorization: Bearer $CRON_SECRET"` → `{ok:true,...}`; wrong/no token → 401.
- **Earned gate:** a group with <3 drops in the window is skipped; a group with ≥3 gets exactly one `vibe_reads` row with `source='weekly'` and this week's `period_start`.
- **Idempotency:** run the route twice → still one weekly read for that group-week (second run `created:0`).
- **Notification + landing:** each member gets a `weekly_read` notification; tapping opens `/read/<id>` showing the card; a non-member hitting that URL gets `notFound`.
- **Tone:** the weekly read reads simple/honest/funny and references real drops from the week (no invented titles).
- **Manual read unaffected:** the on-demand vibe button still works and stores `source='manual'`.
