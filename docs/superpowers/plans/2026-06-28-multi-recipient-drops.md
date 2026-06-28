# Multi-recipient Drops + Anonymous "for you" Targeting — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user drop one thing *for multiple specific people* in a single action, where a targeted drop is genuinely anonymous to every viewer — recipients see "✦ someone left this for you," bystanders see "someone dropped this ✦," the author sees "✦ you left this for someone," and the author's name appears nowhere on it. Group-wide drops stay public and attributed.

**Architecture:** A drop is one `items` row; targeting a person is one `recs` row, and `createRec()` already does the full per-recipient job (insert rec, enqueue, ping). Multi-recipient = loop `createRec()` per recipient for the same item. Anonymity is carried by one new explicit boolean, `items.anon`, set at creation — NOT derived from `recs` (which would collide with the shareable-link claim flow). The feed reads the current user's own `recs` (allowed by existing `recs_select_mine` RLS) to mark which cards were left for them, and renders each card per-viewer against `it.anon`.

**Tech Stack:** Next.js 16 (App Router) + TypeScript, Supabase (service-role admin writes, user-scoped reads, SQL migrations), Tailwind v4. React client component for the composer; server component for the feed.

**Spec:** `docs/superpowers/specs/2026-06-28-multi-recipient-drops-design.md`

## Global Constraints

- **One small additive migration only:** `items.anon BOOLEAN NOT NULL DEFAULT false`. Do not alter `recs`, `queue_items`, or any RLS policy. kizu.app is LIVE — applying the migration to the production DB is a **production change that requires the user's explicit go-ahead** (Task 1, Step 2). Code that selects `anon` must not ship before the column exists.
- **No new npm dependencies.** Budget is $0; ask before adding any.
- **No test framework exists** (`package.json` has only `dev`/`build`/`start`/`lint`). Do NOT introduce one. Per-task verification = `npx tsc --noEmit` must be **clean (zero errors)**, AND `npm run lint` must introduce **no NEW errors**. NOTE: the repo has ~14 PRE-EXISTING lint errors at baseline (mostly `@typescript-eslint/no-explicit-any` and react entity-escape, including some already in `drop-composer.tsx`). The gate is the error count not increasing and no new error on lines you changed — NOT a globally clean lint. Plus the explicit manual/SQL check in that task.
- **Anonymity rule (the spine):** group-wide drop = attributed (author name shown to all). Targeted drop = anonymous to ALL viewers; the author's name is shown to no one. Never show recipient names or counts to anyone, and never disclose co-recipients to a recipient.
- **Backward-compatible API.** `/api/items` must accept the new `rec_to` array AND tolerate the legacy single-string shape.
- **Card copy (exact, lowercase, matches kizu voice):** recipient `✦ someone left this for you`; bystander `someone dropped this ✦`; author of their own anon drop `✦ you left this for someone`. The recipient line is tinted `text-vibe`; the other two are `text-muted`.
- **Brand tokens only** (`bg-vibe`, `text-vibe`, `text-muted`, `border-ink`, `font-m`, etc.) — no raw hexes. RED is reserved; do not use it here.
- **Embed hint:** the feed's `items`↔`users` join must keep the `users!items_created_by_fkey(name)` disambiguation (ambiguous otherwise → `PGRST201`, silent 0 rows).

---

### Task 1: Migration — add `items.anon` + sync types

**Files:**
- Create: `supabase/migrations/20260628_drop_anon.sql`
- Modify: `src/lib/database.types.ts:144-176` (the `items` Row/Insert/Update blocks)

**Interfaces:**
- Produces: an `anon` boolean column on `items` (default `false`), and a matching `anon: boolean` (Row) / `anon?: boolean` (Insert, Update) in the generated types. Task 2 sets it on insert; Task 3 reads it.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260628_drop_anon.sql`:

```sql
-- Kizu — anonymous targeted drops.
-- A drop made FOR specific people is anonymous to every viewer (no author name
-- shown). Carry that as an explicit flag set at creation — NOT derived from recs,
-- because the shareable-link claim flow (/api/recs/claim) also sets recs.to_user
-- and would otherwise wrongly anonymize a claimed link drop.
ALTER TABLE public.items
  ADD COLUMN anon BOOLEAN NOT NULL DEFAULT false;

