-- Kizu — anonymous targeted drops.
-- A drop made FOR specific people is anonymous to every viewer (no author name
-- shown). Carry that as an explicit flag set at creation — NOT derived from recs,
-- because the shareable-link claim flow (/api/recs/claim) also sets recs.to_user
-- and would otherwise wrongly anonymize a claimed link drop.
ALTER TABLE public.items
  ADD COLUMN anon BOOLEAN NOT NULL DEFAULT false;

-- Verify:
--   SELECT column_name, data_type, column_default
--     FROM information_schema.columns
--    WHERE table_schema='public' AND table_name='items' AND column_name='anon';
