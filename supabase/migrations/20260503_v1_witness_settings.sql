-- Kizu v1 — settings migration
-- Applied: 2026-05-03
--
-- Adds the per-user `next_sunset_at` column used by the sunset-email cron
-- (Phase B) and the settings page (Phase A) to display the next scheduled
-- sundown.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS next_sunset_at TIMESTAMPTZ;

-- Partial index — the cron query is "WHERE next_sunset_at IS NOT NULL AND
-- next_sunset_at <= NOW()", so we only index rows that can ever match.
CREATE INDEX IF NOT EXISTS idx_users_next_sunset_at
  ON public.users(next_sunset_at)
  WHERE next_sunset_at IS NOT NULL;

-- Done.