-- Verify:
--   SELECT column_name, data_type, column_default
--     FROM information_schema.columns
--    WHERE table_schema='public' AND table_name='items' AND column_name='anon';
```

- [ ] **Step 2: Apply the migration to the database — REQUIRES USER GO-AHEAD**

kizu.app is live. **Pause and get the user's explicit confirmation before applying.**
Apply via the project's normal path (Supabase MCP `apply_migration`, the Supabase SQL
editor, or `supabase db push` if a local CLI link exists). Then run the verify query from
Step 1 and confirm one row comes back: `anon | boolean | false`.

- [ ] **Step 3: Hand-update the generated types**

In `src/lib/database.types.ts`, add `anon` alphabetically-first to each `items` block.

Row (after line 144 `Row: {`), add as the first field:

```ts
          anon: boolean
```

Insert (after `Insert: {`), add as the first field:

```ts
          anon?: boolean
```

Update (after `Update: {`), add as the first field:

```ts
          anon?: boolean
```

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260628_drop_anon.sql src/lib/database.types.ts
git commit -m "feat(db): add items.anon flag for anonymous targeted drops"
```

---

### Task 2: API — set `anon` + fan out to N recipients

**Files:**
- Modify: `src/app/api/items/route.ts` (parse recipients above the insert; set `anon` on insert; loop `createRec`; skip ALL rec recipients from the group push)

**Interfaces:**
- Consumes: existing `createRec(admin, fromUser, itemId, toUser)` → `{ token, recId } | null`; existing `sendPushToUser`; the `items.anon` column from Task 1.
- Produces: `POST /api/items` reads `body.rec_to` as `string[]` (or legacy single string), inserts the item with `anon = (targets.length > 0)`, creates one rec per valid member target, and excludes every actual rec recipient (plus the dropper) from the group "someone dropped something." push. Response shape unchanged: `{ id: string, recUrl: string | null }`.

> **Context — this file changed on `main` since the spec was drafted.** After the rec
> block, `/api/items` now fans out a cryptic, push-only `"someone dropped something."`
> notification to the rest of the group (lines 71–95), using a `skip` set seeded with the
> dropper and the single rec recipient. The push title is already anonymous (no sender
> name) — keep it. Your job is to (a) make recipients an array, (b) set `anon`, and
> (c) make the `skip` set exclude **all** rec recipients, not just one. **Do not delete or
> alter the push fan-out otherwise.**

- [ ] **Step 1: Parse recipients BEFORE the insert and set `anon`**

In `src/app/api/items/route.ts`, immediately above the
`const { data: item, error } = await admin.from("items").insert({...})` call (line 43), add:

```ts
  // recipients of a targeted (anonymous) drop. Array now; tolerate the legacy
  // single-string shape so an in-flight old client mid-deploy still works.
  const recTo: string[] = Array.isArray(b.rec_to)
    ? b.rec_to.map((x: unknown) => String(x))
    : b.rec_to ? [String(b.rec_to)] : [];
  const targets = [...new Set(recTo)].filter((id) => id && id !== user.id);
```

Then add `anon` to the insert object (currently `group_id, created_by, type, rating_value, rating_style, note, data`) — e.g. directly after `data,`:

```ts
      anon: targets.length > 0,
```

- [ ] **Step 2: Replace the single-recipient rec block with the fan-out loop**

Replace exactly the rec block (lines 58–69) — and ONLY this block; leave the push fan-out
below it intact:

```ts
  // optional: drop this FOR a specific group member (rec-as-invite).
  let recUrl: string | null = null;
  const rec_to = b.rec_to ? String(b.rec_to) : null;
  if (rec_to && rec_to !== user.id) {
    const { data: rmem } = await admin
      .from("group_members").select("group_id")
      .eq("group_id", group_id).eq("user_id", rec_to).maybeSingle();
    if (rmem) {
      const rec = await createRec(admin, user.id, item.id, rec_to);
      if (rec) recUrl = `/r/${rec.token}`;
    }
  }
```

with (collect the ids that actually got a rec, for the skip set in Step 3):

```ts
  // one rec per valid member target. Each gets its own queue row + cryptic ping
  // (createRec handles all three). Non-members skip silently. Remember who was
  // recced so they're left out of the generic group push below.
  let recUrl: string | null = null;
  const recced: string[] = [];
  for (const id of targets) {
    const { data: rmem } = await admin
      .from("group_members").select("group_id")
      .eq("group_id", group_id).eq("user_id", id).maybeSingle();
    if (!rmem) continue;
    const rec = await createRec(admin, user.id, item.id, id);
    if (rec) {
      recced.push(id);
      if (!recUrl) recUrl = `/r/${rec.token}`;
    }
  }
```

- [ ] **Step 3: Skip every rec recipient from the group push**

In the push fan-out, replace the two-line `skip` seed (lines 75–76):

```ts
  const skip = new Set<string>([user.id]);
  if (recUrl && rec_to) skip.add(rec_to);
```

with:

```ts
  const skip = new Set<string>([user.id, ...recced]);
```

Leave the rest of the fan-out (members query, mute filter, `sendPushToUser` with title
`"someone dropped something."`) unchanged.

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors. (The `(x: unknown) => String(x)` annotation avoids an implicit-any.)

- [ ] **Step 5: Manual verification — legacy shape + anon flag**

Run `npm run dev`. With the **current** composer (still sends a single `rec_to` string), drop
for one member. Confirm in Supabase: the new `items` row has `anon=true`; one `recs` row; one
`queue_items` row (`source='rec'`); the recipient gets the "someone left something for you."
ping and is NOT also sent the generic "someone dropped something." group push. Then drop with
no recipient ("everyone"): the new `items` row has `anon=false`, no rec, and the rest of the
group gets the "someone dropped something." push.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/items/route.ts
git commit -m "feat(api): set items.anon and fan out rec_to array to N recipients"
```

---

### Task 3: Feed — anon-aware, per-viewer render

**Files:**
- Modify: `src/app/(app)/home/page.tsx` (Item type; items select; `forMe` read; per-card render)

**Interfaces:**
- Consumes: `items.anon` (Task 1), the user-scoped `supabase` client, `recs_select_mine` RLS, the existing `ids` array and `Item` type.
- Produces: a `forMe: Set<string>`; each card's author line renders one of four ways — `for you` (recipient), `you left this for someone` (author of anon), `someone dropped this` (bystander of anon), or the real name (attributed group drop).

> **Context — this file changed on `main`.** The items `.select()` now also embeds reactor
> names (`reactions(emoji, user_id, users!reactions_user_id_fkey(name))`), and the card
> builds an `rx` array + passes `canSeeWho={mine}` to `<Reactions>`. None of that interacts
> with anonymity (reactor visibility is about who reacted, not who dropped). Touch only the
> lines below; leave the reactions logic alone.

- [ ] **Step 1: Add `anon` to the `Item` type**

In `src/app/(app)/home/page.tsx`, the `Item` type (lines 21–30), add a field (e.g. after `created_by: string;`):

```ts
  anon: boolean;
```

- [ ] **Step 2: Select `anon` in the items query**

Change the items select (line 62) from:

```ts
    .select("id, type, rating_value, note, data, created_by, users!items_created_by_fkey(name), reactions(emoji, user_id, users!reactions_user_id_fkey(name))")
```

to (insert `anon` right after `type,`):

```ts
    .select("id, type, anon, rating_value, note, data, created_by, users!items_created_by_fkey(name), reactions(emoji, user_id, users!reactions_user_id_fkey(name))")
```

- [ ] **Step 3: Add the "left for me" lookup**

Immediately after the existing `const queued = new Set(...)` (line 74), add:

```ts
  // which of these drops were left FOR me. recs_select_mine RLS returns only my
  // own recs, so this is the recipient-side signal.
  const { data: recRaw } = await supabase
    .from("recs")
    .select("item_id")
    .eq("to_user", user.id)
    .in("item_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const forMe = new Set((recRaw ?? []).map((r) => r.item_id as string));
```

- [ ] **Step 4: Compute `forYou` per card**

In the `items.map((it) => { ... })` body, just after the existing `const mine = it.created_by === user.id;` (line 110), add:

```ts
                const forYou = forMe.has(it.id);
```

- [ ] **Step 5: Render the author line four ways**

Replace the existing author `<span>` (line 131):

```tsx
                          <span className="font-m text-[11px] text-muted">{(it.users?.name || "someone").toLowerCase()}</span>
```

with:

```tsx
                          {forYou ? (
                            <span className="font-m text-[11px] text-vibe">✦ someone left this for you</span>
                          ) : it.anon ? (
                            <span className="font-m text-[11px] text-muted">{mine ? "✦ you left this for someone" : "someone dropped this ✦"}</span>
                          ) : (
                            <span className="font-m text-[11px] text-muted">{(it.users?.name || "someone").toLowerCase()}</span>
                          )}
```

- [ ] **Step 6: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 7: Manual verification — all four viewpoints**

With `npm run dev`, as user A drop something for user B (single-recipient is fine here):
- **B** (recipient) `/home`: card reads `✦ someone left this for you` in violet, no name.
- **A** (author) `/home`: same card reads `✦ you left this for someone`, no name, with delete control.
- A third member **C** (bystander): same card reads `someone dropped this ✦`, no name.
- A normal "everyone" drop: shows the real author name to all three.
- Create a shareable link drop and claim it as a new user: it stays **attributed** (real name, `anon=false`) — NOT anonymized.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(app)/home/page.tsx"
git commit -m "feat(feed): anon-aware per-viewer render for targeted drops"
```

---

### Task 4: Composer — multi-select recipients

**Files:**
- Modify: `src/components/drop-composer.tsx` (state at line 24; a toggle helper; the picker at lines 292–301; submission `rec_to` + link branch at lines 163–183; the button label at lines 314–318)

**Interfaces:**
- Consumes: the Task 2 API contract (`rec_to: string[]`), the `members: Member[]` prop (`{ id, name }`).
- Produces: composer posts `rec_to: string[]` — `[...recipients]` when targeting people, `[]` for everyone or link. Link branch keyed on `recMode === "link"`.

- [ ] **Step 1: Replace `recTo` state with mode + recipient set**

Replace line 24:

```ts
  const [recTo, setRecTo] = useState("");          // "" = everyone, id = member, "__link__" = shareable link
```

with:

```ts
  // recMode: "everyone" (group-wide, attributed) | "people" (anonymous, one rec per id) | "link"
  const [recMode, setRecMode] = useState<"everyone" | "people" | "link">("everyone");
  const [recipients, setRecipients] = useState<Set<string>>(new Set());
```

- [ ] **Step 2: Add the recipient toggle helper**

Add inside the component, just after `reset()` (near line 47):

```ts
  function toggleRecipient(id: string) {
    const next = new Set(recipients);
    if (next.has(id)) next.delete(id); else next.add(id);
    setRecipients(next);
    setRecMode(next.size === 0 ? "everyone" : "people");
  }
```

- [ ] **Step 3: Rewrite the "drop it for…" picker**

Replace the picker block (lines 292–301):

```tsx
      <div className="mt-4">
        <div className="font-m text-[10px] font-bold tracking-widest uppercase text-muted mb-2">drop it for… (optional)</div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setRecTo("")} className={`font-b font-semibold text-[12px] border-[2px] border-ink rounded-full px-3 py-1.5 ${recTo === "" ? "bg-ink text-paper" : "bg-surface"}`}>everyone</button>
          {members.map((m) => (
            <button key={m.id} onClick={() => setRecTo(m.id)} className={`font-b font-semibold text-[12px] border-[2px] border-ink rounded-full px-3 py-1.5 ${recTo === m.id ? "bg-vibe text-white" : "bg-surface"}`}>{(m.name || "someone").toLowerCase()}</button>
          ))}
          <button onClick={() => setRecTo("__link__")} className={`font-b font-semibold text-[12px] border-[2px] border-ink rounded-full px-3 py-1.5 ${recTo === "__link__" ? "bg-vibe text-white" : "bg-surface"}`}>✦ anyone (link)</button>
        </div>
      </div>
```

with:

```tsx
      <div className="mt-4">
        <div className="font-m text-[10px] font-bold tracking-widest uppercase text-muted mb-2">drop it for… (optional)</div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setRecMode("everyone"); setRecipients(new Set()); }}
            className={`font-b font-semibold text-[12px] border-[2px] border-ink rounded-full px-3 py-1.5 ${recMode === "everyone" ? "bg-ink text-paper" : "bg-surface"}`}>everyone</button>
          {members.map((m) => (
            <button key={m.id} onClick={() => toggleRecipient(m.id)}
              className={`font-b font-semibold text-[12px] border-[2px] border-ink rounded-full px-3 py-1.5 ${recipients.has(m.id) ? "bg-vibe text-white" : "bg-surface"}`}>{(m.name || "someone").toLowerCase()}</button>
          ))}
          <button onClick={() => { setRecMode("link"); setRecipients(new Set()); }}
            className={`font-b font-semibold text-[12px] border-[2px] border-ink rounded-full px-3 py-1.5 ${recMode === "link" ? "bg-vibe text-white" : "bg-surface"}`}>✦ anyone (link)</button>
        </div>
      </div>
```

- [ ] **Step 4: Update submission to send the array + key the link branch on `recMode`**

Replace the submission section (lines 163–183):

```tsx
    setBusy(true); setMsg("");
    const isMember = recTo && recTo !== "__link__";
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_id: groupId, type, data,
        rating_value: ratingValue || null,
        rating_style: ratingValue ? ratingStyle : null,
        note: note.trim() || null,
        rec_to: isMember ? recTo : null,
      }),
    });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error || "couldn't drop"); setBusy(false); return; }

    // shareable link for someone not in the group → show the /r link to copy.
    if (recTo === "__link__") {
      const rr = await (await fetch("/api/recs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item_id: j.id }) })).json();
      if (rr.url) { setShareUrl(window.location.origin + rr.url); setBusy(false); return; }
    }
```

with:

```tsx
    setBusy(true); setMsg("");
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_id: groupId, type, data,
        rating_value: ratingValue || null,
        rating_style: ratingValue ? ratingStyle : null,
        note: note.trim() || null,
        rec_to: recMode === "people" ? [...recipients] : [],
      }),
    });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error || "couldn't drop"); setBusy(false); return; }

    // shareable link for someone not in the group → show the /r link to copy.
    if (recMode === "link") {
      const rr = await (await fetch("/api/recs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item_id: j.id }) })).json();
      if (rr.url) { setShareUrl(window.location.origin + rr.url); setBusy(false); return; }
    }
```

- [ ] **Step 5: Compute the drop-button label and use it**

Add just before `const accent = ...` (line 189):

```ts
  const recCount = recipients.size;
  const oneName = recCount === 1 ? (members.find((m) => recipients.has(m.id))?.name || "them").toLowerCase() : "";
  const dropLabel = busy ? "dropping…"
    : recMode === "link" ? "drop + make a link"
    : recMode === "people" && recCount === 1 ? `send it to ${oneName}`
    : recMode === "people" && recCount > 1 ? `send it to ${recCount} people`
    : "drop it to the group";
```

Then replace the button's label expression (lines 314–318):

```tsx
          {busy ? "dropping…" : recTo === "__link__" ? "drop + make a link" : recTo ? `send it to ${(members.find((m) => m.id === recTo)?.name || "them").toLowerCase()}` : "drop it to the group"}
```

with:

```tsx
          {dropLabel}
```

- [ ] **Step 6: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors. Confirm no remaining references to the deleted `recTo` / `setRecTo`.

- [ ] **Step 7: Manual verification — multi-select end to end**

With `npm run dev`, in a group with ≥2 other members:
- Tap two member chips: both light violet; button reads **"send it to 2 people"**. Tap one off → **"send it to {name}"**. Tap it off → mode falls back to **everyone**, button reads **"drop it to the group"**.
- Tap "everyone" then a member: "everyone" de-selects, member lights. Tap "✦ anyone (link)": members clear, button reads **"drop + make a link"**.
- Drop for two members → **two** `recs` + **two** `queue_items` + **two** pings; `items.anon=true`; each recipient's `/home` shows `✦ someone left this for you`; neither sees the other recipient.
- Drop to everyone → `anon=false`, attributed for all. Link → unchanged `/r/<token>` copy flow.

- [ ] **Step 8: Commit**

```bash
git add src/components/drop-composer.tsx
git commit -m "feat(composer): multi-select recipients for a drop"
```

---

## Self-Review

**Spec coverage:**
- Multi-select recipients → Task 4 (UI) + Task 2 (API loop). ✓
- One item, N recs, no rec-model rewrite → Task 2 loops `createRec`. ✓
- `items.anon` flag (not derived from recs; link-claim-proof) → Task 1 (migration + types), Task 2 sets it. ✓
- Anonymity rule, four viewpoints (recipient / author / bystander / attributed) → Task 3 Step 5. ✓
- Name shown to no one on anon drops → Task 3 render has no name branch for `forYou`/`it.anon`. ✓
- Backward-compatible API + legacy single-string → Task 2 Step 1 normalization; Task 2 Step 4 verifies old composer. ✓
- Shareable-link drop stays attributed after claim → `anon=false` at creation (Task 2), feed keys on `it.anon` (Task 3); verified in Task 3 Step 7. ✓
- No recipient names/counts to anyone; no co-recipient disclosure → only a `forYou` flag renders, never identities. ✓
- `/r/<token>` link flow unchanged → Task 4 keeps the `recMode === "link"` branch; `/api/recs` untouched. ✓
- RLS unchanged → Task 3 relies on existing `recs_select_mine`. ✓
- Production-change gate for the live migration → Task 1 Step 2. ✓

**Placeholder scan:** None — every step shows exact before/after code, SQL, or an exact command.

**Type consistency:** `anon` defined in Task 1 (DB + types), set in Task 2 (insert), read in Task 3 (`Item` type + select + render). `recMode`/`recipients`/`toggleRecipient`/`recCount`/`oneName`/`dropLabel` defined and used consistently in Task 4; `forMe`/`forYou` consistent in Task 3. The deleted `recTo`/`setRecTo` are removed everywhere (state, picker, submission, button) — Task 4 Step 6 checks for stragglers. `targets` is computed once in Task 2 Step 1 and reused in the insert (`anon`) and the loop.
