-- Kizu v1 — witness migration
-- Applied: 2026-05-03
--
-- Pivots the schema from the accountability model (bets / dares / forfeits /
-- checkins / proof_drops / stares / briefs, plus W-L records on pod_members)
-- to the witness model (packs / pack_members / posts / reactions).
--
-- This is a CLEAN REWRITE. It drops all legacy accountability tables and
-- recreates the public.users table with a proper FK to auth.users.
-- Run against a fresh database, or accept that running it will discard
-- all accountability data.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. DROP legacy schema
-- ─────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.subscriptions   CASCADE;
DROP TABLE IF EXISTS public.briefs          CASCADE;
DROP TABLE IF EXISTS public.stares          CASCADE;
DROP TABLE IF EXISTS public.proof_drops     CASCADE;
DROP TABLE IF EXISTS public.forfeits        CASCADE;
DROP TABLE IF EXISTS public.checkins        CASCADE;
DROP TABLE IF EXISTS public.dares           CASCADE;
DROP TABLE IF EXISTS public.bets            CASCADE;
DROP TABLE IF EXISTS public.pod_members     CASCADE;
DROP TABLE IF EXISTS public.pods            CASCADE;
DROP TABLE IF EXISTS public.users           CASCADE;

DROP FUNCTION IF EXISTS public.generate_invite_code();

-- ─────────────────────────────────────────────────────────────────────────
-- 2. users (1:1 with auth.users)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email              TEXT UNIQUE NOT NULL,
  name               TEXT,
  avatar_url         TEXT,
  timezone           TEXT NOT NULL DEFAULT 'America/Phoenix',
  sunset_frequency   TEXT NOT NULL DEFAULT 'daily'
                       CHECK (sunset_frequency IN ('daily','every_2_days','weekly','off')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. packs
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE public.packs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  invite_code     TEXT UNIQUE NOT NULL,
  color_a         TEXT NOT NULL CHECK (color_a ~ '^#[0-9A-Fa-f]{6}$'),
  color_b         TEXT NOT NULL CHECK (color_b ~ '^#[0-9A-Fa-f]{6}$'),
  icon            TEXT NOT NULL,
  founding_date   DATE NOT NULL,
  created_by      UUID NOT NULL REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_packs_invite_code ON public.packs(invite_code);
CREATE INDEX idx_packs_created_by  ON public.packs(created_by);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. pack_members
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE public.pack_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id     UUID NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_home     BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pack_id, user_id)
);

CREATE INDEX idx_pack_members_pack ON public.pack_members(pack_id);
CREATE INDEX idx_pack_members_user ON public.pack_members(user_id);

-- Exactly one home pack per user (only when is_home is true).
CREATE UNIQUE INDEX unique_home_per_user
  ON public.pack_members(user_id) WHERE is_home;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. posts (photos and receipts share a wall)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE public.posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id      UUID NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('photo','receipt')),
  image_url    TEXT NOT NULL,
  local_date   DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_pack_created   ON public.posts(pack_id, created_at DESC);
CREATE INDEX idx_posts_author_created ON public.posts(author_id, created_at DESC);

-- One photo per author per local_date. Receipts have no daily cap.
CREATE UNIQUE INDEX one_photo_per_user_per_day
  ON public.posts(author_id, local_date) WHERE kind = 'photo';

-- ─────────────────────────────────────────────────────────────────────────
-- 6. reactions (8 fixed emoji, no comments)
-- ─────────────────────────────────────────────────────────────────────────
-- The exact 8 emoji are intentionally not encoded here so they can be
-- iterated on without a migration. The app validates the set; the DB only
-- enforces uniqueness per (post,user,emoji).
CREATE TABLE public.reactions (
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id, emoji)
);

