# Multi-recipient drops + anonymous "for you" targeting

**Date:** 2026-06-28
**Status:** Approved design, ready for implementation plan
**Touches:** Phase 3 (rec-as-invite) surfaces — composer, `/api/items`, `lib/recs`, home feed, one small migration

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
2. **The targeted gesture has no honest representation in the feed.** It should read as
   a quiet, *anonymous* gift — not as an attributed group post.

## The anonymity rule (the spine of this design)

- **Group-wide drop** ("everyone") → public and **attributed**: the author's name shows
  to the whole group, as today.
- **Targeted drop** ("specific people") → **anonymous to every viewer**. The author's
  name appears nowhere in the feed for that drop. Specifically:
  - The **recipient** sees `✦ someone left this for you`.
  - A **non-recipient bystander** sees `someone dropped this ✦`.
  - The **author** (viewing their own drop) sees `✦ you left this for someone` — so they
    can tell their quiet drops apart from their public ones.
  - The author's **name** is shown to **no one**. Anonymity is real, by construction.

This corrects an earlier "soft" idea (hide the name from the recipient but still show it
to bystanders), which was anonymity *backwards* — it exposed the author to everyone
except the person it was for, and any bystander could leak it. Rejected.

## Goals

- Let a user drop one thing *for multiple specific people* in a single action.
- Make targeted drops genuinely anonymous to all viewers per the rule above.
- Give the recipient a warm, private signal that this was left *for them*.
- Keep the change minimal: one additive column, no rewrite of the rec model.

## Non-goals (deliberately excluded)

- **No recipient names or counts shown to anyone.** Not to bystanders, not to other
  recipients. A recipient never learns who else got it.
- **No change to the shareable `/r/<token>` link flow.** A link drop stays a normal,
  attributed group drop (it is NOT anonymous); the `/r/<token>` page still shows the
  sender's name. Out of scope and intentionally different from targeted drops.
- No "reveal who dropped it" affordance. Anonymous means anonymous.

---

## The model

A "drop" is an `items` row. Targeting a person is a separate `recs` row
(`item_id`, `from_user`, single `to_user`). `createRec()` already does the full
per-recipient job: insert the rec, drop the item into that person's `queue_items`
(`source='rec'`), and send the cryptic ping. **Multi-recipient = call `createRec()`
once per recipient for the same item.** One item, N recs.

### Why a new `items.anon` column (one small migration)

The feed must decide, per drop, "is this anonymous?" The tempting shortcut — "anonymous
iff a `recs` row points it at a person" — **collides with the shareable-link flow**:
`/api/recs/claim` sets `recs.to_user` to the claimer when a link is claimed, so a claimed
link drop would be wrongly treated as anonymous. Deriving anonymity from `recs` is fragile.

Instead, add an explicit boolean **`items.anon`** (default `false`), set to `true` at
creation time when (and only when) the drop is created with personal recipients. The feed
checks `it.anon` — unambiguous, link-flow-proof, and a clean switch if display rules ever
change. Additive with a `false` default, so every existing row and query is unaffected.

`recs` RLS already permits a recipient to read their own recs
(`recs_select_mine`: `to_user = auth.uid()`), so the feed can compute "is this one mine"
with the normal user-scoped client. No RLS change.

---

## Design

### 1. Migration — `items.anon`

```sql
ALTER TABLE public.items
  ADD COLUMN anon BOOLEAN NOT NULL DEFAULT false;
```

Hand-update `src/lib/database.types.ts` to add `anon: boolean` to the `items` Row /
Insert (optional) / Update (optional) shapes, per the project convention of keeping types
in sync with the schema.

### 2. Composer — multi-select recipients

`drop-composer.tsx`, the "drop it for… (optional)" block (currently lines 292–301).

Replace the single `recTo` string with an explicit mode plus a set:

- `mode: "everyone" | "people" | "link"` (default `"everyone"`)
- `recipients: Set<string>` — selected member ids; only meaningful when `mode === "people"`

Picker behavior:

- **everyone** chip → `mode = "everyone"`, clear `recipients`. (group-wide, attributed)
- **member** chip → `mode = "people"`, toggle that id in `recipients` (tap again to remove).
  Multiple members can be lit at once. If the last one is removed, fall back to `mode = "everyone"`.
- **✦ anyone (link)** chip → `mode = "link"`, clear `recipients`. (shareable link, unchanged)

