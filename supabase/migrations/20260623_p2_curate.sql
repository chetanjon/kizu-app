-- Kizu — Trusted Discovery, Phase 2: Kizu Curate.
-- Founder hand-curated picks from REAL people (photo + consent, moment-tagged).
-- Global (not group-scoped): the public, human-curated river below the Home
-- "you're all caught up" threshold + the Tonight dealer's wider pool.
--
-- Also extends queue_items so a curate pick can be queued (curate_drop_id),
-- alongside group items (item_id). Mirrors 20260622_taste_pivot.sql conventions.

-- ── curate_people: the humans behind the picks ──
CREATE TABLE public.curate_people (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  photo_url   TEXT,
  where_met   TEXT CHECK (where_met IS NULL OR char_length(where_met) <= 80),
  consent     BOOLEAN NOT NULL DEFAULT FALSE,  -- only consented people ever surface
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── curate_drops: one pick, tagged to a moment. data == items.data shape ──
CREATE TABLE public.curate_drops (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id    UUID NOT NULL REFERENCES public.curate_people(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('watch','listen','go_out')),
  moment       TEXT NOT NULL CHECK (char_length(moment) BETWEEN 1 AND 40),
  their_words  TEXT CHECK (their_words IS NULL OR char_length(their_words) <= 240),
  data         JSONB NOT NULL DEFAULT '{}'::jsonb,
  published    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_curate_drops_pub ON public.curate_drops(published, moment, created_at DESC);
CREATE INDEX idx_curate_drops_person ON public.curate_drops(person_id);

-- ── RLS: the river is intentionally PUBLIC-read (published drops by consented
--    people). Writes are service-role only (the founder admin tool). ──
ALTER TABLE public.curate_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curate_drops  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "curate_people_public_read" ON public.curate_people FOR SELECT USING (consent = true);
CREATE POLICY "curate_drops_public_read"  ON public.curate_drops  FOR SELECT USING (published = true);

-- ── extend queue_items: a queue row targets EITHER a group item OR a curate pick ──
ALTER TABLE public.queue_items
  ADD COLUMN curate_drop_id UUID REFERENCES public.curate_drops(id) ON DELETE CASCADE;
ALTER TABLE public.queue_items ALTER COLUMN item_id DROP NOT NULL;
ALTER TABLE public.queue_items
  ADD CONSTRAINT queue_one_target CHECK (num_nonnulls(item_id, curate_drop_id) = 1);
CREATE UNIQUE INDEX uq_queue_user_curate
  ON public.queue_items(user_id, curate_drop_id) WHERE curate_drop_id IS NOT NULL;

-- Verify:
--   SELECT table_name FROM information_schema.tables
--    WHERE table_schema='public' AND table_name IN ('curate_people','curate_drops');
