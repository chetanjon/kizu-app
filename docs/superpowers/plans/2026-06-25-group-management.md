# Group Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in user switch between their groups, create/join more, and rename / view members / leave — all from the Home header.

**Architecture:** A `GroupSwitcher` client component replaces the static group pill in Home's header (pill ▾ → dropdown: switch · create · join · manage). A small `setActiveGroup` helper drives `group_members.is_home`; create/join/switch/leave all route through it. A `/groups/manage` server page hosts rename (creator-only), invite code, members list, and leave.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (admin-write pattern), Tailwind v4 tokens.

## Global Constraints

- All write routes: authorize with `getUser()` + membership/creator check, then write via `createAdminClient()` (service role). Never trust client-supplied identity.
- Use design tokens only (`bg-surface`, `border-ink`, `text-vibe`, `border-hair`, `bg-surface-2`, `font-h/b/m`, hard shadow `shadow-[…_#14110F]`). RED (`text-red`) stays ONLY on the `kizu.` dot. Violet (`vibe`) is the accent.
- No new npm dependencies.
- Verification per task: `./node_modules/.bin/tsc --noEmit` clean; final task also `npm run build`. There is no unit-test harness in this repo — verify by typecheck + the manual flow stated in each task. Run all commands from `/Users/chetanjonnalagadda/Downloads/Kizu/kizu-app`.
- Do NOT deploy. Commit locally only.

---

### Task 1: Switch backbone — `setActiveGroup` helper + set-active API + auto-switch on create/join

**Files:**
- Create: `src/lib/groups.ts`
- Create: `src/app/api/groups/active/route.ts`
- Modify: `src/app/api/groups/route.ts` (POST create)
- Modify: `src/app/api/groups/join/route.ts`

**Interfaces:**
- Produces: `setActiveGroup(admin, userId, groupId): Promise<void>` — sets `is_home=true` on `(userId, groupId)` and `false` on the user's other memberships. Used by Tasks 1 and 5.
- Produces: `POST /api/groups/active { group_id }` → `{ ok: true }` (403 if not a member).

- [ ] **Step 1: Write the helper** — `src/lib/groups.ts`

```ts
import { createAdminClient } from "@/lib/supabase-admin";

type Admin = ReturnType<typeof createAdminClient>;

// Make `groupId` the user's active (home) group; clear is_home on their others.
export async function setActiveGroup(admin: Admin, userId: string, groupId: string) {
  await admin.from("group_members").update({ is_home: false }).eq("user_id", userId);
  await admin.from("group_members").update({ is_home: true }).eq("user_id", userId).eq("group_id", groupId);
}
```

- [ ] **Step 2: Write the set-active route** — `src/app/api/groups/active/route.ts`

```ts
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { setActiveGroup } from "@/lib/groups";
import { NextResponse } from "next/server";

// Switch which group is active (is_home) for the current user.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { group_id } = await req.json().catch(() => ({}));
  if (!group_id) return NextResponse.json({ error: "group_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: mem } = await admin
    .from("group_members").select("group_id")
    .eq("user_id", user.id).eq("group_id", group_id).maybeSingle();
  if (!mem) return NextResponse.json({ error: "not a member" }, { status: 403 });

  await setActiveGroup(admin, user.id, group_id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Auto-switch on create** — in `src/app/api/groups/route.ts`, add `import { setActiveGroup } from "@/lib/groups";` at the top, then replace the membership block (the `const { count } …` lookup and the `group_members` insert + its error return) with:

```ts
  const { error: mErr } = await admin
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id, is_home: false });
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 400 });

  await setActiveGroup(admin, user.id, group.id);
  return NextResponse.json({ id: group.id, invite_code: group.invite_code });
