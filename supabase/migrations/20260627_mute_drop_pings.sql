-- Per-user opt-out for "someone dropped something." push pings.
-- Default false = pings on (unchanged behavior); set true to mute drop pings
-- only — earned-event pushes (rec landed, weekly read) are unaffected.
alter table public.users add column if not exists mute_drop_pings boolean not null default false;
