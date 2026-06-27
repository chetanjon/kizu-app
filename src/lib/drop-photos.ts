import type { SupabaseClient } from "@supabase/supabase-js";

// drops-bucket object paths look like: groups/<uuid>/<uuid>.webp
const PATH_RE = /^groups\/[0-9a-fA-F-]{36}\/[0-9a-fA-F-]{36}\.webp$/;

const TTL_SECONDS = 6 * 60 * 60;   // signed-url validity window
const REUSE_MS = 30 * 60 * 1000;   // how long we reuse a minted url (well under TTL)
const cache = new Map<string, { url: string; exp: number }>();

export function isDropPhotoPath(v: unknown): v is string {
  return typeof v === "string" && PATH_RE.test(v);
}

// Mint (or reuse) a signed URL for a private drops object. Best-effort: a miss
// or storage error returns null and the caller renders the no-image fallback.
export async function signDropPhoto(
  admin: SupabaseClient,
  path: string,
): Promise<string | null> {
  const now = Date.now();
  const hit = cache.get(path);
  if (hit && hit.exp > now) return hit.url;
  const { data } = await admin.storage.from("drops").createSignedUrl(path, TTL_SECONDS);
  const url = data?.signedUrl ?? null;
  if (url) cache.set(path, { url, exp: now + REUSE_MS });
  return url;
}

// Replace drops-path photo_urls with signed URLs across a list of rows, in place.
// `pick` returns the row's `data` object (handles flat and nested shapes).
// Non-drops urls (external poster/artwork, public curate photos) are left alone.
export async function signPhotos<T>(
  admin: SupabaseClient,
  rows: T[],
  pick: (r: T) => Record<string, unknown> | null | undefined,
): Promise<void> {
  await Promise.all(
    rows.map(async (r) => {
      const d = pick(r);
      const p = d?.["photo_url"];
      if (d && isDropPhotoPath(p)) {
        const signed = await signDropPhoto(admin, p);
        d["photo_url"] = signed; // null on failure → renders fallback color
      }
    }),
  );
}