```

- [ ] **Step 4: Auto-switch on join** — in `src/app/api/groups/join/route.ts`, add `import { setActiveGroup } from "@/lib/groups";`, then replace the `const { count } …` block and the `upsert` + its error return with:

```ts
  const { error } = await admin
    .from("group_members")
    .upsert(
      { group_id: group.id, user_id: user.id, is_home: false },
      { onConflict: "group_id,user_id", ignoreDuplicates: true }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await setActiveGroup(admin, user.id, group.id);
  return NextResponse.json({ id: group.id });
```

- [ ] **Step 5: Typecheck**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: clean (no output).

- [ ] **Step 6: Commit**

```bash
git add src/lib/groups.ts "src/app/api/groups/active/route.ts" "src/app/api/groups/route.ts" "src/app/api/groups/join/route.ts"
git commit -m "feat(groups): set-active API + auto-switch on create/join"
```

---

### Task 2: Group switcher pill + wire into Home

**Files:**
- Create: `src/components/group-switcher.tsx`
- Modify: `src/app/(app)/home/page.tsx`

**Interfaces:**
- Consumes: `POST /api/groups/active` (Task 1).
- Produces: `<GroupSwitcher groups={{id,name,color}[]} activeId={string} />`.

- [ ] **Step 1: Write the component** — `src/components/group-switcher.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type G = { id: string; name: string; color: string };

// The group pill IS the button: tap to switch, create, join, or manage.
export default function GroupSwitcher({ groups, activeId }: { groups: G[]; activeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = groups.find((g) => g.id === activeId) ?? groups[0];

  async function switchTo(id: string) {
    if (id === activeId || busy) return;
    setBusy(true);
    await fetch("/api/groups/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: id }),
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 font-m text-xs font-bold border-[2px] border-ink rounded-full px-3 py-1.5 bg-surface">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: active?.color }} />
        {active?.name.toLowerCase()}
        <span className="text-[9px] opacity-70">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-[230px] z-40 bg-surface border-[2.5px] border-ink rounded-2xl shadow-[5px_5px_0_#14110F] overflow-hidden">
            <div className="px-4 py-2.5 border-b-[2px] border-hair font-m text-[10px] tracking-widest uppercase text-muted">your groups</div>
            {groups.map((g) => (
              <button key={g.id} onClick={() => switchTo(g.id)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-surface-2 text-left">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} />
                {g.name.toLowerCase()}
                {g.id === activeId && <span className="ml-auto text-vibe font-bold">✓</span>}
              </button>
            ))}
            <div className="border-t-[2px] border-hair">
              <Link href="/groups/new" onClick={() => setOpen(false)}
                className="block px-4 py-2.5 font-m text-[12px] font-bold text-vibe hover:bg-surface-2">＋ create new group</Link>
              <Link href="/groups/new?tab=join" onClick={() => setOpen(false)}
                className="block px-4 py-2.5 font-m text-[12px] font-bold hover:bg-surface-2">→ join with code</Link>
              <Link href="/groups/manage" onClick={() => setOpen(false)}
                className="block px-4 py-2.5 font-m text-[12px] font-bold hover:bg-surface-2 border-t-[1.5px] border-hair">⚙ manage group</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into Home** — in `src/app/(app)/home/page.tsx`:

Add the import near the other component imports:
```tsx
import GroupSwitcher from "@/components/group-switcher";
```

Replace the static pill `<span>` in the header (the element with class `flex items-center gap-2 font-m text-xs font-bold border-[2px] border-ink rounded-full px-3 py-1.5 bg-surface` containing the color dot and `{g.name.toLowerCase()}`) with:
```tsx
            <GroupSwitcher
              groups={memberships.map((m) => ({ id: m.groups!.id, name: m.groups!.name, color: m.groups!.color }))}
              activeId={g.id}
            />
```

- [ ] **Step 3: Typecheck**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Manual check**

Run the dev server (`npm run dev`, single instance — kill any stragglers with `pkill -f "next dev"` and `rm -rf .next` first). On `/home`, the pill shows `● <group> ▾`; clicking opens the dropdown with your groups + create/join/manage. Switching to another group reloads Home into it. (Manage 404s until Task 6.)

- [ ] **Step 5: Commit**

```bash
git add src/components/group-switcher.tsx "src/app/(app)/home/page.tsx"
git commit -m "feat(groups): switcher dropdown in Home header"
```

---

### Task 3: `/groups/new` polish — redirect to /home + ?tab=join

**Files:**
- Modify: `src/app/groups/new/page.tsx`

- [ ] **Step 1: Read `?tab` and fix redirects** — in `src/app/groups/new/page.tsx`:

1. Update imports:
```tsx
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
```
2. Rename the existing default-export component `NewGroup` to `NewGroupInner` (keep its body).
3. Inside `NewGroupInner`, replace `const [tab, setTab] = useState<"create" | "join">("create");` with:
```tsx
  const sp = useSearchParams();
  const [tab, setTab] = useState<"create" | "join">(sp.get("tab") === "join" ? "join" : "create");
```
4. Change BOTH `router.push("/feed")` calls (in `create()` and `join()`) to `router.push("/home")`.
5. Add a new default export wrapping the inner component in Suspense (required for `useSearchParams`):
```tsx
export default function NewGroup() {
  return (
    <Suspense>
      <NewGroupInner />
    </Suspense>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Manual check**

`/groups/new?tab=join` opens on the join tab; creating or joining a group lands you on `/home` (in that group, via Task 1's auto-switch).

- [ ] **Step 4: Commit**

```bash
git add "src/app/groups/new/page.tsx"
git commit -m "fix(groups): /groups/new redirects to /home + ?tab=join"
```

---

### Task 4: Rename/recolor — PATCH /api/groups (creator-only) + settings form

**Files:**
- Modify: `src/app/api/groups/route.ts` (add `PATCH`)
- Create: `src/components/group-settings-form.tsx`

**Interfaces:**
- Produces: `PATCH /api/groups { group_id, name?, color? }` → `{ ok: true, ... }` (403 unless caller is the group's `created_by`).
- Produces: `<GroupSettingsForm groupId color name isCreator />` (used by Task 6).

- [ ] **Step 1: Add PATCH** — append to `src/app/api/groups/route.ts`:

```ts
// Rename / recolor a group — creator only.
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const group_id = String(b.group_id ?? "");
  if (!group_id) return NextResponse.json({ error: "group_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: group } = await admin.from("groups").select("created_by").eq("id", group_id).maybeSingle();
  if (!group) return NextResponse.json({ error: "no group" }, { status: 404 });
  if (group.created_by !== user.id) return NextResponse.json({ error: "only the creator can edit" }, { status: 403 });

  const update: { name?: string; color?: string } = {};
  if (typeof b.name === "string") { const n = b.name.trim().slice(0, 40); if (n) update.name = n; }
  if (/^#[0-9A-Fa-f]{6}$/.test(b.color)) update.color = b.color;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "nothing to update" }, { status: 400 });

  await admin.from("groups").update(update).eq("id", group_id);
  return NextResponse.json({ ok: true, ...update });
}
```

- [ ] **Step 2: Write the form** — `src/components/group-settings-form.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COLORS = ["#F0A23C", "#2F6FE0", "#E0567E", "#1B8A6B", "#6B4BD6"];

// Creator sees an editable name + color; everyone else sees it read-only.
export default function GroupSettingsForm(
  { groupId, name: initName, color: initColor, isCreator }:
  { groupId: string; name: string; color: string; isCreator: boolean }
) {
  const router = useRouter();
  const [name, setName] = useState(initName);
  const [color, setColor] = useState(initColor);
  const [busy, setBusy] = useState(false);

  if (!isCreator) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="w-4 h-4 rounded-full border-[2px] border-ink" style={{ background: initColor }} />
        <span className="font-h font-extrabold text-xl">{initName}</span>
      </div>
    );
  }

  async function save() {
    if (!name.trim() || busy) return;
    setBusy(true);
    await fetch("/api/groups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: groupId, name, color }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40}
        className="w-full bg-paper border-[2.5px] border-ink rounded-xl px-3.5 py-3 text-[15px] outline-none focus:shadow-[3px_3px_0_#6B4BD6]" />
      <div className="flex gap-3">
        {COLORS.map((c) => (
          <button key={c} onClick={() => setColor(c)} aria-label={c}
            className={`w-8 h-8 rounded-full border-[2.5px] ${color === c ? "border-ink scale-110" : "border-transparent"}`}
            style={{ background: c }} />
        ))}
      </div>
      <button onClick={save} disabled={busy}
        className="self-start font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-ink rounded-full px-5 py-2.5 shadow-[3px_3px_0_#14110F]">
        {busy ? "saving…" : "save"}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/groups/route.ts" src/components/group-settings-form.tsx
git commit -m "feat(groups): PATCH rename/recolor (creator-only) + settings form"
```

---

### Task 5: Leave — POST /api/groups/leave + leave button

**Files:**
- Create: `src/app/api/groups/leave/route.ts`
- Create: `src/components/leave-group-button.tsx`

**Interfaces:**
- Consumes: `setActiveGroup` (Task 1).
- Produces: `POST /api/groups/leave { group_id }` → `{ ok: true }` or `{ ok: true, noGroups: true }`.
- Produces: `<LeaveGroupButton groupId groupName />` (used by Task 6).

- [ ] **Step 1: Write the leave route** — `src/app/api/groups/leave/route.ts`

```ts
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { setActiveGroup } from "@/lib/groups";
import { NextResponse } from "next/server";

// Leave a group. If it was the active one, switch to a remaining group —
// preferring one the user created, else the most recently joined.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { group_id } = await req.json().catch(() => ({}));
  if (!group_id) return NextResponse.json({ error: "group_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: mem } = await admin
    .from("group_members").select("is_home")
    .eq("user_id", user.id).eq("group_id", group_id).maybeSingle();
  if (!mem) return NextResponse.json({ error: "not a member" }, { status: 403 });

  await admin.from("group_members").delete().eq("user_id", user.id).eq("group_id", group_id);

  const { data: rest } = await admin
    .from("group_members")
    .select("group_id, groups(created_by)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!rest || rest.length === 0) return NextResponse.json({ ok: true, noGroups: true });

  if (mem.is_home) {
    const mine = rest.find((r) => (r.groups as { created_by: string } | null)?.created_by === user.id);
    const next = mine?.group_id ?? rest[rest.length - 1].group_id;
    await setActiveGroup(admin, user.id, next);
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Write the leave button** — `src/components/leave-group-button.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Two-step: tap reveals an inline confirm, so leaving is never accidental.
export default function LeaveGroupButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function leave() {
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/groups/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: groupId }),
    });
    const j = await res.json().catch(() => ({}));
    if (j.noGroups) router.push("/groups/new");
    else { router.push("/home"); router.refresh(); }
  }

  if (!confirm) {
    return (
      <button onClick={() => setConfirm(true)}
        className="font-m text-[12px] font-bold text-muted border-[2px] border-ink rounded-full px-4 py-2 hover:bg-surface-2">
        leave group
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="font-m text-[12px]">leave {groupName.toLowerCase()}?</span>
      <button onClick={leave} disabled={busy}
        className="font-h font-bold text-xs text-white bg-ink rounded-full px-3 py-1.5">{busy ? "…" : "yes, leave"}</button>
      <button onClick={() => setConfirm(false)} className="font-m text-[11px] text-muted">cancel</button>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/groups/leave/route.ts" src/components/leave-group-button.tsx
git commit -m "feat(groups): leave route + confirm button"
```

---

### Task 6: Manage page — assemble settings, invite code, members, leave

**Files:**
- Create: `src/app/groups/manage/page.tsx`

**Interfaces:**
- Consumes: `GroupSettingsForm` (Task 4), `LeaveGroupButton` (Task 5), `getCurrentUser`/`getMemberships` (`@/lib/auth`).

- [ ] **Step 1: Write the page** — `src/app/groups/manage/page.tsx`

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getMemberships } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import GroupSettingsForm from "@/components/group-settings-form";
import LeaveGroupButton from "@/components/leave-group-button";

// Settings for the active group: rename (creator), invite code, members, leave.
export default async function ManageGroup() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const memberships = await getMemberships(user.id);
  if (memberships.length === 0) redirect("/groups/new");
  const active = memberships.find((m) => m.is_home) ?? memberships[0];
  const g = active.groups!;

  const supabase = await createClient();
  const { data: groupRow } = await supabase.from("groups").select("created_by").eq("id", g.id).maybeSingle();
  const isCreator = groupRow?.created_by === user.id;

  const { data: memberRows } = await supabase
    .from("group_members").select("user_id, users(name)").eq("group_id", g.id);
  const members = (memberRows ?? []) as unknown as { user_id: string; users: { name: string | null } | null }[];

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center gap-3 px-6 h-16 border-b-[2px] border-ink">
        <Link href="/home" className="font-m text-sm font-bold">← back</Link>
        <span className="font-h text-xl font-extrabold tracking-[-0.05em]">manage group</span>
      </header>
      <main className="max-w-[560px] mx-auto px-6 py-8 flex flex-col gap-8">
        <section>
          <div className="font-m text-[10px] font-bold tracking-widest uppercase text-muted mb-3">name &amp; color</div>
          <GroupSettingsForm groupId={g.id} name={g.name} color={g.color} isCreator={isCreator} />
        </section>

        <section>
          <div className="font-m text-[10px] font-bold tracking-widest uppercase text-muted mb-2">invite code</div>
          <div className="font-h font-extrabold text-2xl tracking-wide">{g.invite_code}</div>
          <div className="font-m text-[11px] text-muted mt-1">share <b>/join/{g.invite_code}</b></div>
        </section>

        <section>
          <div className="font-m text-[10px] font-bold tracking-widest uppercase text-muted mb-3">members · {members.length}</div>
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-2 bg-surface border-[2px] border-ink rounded-xl px-3 py-2.5">
                <span className="font-b font-semibold text-sm">{(m.users?.name || "someone").toLowerCase()}</span>
                {m.user_id === user.id && <span className="font-m text-[10px] text-muted">you</span>}
                {m.user_id === groupRow?.created_by && <span className="ml-auto font-m text-[10px] font-bold text-vibe">founder</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="pt-2 border-t-[2px] border-hair">
          <LeaveGroupButton groupId={g.id} groupName={g.name} />
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + build**

Run: `./node_modules/.bin/tsc --noEmit` then `npm run build`
Expected: both clean.

- [ ] **Step 3: Manual end-to-end check**

From `/home`: pill ▾ → create a 2nd group → land in it (invite code visible). Switch back to the first. Open ⚙ manage → rename + recolor (only if you're the creator; the pill/header update after save). Members list shows everyone with `you`/`founder` tags. Leave a non-active group → active unchanged. Leave the active group → moved to another group (or onboarding if it was your last).

- [ ] **Step 4: Commit**

```bash
git add "src/app/groups/manage/page.tsx"
git commit -m "feat(groups): /groups/manage page (rename, invite, members, leave)"
```

---

## Self-Review

- **Spec coverage:** switcher dropdown (T2) · set-active (T1) · create/join auto-switch (T1) · `/groups/new` polish (T3) · PATCH rename creator-only (T4) · leave with remaining-group preference (T5) · manage page w/ members + invite + leave (T6). All spec sections map to a task.
- **Type consistency:** `setActiveGroup(admin,userId,groupId)` defined T1, used T1/T5. `GroupSwitcher` props match the Home call. `GroupSettingsForm`/`LeaveGroupButton` prop names match the manage page usage.
- **Placeholders:** none — every step has concrete code.
- **Note:** invite-code "copy" from the spec is rendered as displayed text + share hint (no clipboard button) to avoid an extra client component; trivial to add later if wanted.
