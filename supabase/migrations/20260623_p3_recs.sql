-- Kizu — Trusted Discovery, Phase 3: rec-as-invite.
-- Drop something FOR a specific person. If they're a member it lands in their
-- queue; if not, a no-wall /r/<token> page lets them react/queue before signup.
-- "Landed" (recs.landed_at) is the north-star: you sent it, they loved it.

-- url-safe token, longer + unguessable (vs the 6-char group invite code).
CREATE OR REPLACE FUNCTION public.generate_rec_token()
RETURNS TEXT AS $$
DECLARE
  chars  TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..16 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE TABLE public.recs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  from_user   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user     UUID REFERENCES public.users(id) ON DELETE CASCADE,   -- null = open link
  token       TEXT UNIQUE NOT NULL DEFAULT public.generate_rec_token(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  landed_at   TIMESTAMPTZ                                            -- set on loved/liked
);
CREATE INDEX idx_recs_to    ON public.recs(to_user, created_at DESC);
CREATE INDEX idx_recs_from  ON public.recs(from_user, created_at DESC);
CREATE INDEX idx_recs_token ON public.recs(token);

-- queue rows can remember the rec they came from (for "it landed" attribution).
ALTER TABLE public.queue_items
  ADD COLUMN source_rec_id UUID REFERENCES public.recs(id) ON DELETE SET NULL;

-- RLS: only the sender or recipient can read a rec. The public /r/<token> page
-- reads via the service-role client by exact token — NO broad public policy.
ALTER TABLE public.recs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recs_select_mine" ON public.recs FOR SELECT
  USING (from_user = auth.uid() OR to_user = auth.uid());

-- Verify:
--   SELECT table_name FROM information_schema.tables
--    WHERE table_schema='public' AND table_name='recs';
