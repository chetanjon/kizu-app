# Log Deck — a decision layer on top of your shelf

**Date:** 2026-06-30
**Status:** approved design, ready for implementation plan
**Surface:** the Log tab (`/log`)

---

## Summary

Give the Log tab a swipeable **card deck** on top of the existing month-grouped
shelf. Every card in the deck is *one small decision* drawn from two honest
sources — recs left for you by your people, and things you yourself logged and
loved, dealt back to you. A single compact lens control (`mixed ▾`) governs both
the deck and the shelf below. The shelf itself (your archive) is unchanged except
that its filter chips are replaced by the shared lens.

The deck adopts the visual language of the reference mockup — a stacked card with
peeking neighbors, a type/rating badge, an avatar-quote, an availability pill,
and flick / swipe-up / tap gestures — but applies it to content that earns the
interaction rather than a generic feed.

---

## Why (strategic fit)

- **North-star = recs that landed per active group per week.** Both deck actions
  move it: *save a people-rec* feeds the watchlist; *tell the crew about your own
  loved thing* produces a fresh rec that can land for someone else.
- **#1 risk = low frequency.** Today the Log is a passive archive you rarely
  reopen. A living deck that says "here's what still deserves a decision from
  you" gives a recurring reason to open the tab.
- **The Log's identity ("the investment artifact that visibly grows") is
  preserved** — the archive shelf stays pure and scannable underneath; the deck
  sits *above* it and is clearly a separate, decision-making layer.

This deliberately lets your-people recs appear inside the Log (a departure from
"the Log is only yours"), approved on the condition that **every card is tagged
with its source** so it never reads as an algorithmic feed.

---

## Layout

Three stacked pieces, all driven by one lens control:

```
your log · everything you've logged                 [ mixed ▾ ]
────────────────────────────────────────────────────────────────
▓ THE DECK  — swipeable hero, one decision per card
   (peek)  ┌────────────────────────────┐  (peek)
    SKIP   │  cover art                  │  BROWSE
           │  MOVIE · 84%          ★ 9   │
           │  Past Lives                 │
           │  ⟨M⟩ "thought about it…"     │
           │  ✦ from your people         │   ← source tag (or ↺ from your shelf)
           │  [✓ netflix, you have it] [↗ watch]           │
           └────────────────────────────┘
     ↑ swipe up to save · flick away to skip · tap to open
                        • • • •
────────────────────────────────────────────────────────────────
▓ YOUR SHELF  — the month-grouped list, unchanged, scannable
   june 2026                                          4 entries
   [56×84] Past Lives · film · "your note" · ★9
   [56×84] …
```

---

## The lens control

- A single compact dropdown in the header's top-right: **`mixed ▾`**.
- Options: `mixed · movies · music · outside`, mapping to
  `all · watch · listen · go_out`.
- **Governs both** the deck (which types get dealt) and the shelf list (which
  types show). Picking *movies* deals only `watch` cards **and** filters the
  shelf to `watch`.
