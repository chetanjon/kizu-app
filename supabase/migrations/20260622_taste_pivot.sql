-- Kizu — taste-space pivot migration
-- Replaces the witness model (packs / pack_members / posts / reactions / comments)
-- with the group taste space (groups / group_members / items / reactions / vibe_reads).
--
-- DESTRUCTIVE: drops the witness tables above. KEEPS public.users (reused as the
-- profile, 1:1 with auth.users). Mirrors the conventions of 20260503_v1_witness.sql
-- (SECURITY DEFINER membership helper, generate_invite_code(), caps trigger, RLS).

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Drop the witness tables we replace (CASCADE drops their policies/indexes/triggers)
-- ─────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.comments      CASCADE;
DROP TABLE IF EXISTS public.reactions     CASCADE;   -- witness reactions were post-based
DROP TABLE IF EXISTS public.posts         CASCADE;
DROP TABLE IF EXISTS public.pack_members  CASCADE;
DROP TABLE IF EXISTS public.packs         CASCADE;

-- CASCADE also removes the witness storage.objects policies on the old 'posts'
-- bucket that referenced this function (we replace them when go-out photos ship).
DROP FUNCTION IF EXISTS public.is_pack_member(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.enforce_pack_caps() CASCADE;

-- The witness users SELECT policy referenced pack_members (now gone) — replace it.
DROP POLICY IF EXISTS "users_select_self_or_packmate" ON public.users;

-- Best-effort: stop the witness sunset cron (ignore if pg_cron / the job is absent).
DO $$ BEGIN
  PERFORM cron.unschedule('kizu-sunset-tick');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Keep generate_invite_code() (idempotent re-declare)
-- ─────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────
-- 3. groups
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE public.groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  color        TEXT NOT NULL DEFAULT '#6B4BD6' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  invite_code  TEXT UNIQUE NOT NULL DEFAULT public.generate_invite_code(),
  created_by   UUID NOT NULL REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_groups_invite_code ON public.groups(invite_code);
CREATE INDEX idx_groups_created_by  ON public.groups(created_by);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. group_members
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE public.group_members (
  group_id   UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_home    BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
-- exactly one home group per user
CREATE UNIQUE INDEX unique_home_group_per_user
  ON public.group_members(user_id) WHERE is_home;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. items  (one primitive: a thing you love. type-specific payload in `data`)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE public.items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('watch','listen','go_out')),
  rating_value  TEXT,
  rating_style  TEXT CHECK (rating_style IS NULL OR rating_style IN ('number','stars','word')),
  note          TEXT CHECK (note IS NULL OR char_length(note) <= 200),
  data          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_items_group_created ON public.items(group_id, created_at DESC);
CREATE INDEX idx_items_creator       ON public.items(created_by);

-- ─────────────────────────────────────────────────────────────────────────
-- 6. reactions (item-based; the 8 emoji set is validated in the app)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE public.reactions (
  item_id     UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (item_id, user_id, emoji)
);
CREATE INDEX idx_reactions_item ON public.reactions(item_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 7. vibe_reads (generated server-side via the service-role client)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE public.vibe_reads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  summary       TEXT NOT NULL,
  card_data     JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_vibe_reads_group ON public.vibe_reads(group_id, generated_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- 8. membership helper (SECURITY DEFINER so RLS policies don't recurse)
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
     WHERE group_id = p_group_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ─────────────────────────────────────────────────────────────────────────
-- 9. caps: ≤20 members per group, ≤10 groups per user
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_group_caps()
RETURNS TRIGGER AS $$
DECLARE m INT; g INT;
BEGIN
  SELECT COUNT(*) INTO m FROM public.group_members WHERE group_id = NEW.group_id;
  IF m >= 20 THEN RAISE EXCEPTION 'group is full (20/20 members)'; END IF;
  SELECT COUNT(*) INTO g FROM public.group_members WHERE user_id = NEW.user_id;
  IF g >= 10 THEN RAISE EXCEPTION 'user is in too many groups (10/10)'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_group_caps
  BEFORE INSERT ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_group_caps();

-- ─────────────────────────────────────────────────────────────────────────
-- 10. Row Level Security
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_reads    ENABLE ROW LEVEL SECURITY;

-- users: read self, plus anyone who shares a group with you.
CREATE POLICY "users_select_self_or_groupmate"
  ON public.users FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
        FROM public.group_members me
        JOIN public.group_members them ON them.group_id = me.group_id
       WHERE me.user_id = auth.uid()
         AND them.user_id = public.users.id
    )
  );

-- groups: members read; anyone may create (as themselves); creator updates.
-- (Joining by invite code is done server-side with the service-role client.)
CREATE POLICY "groups_select_member"  ON public.groups FOR SELECT USING (public.is_group_member(id));
CREATE POLICY "groups_insert_self"    ON public.groups FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "groups_update_creator" ON public.groups FOR UPDATE USING (created_by = auth.uid());

-- group_members: read members of your groups; manage your own row.
CREATE POLICY "gm_select_in_group" ON public.group_members FOR SELECT USING (public.is_group_member(group_id));
CREATE POLICY "gm_insert_self"     ON public.group_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "gm_update_self"     ON public.group_members FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "gm_delete_self"     ON public.group_members FOR DELETE USING (user_id = auth.uid());

-- items: read in your groups; create as yourself in your groups; edit/delete your own.
CREATE POLICY "items_select_in_group" ON public.items FOR SELECT USING (public.is_group_member(group_id));
CREATE POLICY "items_insert_self_in_group" ON public.items FOR INSERT
  WITH CHECK (created_by = auth.uid() AND public.is_group_member(group_id));
CREATE POLICY "items_update_self" ON public.items FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "items_delete_self" ON public.items FOR DELETE USING (created_by = auth.uid());

-- reactions: read on items you can see; insert/delete your own.
CREATE POLICY "reactions_select_in_group" ON public.reactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.items i WHERE i.id = item_id AND public.is_group_member(i.group_id)));
CREATE POLICY "reactions_insert_self" ON public.reactions FOR INSERT
  WITH CHECK (user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.items i WHERE i.id = item_id AND public.is_group_member(i.group_id)));
CREATE POLICY "reactions_delete_self" ON public.reactions FOR DELETE USING (user_id = auth.uid());

-- vibe_reads: members read. Writes happen server-side (service role bypasses RLS).
CREATE POLICY "vibe_reads_select_in_group" ON public.vibe_reads FOR SELECT USING (public.is_group_member(group_id));

-- ─────────────────────────────────────────────────────────────────────────
-- Done. Verify:
--   SELECT table_name FROM information_schema.tables
--    WHERE table_schema='public' ORDER BY table_name;
--   -- expected: group_members, groups, items, reactions, users, vibe_reads
-- ─────────────────────────────────────────────────────────────────────────
