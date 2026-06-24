-- Kizu — Phase 2 storage: the `curate` bucket for real-people photos.
-- Public bucket (served via public URL); uploads happen server-side via the
-- service-role client in /api/curate/upload (founder-gated). 5MB image cap.
--
-- NOTE: this bucket was created live via the Storage API; this file is the
-- canonical record so it reproduces on a fresh project. Idempotent.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'curate', 'curate', true, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/heic']
)
ON CONFLICT (id) DO NOTHING;
