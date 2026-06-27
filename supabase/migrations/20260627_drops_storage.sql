-- Kizu — storage: the PRIVATE `drops` bucket for member-uploaded outside-drop photos.
-- Private (no public URLs): reads happen via short-lived signed URLs minted
-- server-side; uploads happen via the service-role client in /api/items/upload
-- (group-membership gated). 5MB cap. Photos are always re-encoded to webp before
-- upload, so the stored objects are webp; the allowlist is belt-and-suspenders.
--
-- Apply in the Supabase SQL editor (project undcbbwiytfzquriwwqx). Idempotent.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'drops', 'drops', false, 5242880,
  ARRAY['image/webp','image/jpeg','image/png']
)
ON CONFLICT (id) DO NOTHING;
