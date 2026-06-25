-- "you" tab figure: ask male/female once, swap the standing-figure glyph.
-- Nullable (null = neutral default until answered). Additive + non-destructive.
alter table public.users add column if not exists gender text;
