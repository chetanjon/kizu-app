-- Kizu v1 — sunset email cron schedule
-- Applied: 2026-05-03
--
-- Schedules a once-per-minute job that POSTs to the Vercel cron route.
-- The route processes up to 50 users whose next_sunset_at has passed.
--
-- ─── OPERATOR NOTE ──────────────────────────────────────────────────────
-- Before this schedule will work, you must:
--
--   1. Set the bearer-token secret as a Postgres database setting:
--      ALTER DATABASE postgres SET app.cron_secret = '<random-32-byte-hex>';
--      -- Use the SAME value as the CRON_SECRET env var on Vercel.
--
--   2. Update APP_URL below if your production domain isn't kizu.app.
--
--   3. Ensure the pg_cron and pg_net extensions are enabled in Supabase
--      (Database → Extensions). They are below as well, but Supabase may
--      need you to allow them in the dashboard first.
-- ─────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop any prior copy of the schedule so this migration is idempotent.
SELECT cron.unschedule('kizu-sunset-tick')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'kizu-sunset-tick'
  );

SELECT cron.schedule(
  'kizu-sunset-tick',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://kizu.app/api/cron/sunsets',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.cron_secret', true),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 25000
    );
  $$
);

-- Done.
-- To verify:
--   SELECT * FROM cron.job WHERE jobname = 'kizu-sunset-tick';
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
