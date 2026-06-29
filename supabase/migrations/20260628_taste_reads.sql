-- Kizu — Trusted Discovery, Phase 6: the personal taste read (the "You" page).
-- Mirrors vibe_reads (20260622_taste_pivot.sql) but scoped to ONE person: kizu
-- reads your own taste back to you. Generated server-side via the service-role
-- client; you read only your own. Cached so the page isn't blank on every visit.

CREATE TABLE public.taste_reads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  card_data     JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_taste_reads_user ON public.taste_reads(user_id, generated_at DESC);

-- RLS: you read only your own read. Writes happen server-side (service role
-- bypasses RLS), same as vibe_reads.
ALTER TABLE public.taste_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "taste_reads_select_own" ON public.taste_reads FOR SELECT
  USING (user_id = auth.uid());

-- Verify:
--   SELECT table_name FROM information_schema.tables
--    WHERE table_schema='public' AND table_name='taste_reads';
