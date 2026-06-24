-- Kizu — Trusted Discovery, Phase 4: notifications.
-- In-app only, cryptic, EARNED events only (a rec for you / your rec landed /
-- weekly read). No push. Frequency-capped in-route. Body is a pre-rendered line.

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('rec_for_you','it_landed','weekly_read')),
  body        TEXT NOT NULL,
  href        TEXT,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read_at, created_at DESC);

-- RLS: your notifications are yours. Inserts happen server-side (service role).
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Verify:
--   SELECT table_name FROM information_schema.tables
--    WHERE table_schema='public' AND table_name='notifications';
