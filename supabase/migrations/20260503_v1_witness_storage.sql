-- Kizu v1 — witness storage migration
-- Applied: 2026-05-03
--
-- Creates the private `posts` Storage bucket and RLS policies on
-- storage.objects that mirror the public.posts SELECT/INSERT/DELETE
-- rules.
--
-- Object key convention: <pack_id>/<post_id>.<ext>
-- (the first path segment is the pack uuid; we parse it to gate access)

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Bucket (private)
-- ─────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', false)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Policies on storage.objects, scoped to the 'posts' bucket
-- ─────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "posts_storage_select_in_pack"  ON storage.objects;
DROP POLICY IF EXISTS "posts_storage_insert_self"     ON storage.objects;
DROP POLICY IF EXISTS "posts_storage_delete_self"     ON storage.objects;

-- SELECT: the first path segment is the pack id; user must be in that pack.
CREATE POLICY "posts_storage_select_in_pack"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'posts'
    AND public.is_pack_member((storage.foldername(name))[1]::uuid)
  );

-- INSERT: same pack-membership gate; we don't enforce the file path
-- includes auth.uid() because the API route generates the path and signs
-- the upload.
CREATE POLICY "posts_storage_insert_self"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'posts'
    AND public.is_pack_member((storage.foldername(name))[1]::uuid)
  );

-- DELETE: only the post author can delete; we look up the matching row
-- in public.posts via the second path segment (post id, before extension).
CREATE POLICY "posts_storage_delete_self"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'posts'
    AND EXISTS (
      SELECT 1 FROM public.posts p
       WHERE p.id::text = split_part((storage.foldername(name))[2], '.', 1)
         AND p.author_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- Done.
-- ─────────────────────────────────────────────────────────────────────────
