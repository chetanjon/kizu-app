-- DB hygiene sweep (2026-07-02), driven by Supabase advisors:
-- 1. auth_rls_initplan: wrap every direct auth.uid() in RLS policies as
--    (select auth.uid()) so Postgres evaluates it once per query (initplan)
--    instead of once per row. Semantics identical.
-- 2. unindexed_foreign_keys: covering indexes for 4 FKs.
-- 3. Revoke anon EXECUTE on the two SECURITY DEFINER helpers (no anon flow
--    queries member-gated tables; erroring beats silently probing).
-- 4. function_search_path_mutable: pin search_path=public on flagged functions.
-- Applied to prod via MCP apply_migration on 2026-07-02.

-- ---- 1. RLS initplan ----
alter policy gm_delete_self on public.group_members using (user_id = (select auth.uid()));
alter policy gm_insert_self on public.group_members with check (user_id = (select auth.uid()));
alter policy gm_update_self on public.group_members using (user_id = (select auth.uid()));

alter policy groups_insert_self on public.groups with check (created_by = (select auth.uid()));
alter policy groups_update_creator on public.groups using (created_by = (select auth.uid()));

alter policy items_delete_self on public.items using (created_by = (select auth.uid()));
alter policy items_insert_self_in_group on public.items
  with check ((created_by = (select auth.uid())) and is_group_member(group_id));
alter policy items_select_in_group on public.items using (
  (created_by = (select auth.uid()))
  or ((private = false) and (targeted = false) and is_group_member(group_id))
  or ((targeted = true) and exists (
    select 1 from recs r where r.item_id = items.id and r.to_user = (select auth.uid())
  ))
);
alter policy items_update_self on public.items using (created_by = (select auth.uid()));

alter policy notifications_select_own on public.notifications using (user_id = (select auth.uid()));
alter policy notifications_update_own on public.notifications using (user_id = (select auth.uid()));

alter policy "own push subscriptions" on public.push_subscriptions
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter policy queue_delete_own on public.queue_items using (user_id = (select auth.uid()));
alter policy queue_insert_own on public.queue_items with check (user_id = (select auth.uid()));
alter policy queue_select_own on public.queue_items using (user_id = (select auth.uid()));
alter policy queue_update_own on public.queue_items using (user_id = (select auth.uid()));

alter policy reactions_delete_self on public.reactions using (user_id = (select auth.uid()));
alter policy reactions_insert_self on public.reactions
  with check ((user_id = (select auth.uid())) and exists (
    select 1 from items i where i.id = reactions.item_id and is_group_member(i.group_id)
  ));

alter policy recs_select_mine on public.recs
  using ((from_user = (select auth.uid())) or (to_user = (select auth.uid())));

alter policy taste_reads_select_own on public.taste_reads using (user_id = (select auth.uid()));

alter policy users_insert_self on public.users with check (id = (select auth.uid()));
alter policy users_select_self_or_groupmate on public.users using (
  (id = (select auth.uid()))
  or exists (
    select 1
    from group_members me
    join group_members them on them.group_id = me.group_id
    where me.user_id = (select auth.uid()) and them.user_id = users.id
  )
);
alter policy users_update_self on public.users using (id = (select auth.uid()));

-- ---- 2. FK covering indexes ----
create index if not exists idx_queue_items_curate_drop on public.queue_items (curate_drop_id);
create index if not exists idx_queue_items_source_rec on public.queue_items (source_rec_id);
create index if not exists idx_reactions_user on public.reactions (user_id);
create index if not exists idx_recs_item on public.recs (item_id);

-- ---- 3. lock SECURITY DEFINER helpers away from anon ----
-- the EXECUTE grant rode on PUBLIC (postgres default), so it must be revoked
-- from PUBLIC too, then granted back to just the roles that need it.
revoke execute on function public.get_user_pod_ids(uuid) from public, anon;
revoke execute on function public.is_group_member(uuid) from public, anon;
grant execute on function public.get_user_pod_ids(uuid) to authenticated, service_role;
grant execute on function public.is_group_member(uuid) to authenticated, service_role;

-- ---- 4. pin search_path ----
alter function public.touch_comments_updated_at() set search_path = public;
alter function public.generate_invite_code() set search_path = public;
alter function public.get_user_pod_ids(uuid) set search_path = public;
alter function public.enforce_group_caps() set search_path = public;
alter function public.generate_rec_token() set search_path = public;
