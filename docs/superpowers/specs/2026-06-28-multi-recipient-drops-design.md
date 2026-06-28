# Multi-recipient drops + private "for you" signal

**Date:** 2026-06-28
**Status:** Approved design, ready for implementation plan
**Touches:** Phase 3 (rec-as-invite) surfaces — composer, `/api/items`, `lib/recs`, home feed

---

## Problem

Today a drop can be sent *for* exactly one person. The composer (`drop-composer.tsx`)
lets you pick a single recipient (`recTo` is one member id, `""` for everyone, or
`"__link__"` for a shareable link). And when a drop *is* targeted at you, nothing in
the feed reflects it — the targeting lives only in your queue + a private "someone
left something for you" ping.

Two gaps:

1. **You can only drop for one person at a time.** A song you want three friends to
   hear takes three separate drops.
2. **The targeted-for-you gesture is invisible in the feed.** The recipient sees the
   drop in the group feed indistinguishable from any other.

## Goals

- Let a user drop one thing *for multiple specific people* in a single action.
- Give the recipient a warm, private signal in the feed that this was left *for them*.
- Keep the sender **anonymous to the recipient** ("someone left this for you"), preserving
  the small mystery — consistent with the existing notification copy.
- Change nothing about the data model. No migration.

## Non-goals (deliberately excluded)

- **No recipient names shown to the group.** Non-recipients see an ordinary drop.
  Decided last: targeting is never broadcast.
- **No hard anonymity.** This is *soft* anonymity (see below) — the sender's name is
  hidden from the **recipient's** card, but normal authorship still shows in the shared
  group feed to bystanders. We are not anonymizing the author group-wide.
