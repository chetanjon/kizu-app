-- Decouple items.anon from targeting.
--
-- History: targeted drops were written with anon=true, but after the "attributed
-- targeting" decision (option 3) the feed stopped READING anon and showed the
-- dropper's name. Now anon is an EXPLICIT group-wide toggle and every read path
-- (feed/queue/tonight/vibe/taste-match) honors it again — which would silently
-- re-anonymize those historical targeted drops. Clear them so they stay attributed.
--
-- After this, anon=true means exactly one thing: "the dropper chose to be hidden."

UPDATE public.items i
   SET anon = false
 WHERE i.anon = true
   AND EXISTS (SELECT 1 FROM public.recs r WHERE r.item_id = i.id);

-- Verify (expect 0 rows — no anon drop should still be a targeted rec):
--   SELECT count(*) FROM public.items i
--    WHERE i.anon = true AND EXISTS (SELECT 1 FROM public.recs r WHERE r.item_id = i.id);
