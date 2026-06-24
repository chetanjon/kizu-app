-- Kizu — Trusted Discovery, Phase 1: the queue (the product's spine).
-- Adds queue_items: things a user means to get to, and their verdict once done.
-- This table is ALSO the behavioral-data source the "taste read" (Phase 6) needs:
-- added_at (intent), verdict (loved/liked/meh), done_at (finished + time-of-day).
--
-- Forward-compat note: curate_drop_id / source_rec_id columns and the
-- "exactly one target" check are added by later phase migrations (P2/P3) so
-- each migration applies cleanly on its own. `source` already allows all four
-- values now to avoid altering the CHECK later.
-- Mirrors 20260622_taste_pivot.sql conventions (RLS, owner-scoped policies).

CREATE TABLE public.queue_items (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id   UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  source    TEXT NOT NULL DEFAULT 'group'
              CHECK (source IN ('group','curate','rec','self')),
  added_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verdict   TEXT CHECK (verdict IS NULL OR verdict IN ('loved','liked','meh')),
  done_at   TIMESTAMPTZ,
  UNIQUE (user_id, item_id)
);

-- list a user's queue: open items first (done_at NULL), newest intent first.
CREATE INDEX idx_queue_user ON public.queue_items(user_id, done_at, added_at DESC);
-- count "landed" recs efficiently: who dropped a thing that got a good verdict.
CREATE INDEX idx_queue_item ON public.queue_items(item_id);

-- ── RLS: your queue is yours. (Writes go via the service-role client per the
--    route pattern — auth.uid() is null on route-handler writes — but these
--    owner-scoped policies are defense-in-depth and enable client reads.) ──
ALTER TABLE public.queue_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "queue_select_own" ON public.queue_items FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "queue_insert_own" ON public.queue_items FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "queue_update_own" ON public.queue_items FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "queue_delete_own" ON public.queue_items FOR DELETE USING (user_id = auth.uid());

-- Verify:
--   SELECT table_name FROM information_schema.tables
--    WHERE table_schema='public' AND table_name='queue_items';