- Default = **mixed**.
- **Replaces** `log-list.tsx`'s current inline chip row (`all / movies / music /
  outside`) so there is exactly one filter control on the page.
- Also **replaces** the current "in the mood for… 🎬 watch / 🎧 listen / 🌅
  outside" chips that deep-link to `/tonight` — the Log now does the deciding
  itself, so those links are redundant and are removed.

---

## The deck

A small hand (target ≤ 8 cards) interleaved from two sources so it feels varied.
Deterministic deal order (rotate-from-seed, **no `Math.random`** — keep it
SSR-safe / hydration-stable, matching the existing `dealOrder` in
`tonight-dealer.tsx`). The deal seed bumps on each re-deal.

### Card kind A — ✦ from your people

Un-acted recs: group items dropped by others + published Curate picks, minus
anything already in your watchlist. **This is exactly the `/tonight` pool** —
same query, same `Cand` shape.

- **swipe up** → save to watchlist (`POST /api/queue`, `{item_id}` or
  `{curate_drop_id}`) → card advances.
- **flick away** → skip (local dismiss, advance) → not persisted; reappears on a
  future deal, which is fine.
- **tap** → open the item (same target the feed card tap uses).

### Card kind B — ↺ from your shelf

Things *you* logged and rated positively (the same positive-rating set used by
`social-proof`'s `fetchPositiveVerdicts`), dealt back to you.

- **swipe up**, resolved per card:
  - card is a **private** log → **tell the crew**: share it (flip
    `items.private` → false), which enters the group feed and pushes to the
    group exactly like a normal drop. *This is the north-star action.*
  - card is **already shared** → **save to revisit**: add your own item to your
    watchlist so it surfaces as a "revisit" to-do.
- **flick away** → not now (local dismiss, advance).
- **tap** → open the item.

Each card renders its source tag (`✦ from your people` / `↺ from your shelf`) so
the origin is always explicit.

### Card face

Reuses `item-render` (`img`, `title`, `typeWord`, `detail`, `ratingMark`,
`TYPE`, `SHADOW`) and `item-actions` / availability exactly as `tonight-dealer`
does today:

- Cover art fills the card; scrim caption over the bottom.
- **Type/rating badge:** the type word (`MOVIE`) and the dropper's rating (`★9`).
  A **match %** is shown *only if a real per-item affinity score is available*;
  if we have no honest score, the % is omitted (no fabricated numbers — spine
  rule: no fake data).
- **Avatar-quote:** the dropper's initial + their note/`their_words`, when
  present.
- **Availability / act pill:** `current.availability` else the first non-`set`
  action from `actionsFor(...)` — "✓ netflix, you have it" / "↗ watch" / maps /
  open-in-app, same logic as `tonight-dealer`.
- **Social proof:** `♥ {proof}` line for people-cards when present.

### Gestures (hand-rolled, no new dependency)

Pointer events on the top card only:

- **Drag up** past a vertical threshold → primary action (save / share) with a
  throw-up animation; the "↑ swipe up to save" hint sits above the deck.
- **Drag sideways** past a horizontal threshold → skip (throw-away animation),
  advancing to the next card. Left and right are treated the same (both = skip);
  the `SKIP` / `BROWSE` peek labels are **decorative depth only** — we adopt the
  mockup's stacked look without building distinct left-vs-right semantics (a
  deliberate scope cut; can revisit).
- **Tap** (movement under a small threshold) → open the item.
- **Peeking neighbors:** the next (and previous) card render behind/beside the
  top card at reduced scale + offset to create the deck depth. Pagination dots
  show position in the hand.

### Empty / end states

- **No deck cards** (nothing to revisit *and* no un-acted recs, given the lens) →
  hide the deck entirely; show the shelf alone. If the whole lens is empty of
  recs, a slim on-brand line ("you're all caught up") may sit where the deck was.
- **Deck exhausted mid-session** → "that's the hand — deal again", reusing the
  existing exhausted-state pattern from `tonight-dealer`.
- **No log rows at all** → existing Log empty state is unchanged.

---

## Data sourcing

Server-side in `log/page.tsx`:

1. **Full shelf** — unchanged: all of `created_by = user` items, newest first,
   photos signed → `LogRow[]`.
2. **Deck pool**, assembled into `Cand[]`:
   - *People recs* — reuse the `/tonight` server logic verbatim: group items by
     others (`private = false`, minus your queue) + published Curate drops (minus
     your queue), with `signPhotos`, `fetchPositiveVerdicts` → `proofLine`, and
     `availabilityMap` from your `services`.
   - *Your loved shelf* — your own items whose `rating_value` is in the positive
     set, mapped to `Cand` with a `mine: true` / source flag and their current
     `private` status (so the client knows share-vs-revisit).
3. Interleave and cap to the hand size on the client (which owns the lens + deal
   state).

Because the people-rec query already lives in `tonight/page.tsx`, extract it into
a small shared helper (e.g. `src/lib/tonight-pool.ts`) that both `/tonight` and
`/log` call, rather than duplicating the query. This is a targeted improvement in
service of the current work, not unrelated refactoring.

---

## Components & files

**New**
- `src/lib/tonight-pool.ts` — extracted people-rec pool builder (shared by
  `/tonight` and `/log`).
- `src/components/log-deck.tsx` — client; the swipeable stacked deck (gestures,
  peek, card face, actions). Self-contained; reuses `item-render` + `item-actions`
  helpers. Kept separate from `tonight-dealer.tsx` for now (low-abstraction house
  style); unifying the two decks later is explicitly out of scope.
- `src/components/log-client.tsx` — client wrapper owning the shared **lens**
  state; renders the `mixed ▾` dropdown, `<LogDeck>`, and `<LogList>` and passes
  the lens down to both.

**Changed**
- `src/app/(app)/log/page.tsx` — also build the deck `Cand[]`; render
  `<LogClient>` instead of the inline chips + `<LogList>`; drop the "in the mood
  for" chip block.
- `src/components/log-list.tsx` — accept a `filter` prop from the parent; remove
  its internal chip UI + `useState`.
- `src/app/(app)/tonight/page.tsx` — call the extracted `tonight-pool.ts` helper
  (no behavior change).

**New API**
- `PATCH /api/items` (or `/api/items/share`) — flip an own item's `private` →
  false. Authorize by `created_by === user` via `getUser`, write via
  `createAdminClient`. **Must reuse the existing drop→group-push path** so a
  shared-from-log item pings the group like any other drop. No new notification
  system.

---

## Out of scope (YAGNI)

- Distinct left-vs-right swipe semantics (both = skip for now).
- A machine-learned per-item match %; we show a % only when an honest score
  already exists, else omit it.
- Unifying `log-deck.tsx` and `tonight-dealer.tsx` into one component.
- Persisting "skip" dismissals server-side.
- Comments / reactions on deck cards (reactions remain the feed's job).

---

## Testing

- Manual on a preview deploy (gestures need real pointer/touch testing on a
  phone viewport).
- Verify: lens governs both deck and shelf; source tags correct; swipe-up on a
  private shelf card shares it (appears in feed, group push fires); swipe-up on a
  people card queues it and it leaves the deck; skip advances without persisting;
  empty/exhausted states; no fabricated match %.
- Confirm `/tonight` behaves identically after the pool extraction.
