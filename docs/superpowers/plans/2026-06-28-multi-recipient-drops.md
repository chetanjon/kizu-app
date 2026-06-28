# Multi-recipient Drops + Private "for you" Signal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user drop one thing *for multiple specific people* in a single action, and show each recipient a private, sender-anonymous "✦ someone left this for you" signal on that drop in the feed.

**Architecture:** No schema change. A drop is one `items` row; targeting a person is one `recs` row, and `createRec()` already does the full per-recipient job (insert rec, enqueue, ping). Multi-recipient = loop `createRec()` per recipient for the same item. The feed reads the current user's own `recs` (allowed by existing `recs_select_mine` RLS) to mark which cards were left for them, and renders the targeted ones anonymously to the recipient only. Three independent edits: the API write side, the feed read/render side, and the composer UI.

**Tech Stack:** Next.js 16 (App Router) + TypeScript, Supabase (service-role admin writes, user-scoped reads), Tailwind v4. React client component for the composer; server component for the feed.

**Spec:** `docs/superpowers/specs/2026-06-28-multi-recipient-drops-design.md`

## Global Constraints

- **No migration, no schema change.** The `recs` model already supports N recipients per item (one row each). Do not alter `recs`, `items`, `queue_items`, or any RLS policy.
- **No new npm dependencies.** Budget is $0; ask before adding any.
- **No test framework exists** (`package.json` has only `dev`/`build`/`start`/`lint`). Do NOT introduce one. Per-task verification = `npx tsc --noEmit` (typecheck) + `npm run lint` (eslint) both clean, plus the explicit manual check in that task. This matches the spec's verification section.
- **Soft anonymity, recipient-only.** Hide the sender's name *only* on the recipient's own card. Bystanders (non-recipients) see normal authorship. Never show recipient names/counts to the group, and never disclose co-recipients to a recipient.
- **Backward-compatible API.** `/api/items` must accept the new `rec_to` array AND tolerate the legacy single-string shape, so an in-flight old client during deploy still works.
- **Card copy:** exactly `✦ someone left this for you` — lowercase, matches the existing notification voice ("someone left something for you."). Tinted `text-vibe` (violet) per the approved design.
- **Brand tokens only** (`bg-vibe`, `text-vibe`, `text-muted`, `border-ink`, `font-m`, etc.) — no raw hexes. RED is reserved; do not use it here.
- **Embed hint:** the feed's `items`↔`users` join must keep the `users!items_created_by_fkey(name)` disambiguation (ambiguous otherwise → `PGRST201`, silent 0 rows). Don't touch it.

---

### Task 1: API — accept `rec_to` as an array of recipients

**Files:**
- Modify: `src/app/api/items/route.ts:57-70` (the rec block + the response)
- (No change needed to `src/lib/recs.ts` — `createRec` is already per-recipient and already sends the sender-anonymous ping.)

