-- Targeted drops become PRIVATE to the recipients + the sender — not the group.
-- A "drop it for… specific people" now behaves like a personal handoff: only the
-- people it was sent to (and whoever sent it) can see it, everywhere. Mirrors the
-- existing `private` (personal-log) column + policy pattern.
--
-- Additive + backward-compatible: existing rows default to targeted=false, so all
-- current drops stay group-visible exactly as before.
--
-- Apply in the Supabase SQL editor (project undcbbwiytfzquriwwqx) BEFORE deploying
-- the app code that writes/reads this column.

alter table public.items
  add column if not exists targeted boolean not null default false;

-- RLS backstop (defense-in-depth): a targeted item is readable ONLY by its creator
-- or a named recipient (a recs row with to_user = you). Group members who are not
-- recipients cannot read it. Non-targeted, non-private drops stay group-visible.
-- The app also filters explicitly on the service-role read paths (vibe read,
-- taste-match) that bypass RLS.
drop policy if exists "items_select_in_group" on public.items;
create policy "items_select_in_group" on public.items for select using (
  created_by = auth.uid()
  or (
    private = false
    and targeted = false
    and public.is_group_member(group_id)
  )
  or (
    targeted = true
    and exists (
      select 1 from public.recs r
      where r.item_id = items.id and r.to_user = auth.uid()
    )
  )
);
