-- Kizu v2 Foundation migration
-- Applied: 2026-04-18
-- Additive only. No destructive changes. Safe to run against production.

-- ──────────────────────────────────────────────
-- 1. Pod-level mode toggle (Fighter / No Fighter)
-- ──────────────────────────────────────────────
ALTER TABLE pods
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'fighter'
  CHECK (mode IN ('fighter', 'no_fighter'));

-- ──────────────────────────────────────────────
-- 2. Per-member grace period (one free miss per calendar month)
-- ──────────────────────────────────────────────
ALTER TABLE pod_members
  ADD COLUMN IF NOT EXISTS grace_used_at TIMESTAMPTZ;
-- Semantics: NULL = grace available. If set and within the current
-- calendar month, grace is consumed. Implicit monthly reset — we
-- compare stored value's (year, month) to NOW().

-- ──────────────────────────────────────────────
-- 3. Pod-level streak (all-members-delivered consecutive weeks)
-- ──────────────────────────────────────────────
ALTER TABLE pods
  ADD COLUMN IF NOT EXISTS current_pod_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_pod_streak INTEGER NOT NULL DEFAULT 0;

-- ──────────────────────────────────────────────
-- 4. Subscriptions scaffolding (wired up in Plan 5 — Monetization)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'beta_trial'
    CHECK (status IN ('beta_trial', 'active', 'canceled', 'past_due')),
  beta_trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- RLS: users can read only their own subscription. No one writes from the
-- client — only the server-side Stripe webhook writes (service role).
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- 5. Phone number on users (wired up in Plan 3 — SMS infrastructure)
-- ──────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sms_opted_in BOOLEAN NOT NULL DEFAULT FALSE;

-- Partial unique index — only enforce uniqueness for non-null phone numbers.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_number
  ON users(phone_number)
  WHERE phone_number IS NOT NULL;

-- ──────────────────────────────────────────────
-- Done
-- ──────────────────────────────────────────────
-- To verify after running, check:
--   SELECT column_name, data_type, column_default
--     FROM information_schema.columns
--     WHERE table_name IN ('pods', 'pod_members', 'users')
--       AND column_name IN ('mode','grace_used_at','current_pod_streak',
--                           'longest_pod_streak','phone_number',
--                           'phone_verified_at','sms_opted_in');
--   SELECT table_name FROM information_schema.tables
--     WHERE table_name = 'subscriptions';