**Interfaces:**
- Consumes: existing `createRec(admin, fromUser, itemId, toUser)` → `{ token, recId } | null`; existing `admin` client and verified `user`.
- Produces: `POST /api/items` now reads `body.rec_to` as `string[]` (or a single string, legacy). For each distinct id ≠ sender that is a group member, creates one rec. Response shape unchanged: `{ id: string, recUrl: string | null }` (`recUrl` is the first created rec's `/r/<token>`, or `null`).

- [ ] **Step 1: Replace the single-recipient rec block with an array loop**

In `src/app/api/items/route.ts`, replace the current block (lines 57–70):

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

  return NextResponse.json({ id: item.id, recUrl });
```

with:

```ts
  // optional: drop this FOR one or more group members (rec-as-invite).
  // Accept rec_to as an array of user ids; tolerate the legacy single-string
  // shape so an in-flight old client mid-deploy still works. De-dupe and drop
  // the sender. Each valid member gets its own rec + queue row + cryptic ping
  // (createRec handles all three). Membership failures skip silently.
  const recTo: string[] = Array.isArray(b.rec_to)
    ? b.rec_to.map((x: unknown) => String(x))
    : b.rec_to ? [String(b.rec_to)] : [];
  const targets = [...new Set(recTo)].filter((id) => id && id !== user.id);

  let recUrl: string | null = null;
  for (const id of targets) {
    const { data: rmem } = await admin
      .from("group_members").select("group_id")
      .eq("group_id", group_id).eq("user_id", id).maybeSingle();
    if (!rmem) continue;
    const rec = await createRec(admin, user.id, item.id, id);
    if (rec && !recUrl) recUrl = `/r/${rec.token}`;
  }

  return NextResponse.json({ id: item.id, recUrl });
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors (the `(x: unknown) => String(x)` annotation avoids an implicit-any lint error).

- [ ] **Step 4: Manual verification — legacy single-recipient still works**

Run `npm run dev`. With the **current** composer (which still sends a single `rec_to` string), drop something for one group member. Confirm in Supabase: one new `recs` row (`to_user` = that member), one new `queue_items` row (`source='rec'`), and the member receives the "someone left something for you." notification. This proves backward compatibility before the composer changes in Task 3.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/items/route.ts
git commit -m "feat(api): accept rec_to as an array of recipients on /api/items"
```

---

### Task 2: Feed — detect "for me" and render the sender-anonymous signal

**Files:**
- Modify: `src/app/(app)/home/page.tsx` (add a `recs` read after line 73; add `forYou` + conditional author line in the card map)

**Interfaces:**
- Consumes: existing `supabase` user-scoped client, `user.id`, the `items` list and its `ids` array, and the existing `recs_select_mine` RLS (returns only rows where `to_user = auth.uid()`).
- Produces: a `forMe: Set<string>` of item ids left for the current user; the card author line renders `✦ someone left this for you` when the item is in `forMe`, else the real author name (unchanged).

- [ ] **Step 1: Add the "for me" recs lookup**

In `src/app/(app)/home/page.tsx`, immediately after the existing `queued` Set (line 73, `const queued = new Set(...)`), add:

```ts
  // which of these drops were left FOR me (from any sender). recs_select_mine
  // RLS returns only my own recs, so this is the recipient-side "for you" signal.
  const { data: recRaw } = await supabase
    .from("recs")
    .select("item_id")
    .eq("to_user", user.id)
    .in("item_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const forMe = new Set((recRaw ?? []).map((r) => r.item_id as string));
```

- [ ] **Step 2: Compute `forYou` per card**

In the `items.map((it) => { ... })` body, just after the existing `const mine = it.created_by === user.id;` (line 108), add:

```ts
                const forYou = forMe.has(it.id);
```

- [ ] **Step 3: Render the author line conditionally**

Replace the existing author `<span>` (line 125):

```tsx
                          <span className="font-m text-[11px] text-muted">{(it.users?.name || "someone").toLowerCase()}</span>
```

with:

```tsx
                          {forYou
                            ? <span className="font-m text-[11px] text-vibe">✦ someone left this for you</span>
                            : <span className="font-m text-[11px] text-muted">{(it.users?.name || "someone").toLowerCase()}</span>}
```

(The sender is excluded from their own recs, so `mine` and `forYou` are never both true; the `mine ? DeleteDrop : QueueButton` control to the right is unaffected. A "for you" drop is already in the recipient's queue via `createRec`, so its QueueButton shows queued — consistent.)

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 6: Manual verification — recipient sees anonymous signal, others see the name**

With `npm run dev`: as user A, drop something for user B (using the still-single-recipient composer or a direct `POST /api/items` with `rec_to: ["<B-id>"]`). Then:
- Log in as **B**, open `/home`: that card's footer reads `✦ someone left this for you` in violet, with **no** "A" name.
- Log in as **A** (or any non-recipient member): the same card shows A's real name, no "for you" marker.
- A normal group-wide drop (no rec) shows the author name for everyone, as before.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(app)/home/page.tsx"
git commit -m "feat(feed): show sender-anonymous 'left for you' signal to recipients"
```

---

### Task 3: Composer — multi-select recipients

**Files:**
- Modify: `src/components/drop-composer.tsx` (state at line 24; a toggle helper; the "drop it for…" picker at lines 292–301; submission `rec_to` + link branch at lines 163–183; the button label at lines 314–318)

**Interfaces:**
- Consumes: the Task 1 API contract (`rec_to: string[]`), the `members: Member[]` prop (`{ id, name }`).
- Produces: composer posts `rec_to: string[]` — `[...recipients]` when targeting people, `[]` for everyone or link. Link branch keyed on `recMode === "link"`. No external interface beyond the existing `/api/items` + `/api/recs` calls.

- [ ] **Step 1: Replace `recTo` state with mode + recipient set**

In `src/components/drop-composer.tsx`, replace line 24:

```ts
  const [recTo, setRecTo] = useState("");          // "" = everyone, id = member, "__link__" = shareable link
```

with:

```ts
  // recMode: "everyone" (group-wide, no recs) | "people" (one rec per id) | "link" (open /r link)
  const [recMode, setRecMode] = useState<"everyone" | "people" | "link">("everyone");
  const [recipients, setRecipients] = useState<Set<string>>(new Set());
```

- [ ] **Step 2: Add the recipient toggle helper**

Add this function inside the component (e.g. just after `reset()`, near line 47):

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

Add, just before `const accent = ...` (line 189):

```ts
  const recCount = recipients.size;
  const oneName = recCount === 1 ? (members.find((m) => recipients.has(m.id))?.name || "them").toLowerCase() : "";
  const dropLabel = busy ? "dropping…"
    : recMode === "link" ? "drop + make a link"
    : recMode === "people" && recCount === 1 ? `send it to ${oneName}`
    : recMode === "people" && recCount > 1 ? `send it to ${recCount} people`
    : "drop it to the group";
```

Then replace the button's label expression (lines 314–318), changing:

```tsx
          {busy ? "dropping…" : recTo === "__link__" ? "drop + make a link" : recTo ? `send it to ${(members.find((m) => m.id === recTo)?.name || "them").toLowerCase()}` : "drop it to the group"}
```

to:

```tsx
          {dropLabel}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (Confirm no remaining references to the deleted `recTo` / `setRecTo` anywhere in the file.)

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 8: Manual verification — multi-select end to end**

With `npm run dev`, in a group with ≥2 other members:
- Tap two member chips: both light violet; button reads **"send it to 2 people"**. Tap one off: button reads **"send it to {name}"**. Tap it off too: mode falls back to **everyone**, button reads **"drop it to the group"**.
- Tap "everyone" then a member: "everyone" de-selects, member lights. Tap "✦ anyone (link)": members clear, link mode active, button reads **"drop + make a link"**.
- Drop for two members → confirm **two** `recs` rows + **two** `queue_items` + **two** pings; each recipient's `/home` shows `✦ someone left this for you`; neither sees the other recipient.
- Drop to everyone → zero recs, normal authorship for all. Link → unchanged `/r/<token>` copy flow.

- [ ] **Step 9: Commit**

```bash
git add src/components/drop-composer.tsx
git commit -m "feat(composer): multi-select recipients for a drop"
```

---

## Self-Review

**Spec coverage:**
- Multi-select recipients → Task 3 (UI) + Task 1 (API loop). ✓
- One item, N recs, no migration → Task 1 loops `createRec`; no schema touched. ✓
- Recipient sees private "for you" → Task 2 (`forMe` + conditional render). ✓
- Sender anonymous to recipient (soft) → Task 2 renders `✦ someone left this for you`, no name; bystanders keep authorship. ✓
- Backward-compatible API → Task 1 normalizes legacy single string; Task 1 Step 4 explicitly verifies the old composer before Task 3. ✓
- No recipient names/counts to group; no co-recipient disclosure → nothing renders recipient identity to anyone but a `for you` flag on the recipient's own card. ✓
- `/r/<token>` link flow unchanged → Task 3 keeps the link branch (keyed on `recMode === "link"`); `/api/recs` untouched. ✓
- RLS unchanged → Task 2 relies on existing `recs_select_mine`. ✓
- Edge cases (self in set, dupes, non-member, legacy shape) → Task 1 `filter(id !== user.id)` + `new Set()` de-dupe + membership `continue` + array normalization. ✓

**Placeholder scan:** None — every step shows the exact before/after code or an exact command.

**Type consistency:** `recMode`/`recipients`/`toggleRecipient`/`recCount`/`oneName`/`dropLabel` defined and used consistently in Task 3; `forMe`/`forYou` consistent in Task 2; API reads `rec_to` array consistently with the composer's emitted `rec_to: string[]`. The deleted `recTo`/`setRecTo` are removed everywhere they were used (state, picker, submission, button) — Task 3 Step 6 explicitly checks for stragglers.
