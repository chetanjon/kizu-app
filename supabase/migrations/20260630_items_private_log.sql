-- Personal Log: a `private` item is a creator-only log (your taste diary).
-- It never appears in the group feed/tonight, but DOES feed the owner's taste
-- signals (taste-signals reads items by created_by). Additive + default false,
-- so every existing row stays a normal shared drop and nothing changes.

alter table public.items
  add column if not exists private boolean not null default false;

-- Read rule: members see only NON-private group items; the creator always sees
-- their own (including private logs). Replaces the prior group-only select.
drop policy if exists "items_select_in_group" on public.items;
create policy "items_select_in_group" on public.items for select using (
  created_by = auth.uid()
  or (private = false and public.is_group_member(group_id))
);