CREATE INDEX idx_reactions_post ON public.reactions(post_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 7. Helper functions
-- ─────────────────────────────────────────────────────────────────────────

-- 6-character invite code, ambiguous chars (0/O/1/I) excluded.
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars  TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- SECURITY DEFINER so RLS policies can call it without recursing on
-- pack_members. Returns true iff the calling auth user is in the pack.
CREATE OR REPLACE FUNCTION public.is_pack_member(p_pack_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pack_members
     WHERE pack_id = p_pack_id
       AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ─────────────────────────────────────────────────────────────────────────
-- 8. Triggers — enforce pack caps (≤20 members per pack, ≤5 packs per user)
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_pack_caps()
RETURNS TRIGGER AS $$
DECLARE
  member_count INT;
  user_pack_count INT;
BEGIN
  SELECT COUNT(*) INTO member_count
    FROM public.pack_members WHERE pack_id = NEW.pack_id;
  IF member_count >= 20 THEN
    RAISE EXCEPTION 'pack is full (20/20 members)';
  END IF;

  SELECT COUNT(*) INTO user_pack_count
    FROM public.pack_members WHERE user_id = NEW.user_id;
  IF user_pack_count >= 5 THEN
    RAISE EXCEPTION 'user is in too many packs (5/5)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_pack_caps
  BEFORE INSERT ON public.pack_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_pack_caps();

-- ─────────────────────────────────────────────────────────────────────────
-- 9. Row Level Security
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions    ENABLE ROW LEVEL SECURITY;

-- users: read your own row, plus rows of users who share a pack with you.
CREATE POLICY "users_select_self_or_packmate"
  ON public.users FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
        FROM public.pack_members me
        JOIN public.pack_members them ON them.pack_id = me.pack_id
       WHERE me.user_id = auth.uid()
         AND them.user_id = public.users.id
    )
  );

CREATE POLICY "users_insert_self"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_self"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

-- packs: read packs you are in. Insert any (creator must equal auth.uid()).
-- Update only the pack creator can change name / colors / icon.
CREATE POLICY "packs_select_member"
  ON public.packs FOR SELECT
  USING (public.is_pack_member(id));

CREATE POLICY "packs_insert_self"
  ON public.packs FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "packs_update_creator"
  ON public.packs FOR UPDATE
  USING (created_by = auth.uid());

-- pack_members: read members of packs you are in. Insert your own row only.
-- Delete your own row only.
CREATE POLICY "pack_members_select_in_pack"
  ON public.pack_members FOR SELECT
  USING (public.is_pack_member(pack_id));

CREATE POLICY "pack_members_insert_self"
  ON public.pack_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pack_members_update_self"
  ON public.pack_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "pack_members_delete_self"
  ON public.pack_members FOR DELETE
  USING (user_id = auth.uid());

-- posts: read posts in packs you are in. Insert into packs you are in,
-- as yourself. Delete your own posts. No update (no edits / retakes).
CREATE POLICY "posts_select_in_pack"
  ON public.posts FOR SELECT
  USING (public.is_pack_member(pack_id));

CREATE POLICY "posts_insert_self_in_pack"
  ON public.posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND public.is_pack_member(pack_id)
  );

CREATE POLICY "posts_delete_self"
  ON public.posts FOR DELETE
  USING (author_id = auth.uid());

-- reactions: read on posts you can see. Insert/delete your own only.
CREATE POLICY "reactions_select_in_pack"
  ON public.reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
       WHERE p.id = post_id
         AND public.is_pack_member(p.pack_id)
    )
  );

CREATE POLICY "reactions_insert_self"
  ON public.reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.posts p
       WHERE p.id = post_id
         AND public.is_pack_member(p.pack_id)
    )
  );

CREATE POLICY "reactions_delete_self"
  ON public.reactions FOR DELETE
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- 10. Storage bucket for posts
-- ─────────────────────────────────────────────────────────────────────────
-- Created via Supabase dashboard or CLI; SQL stub below for reference.
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('posts', 'posts', false)
-- ON CONFLICT (id) DO NOTHING;
--
-- Storage RLS policies should mirror posts SELECT/INSERT/DELETE rules.
-- They are intentionally not declared here because storage policies live
-- on storage.objects and depend on the bucket existing first.

-- ─────────────────────────────────────────────────────────────────────────
-- Done. Verify with:
--   SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public'
--    ORDER BY table_name;
--   -- expected: packs, pack_members, posts, reactions, users
-- ─────────────────────────────────────────────────────────────────────────
