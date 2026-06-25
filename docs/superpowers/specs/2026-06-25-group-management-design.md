# kizu — group management (switch · create · join · rename · members · leave)

**Date:** 2026-06-25
**Status:** approved design, pre-implementation

## Problem

A user can belong to multiple groups (the `group_members` model + `is_home` flag already support it), but there's no in-app surface for it:
- Group creation/join only appears during onboarding (`/groups/new`, shown when you have zero groups).
- Home only ever renders your `is_home` group — no way to switch, and a newly created/joined second group is added but you're never taken to it.
- No way to rename a group, see who's in it, or leave.

This feature adds the missing surfaces. The backend largely exists; most of the work is UI plus a few small routes.

## Decisions (locked with the user)

- **Entry point = the group pill, pattern A** (dropdown). The pill in Home's header becomes a button (`● <active group> ▾`); tapping opens a dropdown.
- Scope = **switch + create + join + rename + recolor + members list + leave** (the "full management" set).
- **Create and join always make that group active** (auto-switch), so you land where you intend.
- **Rename/recolor restricted to the group's creator** (`created_by`). Non-creators see the name/color read-only (no edit controls).
- **Members list is read-only** (no kick/remove-others in this scope).
- **No cap** on number of groups per user (the DB still enforces 20 members/group via the existing caps trigger).

## Surfaces

### 1. Group switcher dropdown — `src/components/group-switcher.tsx` (client)
Replaces the static pill in Home's header. Mirrors the open/close pattern of `notifications-bell.tsx` (click-outside overlay + `Esc`).

- **Trigger:** `● <active name> ▾` (chevron signals it's tappable).
- **Dropdown contents:**
  - **your groups** — one row per membership: `● name`, with a ✓ on the active one. Tapping a non-active row switches (calls the set-active API → `router.refresh()`).
  - divider
  - **＋ create new group** → navigates to `/groups/new`
  - **→ join with code** → navigates to `/groups/new?tab=join`
  - **⚙ manage group** → navigates to `/groups/manage` (settings for the active group)
- **Props:** `groups: { id, name, color }[]`, `activeId: string`. Home already has these from `getMemberships`.
- **Styling:** neo-brutalist surface, `border-ink`, hard shadow — matches the notifications dropdown. Violet only for the active ✓ / the create action; RED stays on the `kizu.` dot only.

### 2. Group settings page — `src/app/groups/manage/page.tsx` (server)
Focused settings screen for the **active** group (derived from `is_home`), outside the `(app)` bottom-nav shell like `/groups/new`, with a `← back` link to `/home`. Auth-gated (proxy already matches `/groups`).

Sections:
- **Rename + recolor** — name input + the same color swatches as `/groups/new`; Save → `PATCH /api/groups`. (Client bit: `group-settings-form.tsx`.) **Only the creator sees the editable form**; non-creators see the name/color as read-only text.
- **Invite code** — display + copy-to-clipboard (so you can invite without leaving).
- **Members** — read-only list of members (name; tags: "you" for self, "founder" for `created_by`).
- **Leave group** — destructive action with an in-place confirm ("leave <name>?") → `POST /api/groups/leave`. (Client bit: `leave-group-button.tsx`.)

## APIs (all writes: `getUser()` + membership check → `createAdminClient()`)

- **`POST /api/groups/active`** `{ group_id }` *(new)* — verify the user is a member of `group_id` (else 403); set `is_home=true` on that membership and `false` on the user's others. Returns `{ ok: true }`.
- **`PATCH /api/groups`** `{ group_id, name?, color? }` *(extend existing route)* — verify the user is the group's **`created_by`** (else 403); validate (name 1–40 chars trimmed; color `#RRGGBB`); update the group. Partial updates allowed.
- **`POST /api/groups/leave`** `{ group_id }` *(new)* — verify membership; delete the user's `group_members` row for that group. **If it was the active group:** set `is_home=true` on a remaining membership — **prefer a group the user created** (`created_by = user`), else the most recently joined. If no memberships remain, return `{ ok: true, noGroups: true }` and the client routes to `/groups/new` (onboarding). Last-member-leaving leaves the group orphaned (no destructive cascade in this scope — noted limitation).
- **`POST /api/groups`** *(edit existing create)* — after inserting the membership, set the new group `is_home=true` and unset the user's other memberships (auto-switch into the new group). Onboarding (first group) behavior is unchanged.
- **`POST /api/groups/join`** *(edit existing join)* — after ensuring membership, set the joined group `is_home=true` and unset the user's others (auto-switch into it). Idempotent for already-members (still switches).

## Edits to existing files
- `src/app/(app)/home/page.tsx` — replace the static group pill with `<GroupSwitcher groups={…} activeId={g.id} />` (map `memberships` → `{id,name,color}`).
- `src/app/groups/new/page.tsx` — fix the post-success redirect `/feed` → `/home`; read `?tab=join` to default to the join tab.
- `src/app/api/groups/route.ts` — add `PATCH`; make `POST` auto-switch.
- `src/app/api/groups/join/route.ts` — auto-switch to the joined group.

## New files
- `src/components/group-switcher.tsx`
- `src/components/group-settings-form.tsx` (rename + recolor)
- `src/components/leave-group-button.tsx` (confirm + leave)
- `src/app/api/groups/active/route.ts`
- `src/app/api/groups/leave/route.ts`
- `src/app/groups/manage/page.tsx`

## Data flow
- Home (server) → `getMemberships` → `GroupSwitcher` (client) renders pill + dropdown.
- Switch → `POST /api/groups/active` → `router.refresh()` → Home re-renders the new active group; pill updates.
- Create/join via `/groups/new` → success → `/home`, now showing the new/joined (auto-switched) group.
- Manage → `/groups/manage` → rename/recolor (`PATCH`), view members, leave (`POST /api/groups/leave` → `/home` or `/groups/new`).

## UX safeguards
- Pill always shows the active group; switching is open-then-tap (no accidental switches).
- Create/join/manage always present, even with a single group.
- Leave requires an explicit confirm.
- Dropdown closes on click-outside / `Esc`.
- Schema note: `group_members ↔ users` embeds via the single `user_id` FK (unambiguous) — no `PGRST201` risk for the members list; no FK hint needed.

## Non-goals (explicitly out of scope)
- Removing/kicking other members; transferring ownership; deleting a group; per-group notification settings.
- A hard cap on number of groups per user.
- Managing a group you're not currently switched to (manage operates on the active group).

## Verification
- `npm run build` clean + `tsc`.
- Create a 2nd group from the switcher → you land in it, invite code visible, pill shows it.
- Switch back to the first → Home shows the first group's content.
- Join via code → you land in that group.
- Rename + recolor the active group → reflected in pill + header.
- Members list shows all members with correct "you"/"founder" tags.
- Leave the active group → you're moved to another group (or sent to `/groups/new` if none left); leaving a non-active group keeps your active group.
- No deploy without explicit approval.
