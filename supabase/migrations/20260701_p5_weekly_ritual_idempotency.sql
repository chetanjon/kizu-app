-- Module 5 (weekly ritual) idempotency: exactly one WEEKLY read per group per
-- week, enforced at the DB layer so a double-firing cron physically cannot
-- duplicate. Additive + backward-compatible: existing rows default to
-- source='manual', period_start=null (excluded from the partial unique index),
-- so the on-demand vibe read and any code that ignores these columns keep working.
--
-- Apply in the Supabase SQL editor (project undcbbwiytfzquriwwqx). Safe to run
-- BEFORE the app code that writes these columns ships.

alter table public.vibe_reads
  add column if not exists source text not null default 'manual'
  check (source in ('manual','weekly'));

alter table public.vibe_reads
  add column if not exists period_start date;   -- the week's Monday (UTC) for weekly rows; null for manual

create unique index if not exists vibe_reads_weekly_uniq
  on public.vibe_reads (group_id, period_start)
  where source = 'weekly';
