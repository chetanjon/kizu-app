-- Kizu v1 — comments migration
-- Applied: 2026-05-03
--
-- Replaces the 8-emoji `reactions` system with a constrained `comments`
-- table: one comment per user per post, ≤200 chars, no line breaks
-- (enforced client-side; the DB just caps length).
--
-- Deliberate override of KIZU-DESIGN-DOC.md Section 13.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Drop reactions
-- ─────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.reactions CASCADE;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. comments
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE public.comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 200),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, author_id)
);

CREATE INDEX idx_comments_post ON public.comments(post_id, created_at);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. updated_at trigger
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.touch_comments_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- 4. RLS
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_in_pack"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
       WHERE p.id = post_id
         AND public.is_pack_member(p.pack_id)
    )
  );

CREATE POLICY "comments_insert_self"
  ON public.comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.posts p
       WHERE p.id = post_id
         AND public.is_pack_member(p.pack_id)
    )
  );

CREATE POLICY "comments_update_self"
  ON public.comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "comments_delete_self"
  ON public.comments FOR DELETE
  USING (author_id = auth.uid());

-- Done.
