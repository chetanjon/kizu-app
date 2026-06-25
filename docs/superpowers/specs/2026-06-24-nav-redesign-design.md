# kizu — navigation redesign (sticky top bar, custom glyphs)

**Date:** 2026-06-24
**Status:** approved design, pre-implementation

## Problem

The shipped nav (`src/components/bottom-nav.tsx`) is a generic bottom tab bar — thin outline icons, a center FAB — and reads like "a regular web app." Goal: make navigation unmistakably **kizu** (neo-brutalist, pop-color, tactile), keep it user-friendly, and give the icons/labels identity.

## Decisions (locked with the user)

1. **Placement:** a single **sticky top bar**, responsive — same bar on phone and desktop. (User chose top over bottom explicitly; accepted the one-handed-reach tradeoff. Sticky so it's always present.)
2. **Personality (motion):** the **sliding-tile** model — one violet tile slides to the active destination; the active slot's icon+label go **white**; tap gives a small press (translate/scale) feedback.
3. **Color discipline:** violet (`--color-vibe`) is used **only** for the sliding tile and the `drop` button. RED stays reserved for the `kizu.` dot. Everything else is ink/muted.
4. **Five destinations** (unchanged routes): `home` · `pick` (route stays `/tonight`) · `＋drop` · `queue` · `you`.
5. **Custom glyph set** (filled, chunky, on-brand — not library outlines):
   - **home** → offset stack of cards (the pile of drops; offset echoes the brand shadow)
   - **pick** → dealt cards (nods to the "tonight dealer" deal-me-something mechanic) — relabeled from "tonight" to the plainer **pick**
   - **drop** → `+` inside the one raised violet circle (the core action)
   - **queue** → stacked bars (the list / spine)
   - **you** → a **standing human figure**, gendered (see §Identity)
6. **Drop** is an action, not a destination: it's the always-violet raised button; the sliding tile does not sit under it.

## Identity (the `you` figure)

User chose: **ask male/female at signup and swap the figure** (man / woman standing pose). Implemented with flexibility preserved:

- New nullable column **`users.gender`** (`text`; values `'male' | 'female'`; `null` = not answered).
- Figure mapping: `male → masc figure`, `female → femme figure`, `null → neutral figure` (default until answered).
- **Asked via a one-time in-app prompt** (mirrors the existing `NameSetter` pattern) shown on Home when `gender IS NULL` — *not* a hard signup gate, so no one is blocked.
- **Changeable later** in the `you` tab (a small control), so it's reversible — honors `[[feedback_flexibility]]`.
- Figures are **armless, chunky filled silhouettes** so they stay legible at ~24px.

> Note (recorded, not re-litigated): a forced binary excludes non-binary users and is over-asking for a cosmetic icon. The neutral default + reversible pref are the mitigations the user accepted.

## Architecture / components

### New
- **`src/components/app-nav.tsx`** (client). Sticky top bar. Props: `{ name, gender }` (for the you-figure) — auth/group data already handled by the layout. Uses `usePathname()` to compute the active index and position the tile via inline `left`/`width` + a CSS `transition` on `left`. Contains:
  - desktop: `kizu.` wordmark (links `/home`) on the left, the 5-slot nav centered, the notifications bell on the right.
  - phone: the 5 slots edge-to-edge (wordmark/bell collapse out; bell moves into the bar's right or stays a slot — see open item).
  - The 5 glyphs as inline SVGs (kept local to this component; small enough not to warrant a separate file).
- **`src/components/gender-setter.tsx`** (client). One-time male/female prompt → `PATCH /api/profile { gender }` → `router.refresh()`. Same visual language as `NameSetter`.

### Changed
- **`src/app/(app)/layout.tsx`** — render `<AppNav .../>` at the top instead of `<BottomNav/>`; change content padding from `pb-24` (bottom bar) to top spacing under the sticky bar. Fetch the profile (`name`, `gender`) to pass to AppNav — add a request-memoized **`getProfile(userId)`** to `src/lib/auth.ts` (one row, cached like the others).
- **`src/app/(app)/home/page.tsx`** — remove the per-page brand header + notifications bell (now global in the top bar); keep the **group pill** in the page content (top of `<main>`). Render `<GenderSetter/>` next to `<NameSetter/>` when the respective field is null.
- **`src/app/api/profile/route.ts`** — extend `PATCH` to accept `gender` (`'male' | 'female'`), validated; write via the existing admin-write pattern.
- **`src/lib/database.types.ts`** — add `gender` to `users` row types.
- **Delete `src/components/bottom-nav.tsx`** once AppNav replaces it.

### Migration
- `supabase/migrations/20260624_user_gender.sql`: `ALTER TABLE public.users ADD COLUMN gender text;` (nullable; optional `CHECK (gender IN ('male','female'))`). Applied by the user in the Supabase SQL editor (project `undcbbwiytfzquriwwqx`). Safe/non-destructive (additive nullable column).

## Layout / sizing
- 5 equal slots (flex `1`), each: a fixed **34px icon box** (so all icons baseline-align and the `drop` circle fits) + a `font-m` ~9.5px label. Sliding tile height ~46px, width = one slot minus inset, `left` = activeIndex × 20% + inset.
- Sticky: `sticky top-0 z-40`, ink bottom border `2.5px`, `bg-surface`. Content below gets top padding so nothing hides under it.

## Motion details
- Tile: CSS `transition: left .22s ease`. On `/drop`, tile hidden (drop button is its own highlight).
- Press: active/`:active` `scale(.94)` on the tapped slot.
- Respect `prefers-reduced-motion`: disable the slide transition (snap instead).

## Open items (decide during build, low-risk)
- Phone: does the notifications **bell** live inside the bar (6th element) or move to a small floating button / into `you`? Leaning: keep the 5 slots clean on phone and place the bell as a small top-right element in the bar header row above the slots, OR fold notifications into the `you` tab on phone. Default: small bell top-right, slots below.
- Exact top-padding value once the bar height is final.

## Out of scope
- No change to routes, data, queue/curate/notify logic, or the `/tonight` page internals (only its nav label changes to "pick").
- No deploy without explicit user approval.

## Verification
- `npm run build` clean.
- Local dev: tile slides to the active tab on every route; active slot white; `drop` button prominent; figure matches `gender` (neutral when null); one-time gender prompt appears once then not again; bell still opens.
- Responsive: check phone width (~390px) and desktop (~1200px).