- No changes to the shareable `/r/<token>` link flow (still single open rec; that page
  still shows the sender's name — out of scope and intentionally different).
- No "who else got this" disclosure. A recipient never learns the other recipients.

---

## The model (already supports this)

A "drop" is an `items` row. Targeting a person is a separate `recs` row
(`item_id`, `from_user`, single `to_user`). `createRec()` already does the full per-recipient
job: insert the rec, drop the item into that person's `queue_items` (`source='rec'`),
and send the cryptic ping. **Multi-recipient = call `createRec()` once per recipient
for the same item.** One item, N recs. No schema change, no migration.

`recs` RLS already permits a recipient to read their own recs
(`recs_select_mine`: `to_user = auth.uid()`), so the feed can detect "is this mine"
with the normal user-scoped client. No policy change.

---

## Design

### 1. Composer — multi-select recipients

`drop-composer.tsx`, the "drop it for… (optional)" block (currently lines 292–301).

Replace the single `recTo` string with an explicit mode plus a set:

- `mode: "everyone" | "people" | "link"` (default `"everyone"`)
- `recipients: Set<string>` — selected member ids; only meaningful when `mode === "people"`

Picker behavior:

- **everyone** chip → `mode = "everyone"`, clear `recipients`. (group-wide, no recs)
- **member** chip → `mode = "people"`, toggle that id in `recipients` (tap again to remove).
  Multiple members can be lit at once. If the last one is removed, fall back to `mode = "everyone"`.
- **✦ anyone (link)** chip → `mode = "link"`, clear `recipients`. (shareable link, unchanged)

A member chip is "lit" (`bg-vibe text-white`) when in `recipients`; "everyone" and "link"
stay mutually exclusive with people-select. Reuse the existing chip styling exactly —
no new visual language.

Drop button label (`drop()` / the button at line 314–318):

- `everyone` → "drop it to the group"
- `link` → "drop + make a link"
- `people`, 1 selected → "send it to {name}" (lowercased, as today)
- `people`, N>1 selected → "send it to {N} people"

Submission (`drop()`):

- `everyone` → `rec_to: []`
- `people` → `rec_to: [...recipients]`
- `link` → `rec_to: []`, then the existing post-create `/api/recs` call for the open link

### 2. API — `/api/items` accepts an array

`src/app/api/items/route.ts`, the rec block (currently lines 57–68).

Accept `rec_to` as **an array of user ids**, while staying tolerant of the old single
string (so an in-flight client during deploy doesn't break):

```
const recTo: string[] = Array.isArray(b.rec_to)
  ? b.rec_to.map(String)
  : b.rec_to ? [String(b.rec_to)] : [];
```

Then, for each distinct id that isn't the sender:
- verify they're a member of `group_id` (same `group_members` check as today),
- call `createRec(admin, user.id, item.id, id)`.

De-dupe ids first. Membership-fail or self silently skips that id (don't fail the whole
drop). `recUrl` in the response becomes irrelevant for the multi-member path (the composer
doesn't use it there) — keep returning `{ id, recUrl: null }` for that case; the
`/r/<token>` link path is unaffected.

`createRec` and `lib/recs.ts` need **no change** — it's already per-recipient and already
sends the sender-anonymous ping.

### 3. Feed — detect "for me" and render the private signal

`src/app/(app)/home/page.tsx`.

After the items query and the existing `queue_items` lookup (around line 67–73), add a
sibling query against `recs` scoped to the current user:

```
const { data: recRaw } = await supabase
  .from("recs")
  .select("item_id")
  .eq("to_user", user.id)
  .in("item_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
const forMe = new Set((recRaw ?? []).map((r) => r.item_id));
```

(Uses the user-scoped `supabase` client; `recs_select_mine` RLS returns only the
recipient's own rows. Mirrors the existing `queued` Set pattern exactly.)

### 4. Card render — soft-anonymous "left for you"

`home/page.tsx`, the author line (currently line 125):

```
<span className="font-m text-[11px] text-muted">{(it.users?.name || "someone").toLowerCase()}</span>
```

When `forMe.has(it.id)`, replace the author name with the anonymous targeted signal
instead of the real name:

- **Recipient's view:** `✦ someone left this for you` (sender name hidden)
- **Everyone else's view:** unchanged — the real author name, as today.

Copy: `someone left this for you` — matches the notification line and the kizu voice
(cryptic, lowercase, one earned line). The `✦` sparkle is already the app's "special"
mark (link chip, curate threshold), so it reads as on-brand. Keep it in the same
`font-m text-[11px]` slot; optionally tint it `text-vibe` to make the moment land — a
render-only choice, tunable during build.

A recipient sees "left for you" whether they were the sole target or one of several; the
other recipients are never named or counted. The sender, who is excluded from their own
recs, sees their own drop normally (name + delete control).

---

## Why this stays flexible

Everything above is **render-layer + a loop**. The recipient list is, and remains, just
`recs` rows — the existing source of truth. If we later want to tighten to *hard*
anonymity (hide the author group-wide) or loosen to *named* targeting (show "for Alex &
Sam" to the group), it's a change to what the feed *reads and renders*, never a data
migration. The soft-anonymity "leak" (a bystander sees the real author while the recipient
sees "someone") is an accepted, documented trade-off, not an oversight.

## Edge cases

- **Drop for nobody specific** (`everyone`) → no recs, feed unchanged. As today.
- **Sender in their own recipient set** → skipped server-side (`id !== user.id`), as the
  current single-recipient code already does.
- **Duplicate ids in the array** → de-duped before the loop.
- **A selected member who isn't actually in the group** → membership check skips them; the
  rest still go through.
- **Old client posts a single `rec_to` string mid-deploy** → normalized to a one-element
  array; behaves exactly as before.
- **Recipient deletes / already-queued** → `createRec`'s queue insert is idempotent
  (unchanged behavior).

## Verification

- Drop a song for two members; confirm two `recs` rows + two `queue_items` + two pings.
- Each recipient's home feed shows `✦ someone left this for you` on that card; the sender's
  name does **not** appear on it for them.
- A third, non-recipient member sees the same drop with the **real author name** and no
  "for you" marker.
- "drop it to the group" (everyone) still creates zero recs and shows normal authorship.
- The `/r/<token>` shareable-link path is unchanged end to end.
- Typecheck + lint clean (`items` ↔ `users` embed still uses the `!items_created_by_fkey`
  hint; no new ambiguous embeds introduced).
