-- "My streaming services" — so movie drops can say "you have it" instead of just
-- "where to watch". Stores canonical slugs (netflix, prime, hulu, …); the app maps
-- each slug to TMDB provider ids and intersects with a title's watch/providers.

ALTER TABLE public.users ADD COLUMN services TEXT[] NOT NULL DEFAULT '{}';

-- Verify:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name='users' AND column_name='services';