A member chip is "lit" (`bg-vibe text-white`) when in `recipients`. Reuse the existing chip
styling exactly — no new visual language.

Drop button label:

- `everyone` → "drop it to the group"
- `link` → "drop + make a link"
- `people`, 1 selected → "send it to {name}" (lowercased)
- `people`, N>1 selected → "send it to {N} people"

Submission posts `rec_to` as an array: `[...recipients]` for `people`, else `[]`. The
`link` branch keeps the existing post-create `/api/recs` call.

### 3. API — `/api/items` sets `anon` + fans out to N recipients

`src/app/api/items/route.ts`, the rec block (currently lines 57–70).

Compute the recipient list **before** inserting the item, so the insert can set `anon`:

```
const recTo: string[] = Array.isArray(b.rec_to)
  ? b.rec_to.map((x: unknown) => String(x))
  : b.rec_to ? [String(b.rec_to)] : [];
const targets = [...new Set(recTo)].filter((id) => id && id !== user.id);
```

Insert the item with `anon: targets.length > 0`. Then for each `id` in `targets` that is a
group member, call `createRec(admin, user.id, item.id, id)`. De-dupe (done), skip self
(done), skip non-members (`continue`). Stays tolerant of the legacy single-string `rec_to`
shape so an in-flight old client mid-deploy still works.

`createRec` and `lib/recs.ts` need **no change** — already per-recipient, already sends the
sender-anonymous ping.

### 4. Feed — anon-aware, per-viewer render

`src/app/(app)/home/page.tsx`.

- Add `anon` to the `items` select (and the local `Item` type).
- After the existing `queued` Set, add a user-scoped `recs` read for "left for me":

```
const { data: recRaw } = await supabase
  .from("recs")
  .select("item_id")
  .eq("to_user", user.id)
  .in("item_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
const forMe = new Set((recRaw ?? []).map((r) => r.item_id as string));
```

Per card, compute `const forYou = forMe.has(it.id);` alongside the existing
`const mine = it.created_by === user.id;`, then render the author line three ways:

- `forYou` → `✦ someone left this for you` (tinted `text-vibe` — the earned moment)
- else `it.anon` → `mine` ? `✦ you left this for someone` : `someone dropped this ✦` (muted)
- else → the real author name (`text-muted`), exactly as today

Name is shown to no one on an `anon` drop. The `mine ? DeleteDrop : QueueButton` control to
the right is unchanged (a recipient's targeted drop is already in their queue, so its
QueueButton reads as queued; a bystander can still queue an anonymous drop for themselves).

---

## Why this stays flexible

The anonymity decision is one explicit boolean on the drop; everything else is render-layer
(which string each viewer sees) plus a per-recipient loop. The recipient list remains just
`recs` rows. Loosening to named targeting, or tightening further, is a change to what the
feed *reads and renders* against `it.anon` — never a data migration. Using an explicit flag
rather than deriving from `recs` is precisely what keeps the link-claim flow from silently
changing a drop's visibility later.

## Edge cases

- **Drop for nobody specific** (`everyone`) → `anon=false`, no recs, attributed feed. As today.
- **Sender in their own recipient set** → skipped (`id !== user.id`).
- **Duplicate ids** → de-duped before insert and loop.
- **A selected id not actually in the group** → membership check skips the rec; `anon` still
  reflects author intent. (The composer only lists real members, so this is defensive.)
- **Old client posts a single `rec_to` string mid-deploy** → normalized to a one-element
  array; `anon` set when non-empty.
- **Shareable link drop, then claimed** → `anon=false` (it was never a targeted drop), so the
  later `recs.to_user` set by claim does NOT anonymize it. This is the exact collision the
  `anon` column exists to prevent.
- **Recipient deletes / already-queued** → `createRec`'s queue insert is idempotent (unchanged).

## Verification

- Drop a song for two members; confirm `items.anon=true`, two `recs` rows, two `queue_items`,
  two pings.
- Recipient's `/home`: that card reads `✦ someone left this for you` (violet), no name.
- A non-recipient member: same card reads `someone dropped this ✦`, no name.
- The author: same card reads `✦ you left this for someone`, no name, with the delete control.
- A group-wide ("everyone") drop: `anon=false`, shows the author's real name to everyone.
- Create a shareable link drop, claim it as a new user: it stays attributed (`anon=false`) —
  NOT anonymized — in the group feed.
- Typecheck + lint clean; `items`↔`users` embed still uses the `!items_created_by_fkey` hint.
