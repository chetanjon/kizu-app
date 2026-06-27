# kizu — Photo upload for outside drops

**Date:** 2026-06-27
**Status:** approved, building

## Goal

Let a group member add **one optional photo from their phone** (gallery or camera) when dropping an **outside** (`go_out`) place into the group, so the feed shows "where I went," not just the place name. Today `drop-composer.tsx:98` hardcodes `photo_url: null`; the `data` JSONB, `item-render.ts` (poster → artwork → photo fallback), and the feed already know how to render a `photo_url`, so this is mostly wiring + a secure upload path.

Out of scope: photos on movies/music drops (they auto-fetch poster/album art); multiple photos per drop; pasting an image URL; editing a photo after drop; albums/galleries.

## Decisions (locked)

- **Outside tab only**, one optional photo per drop.
- **Private storage**, not public. New private `drops` bucket; group members view via short-lived **signed URLs**. Fits kizu's private-group-first identity and limits blast radius if a URL leaks.
- **Server-side re-encode is mandatory** (security, not optimization): every upload is decoded + re-encoded with `sharp` (already a dependency) → strips all EXIF/GPS/metadata, neutralizes SVG/polyglot/malware payloads, normalizes format.
- **Downscale to ~1600px webp, ≤5MB**, with a decompression-bomb guard (`sharp` `limitInputPixels`). Invisible quality loss at card display size; ~15–20× more storage runway (~3,000–4,000 photos vs ~200 full-res on the free 1GB tier).
- **Write-path hardening:** `/api/items` must reject any `photo_url`/path that isn't inside our `drops` bucket under the user's own group. The upload route's protections are worthless if the write route trusts arbitrary client-supplied URLs.
- **Direct file upload only** — no "paste a URL" field (avoids SSRF / external XSS / hotlinking).
- **Lifecycle:** deleting a drop deletes its photo; uploads are tied to a group the user belongs to.
- **Stay on Supabase free tier.** Storage abstracted behind our own code so the documented fallback — **Cloudflare R2** (free, 10GB, zero egress) — is a cheap swap if we ever approach the cap. No new paid service. ($0 budget honored.)

## Architecture

### Storage — migration `supabase/migrations/20260627_drops_storage.sql`
- Create **private** bucket `drops` (mirrors `20260623_p2_curate_storage.sql` but `public = false`), 5MB limit, `allowed_mime_types` = jpeg/png/webp (no SVG, no HEIC at the bucket layer — see HEIC note).
- No table changes: photo lives in `items.data.photo_url` (the bucket-relative **path**, e.g. `groups/{group_id}/{uuid}.webp` — not a public URL, since the bucket is private).
- RLS: reads/writes happen via the service-role admin client in routes (same pattern as the rest of the app), so no end-user storage policies are required; the bucket stays private and is only reached through authorized routes + signed URLs.
- Applied by the user in the Supabase SQL editor.

**HEIC note:** iPhones often shoot HEIC, which most browsers can't display. In practice iOS Safari converts HEIC → JPEG when a photo is chosen via a file input, so the server usually receives JPEG. We don't store HEIC regardless (output is always webp). If `sharp`'s Vercel build can't decode an incoming HEIC, the pipeline throws → graceful `400 "couldn't read that image — try a different photo"` rather than storing something undisplayable. HEIC is excluded from the bucket allowlist because we only ever upload the re-encoded webp anyway.

### Upload — `POST /api/items/upload`
Modeled on `/api/curate/upload`, but **group-membership-gated** instead of founder-gated:
1. `getUser()`; read `group_id` from the multipart form; verify the user is a **member of that group** (same membership check used in `/api/items`). Else `403`.
2. Read `file` from `formData`; reject if not a `File`, or raw size > 5MB.
3. **`sharp` pipeline** (the security core): `sharp(buffer, { limitInputPixels: 24_000_000 })` (≈24MP bomb guard) → `.rotate()` (apply orientation, then drop EXIF) → `.resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })` → `.webp({ quality: 80 })` → output buffer. A throw here = invalid/hostile image → `400 "couldn't read that image"`. Re-encoding strips all metadata (incl. GPS) by default.
4. Upload the re-encoded buffer to `drops` at `groups/{group_id}/{crypto.randomUUID()}.webp` via `createAdminClient()`, `contentType: "image/webp"`, `upsert: false`.
5. Return `{ path }` (the bucket-relative path), **not** a public URL.

### Write path — harden `src/app/api/items/route.ts`
- If `data.photo_url` is present for a `go_out` drop, validate it is a string matching `groups/{group_id}/<uuid>.webp` for **the same `group_id` being written** (prefix + shape check). Anything else → strip it or `400`. This closes the "skip the upload route, set any URL" bypass.

### Delete path — extend item deletion
- Wherever an item is deleted, if `data.photo_url` is set, `admin.storage.from("drops").remove([path])` (best-effort; failure logged, not fatal). Prevents orphan accumulation. (If no item-delete route exists yet, add the cleanup at the point one is introduced and note it here.)

### Read path — signed URLs
- Add a small helper (e.g. in `item-render.ts` or a server util) that, for a `go_out` item with a `photo_url` path, calls `admin.storage.from("drops").createSignedUrl(path, <ttl>)` for group members rendering the feed. TTL short enough to limit a leak window, long enough for the page session (e.g. 1 hour). Server-side only; the service-role key never reaches the client.

### Composer UI — `src/components/drop-composer.tsx`
- In the `go_out` branch (under the subtype pills / music-vibe input): file picker mirroring `curate-admin.tsx:149–156` — a labeled button + hidden `<input type="file" accept="image/*">` (gallery **or** camera; no forced `capture`).
- New state: `photoPath` (uploaded path), `photoPreview` (local object URL for instant preview), `uploadingPhoto`.
- On select: optional client-side downscale for snappy upload + to dodge the 5MB rejection, then `FormData` (`file` + `group_id`) → `POST /api/items/upload` → store returned `path` in `photoPath`; show preview thumbnail + a "remove" button. Errors surface in the existing `msg` line.
- In `drop()`: set `data.photo_url = photoPath || null` for `go_out` (replacing the hardcoded `null`). All other tabs unchanged.

### Rate limiting
- Basic per-user upload throttle (e.g. N uploads / minute) in the upload route to blunt storage-quota abuse. Lightweight; in-memory or a simple Supabase check — sized for ~50 friends, not a public service.

### Capacity guard
- Graceful "couldn't add photo" message if storage is full (upload returns an error rather than crashing). Optional: a tiny usage check to warn the founder near ~80% of the free tier. Documented R2 fallback (free, 10×) when needed.

## Security threat model (summary)

| # | Risk | Mitigation |
|---|------|-----------|
| 1 | Any logged-in user uploads to any group | Membership check on `group_id` in upload route |
| 2 | Bypass upload route, set `data.photo_url` to arbitrary/foreign URL | `/api/items` validates path is in `drops` under the user's group |
| 3 | SVG/polyglot stored XSS; spoofed type/extension | `sharp` decode + re-encode to webp; SVG/HEIC excluded at bucket layer |
| 4 | EXIF **GPS/location leak** from "where I went" photos | Re-encode strips all metadata by default |
| 5 | Storage-quota / cost DoS; decompression bomb | 5MB cap + downscale + `limitInputPixels` + per-user rate limit |
| 6 | Path traversal / collisions | Server-generated `randomUUID` path + derived `.webp` ext; `upsert:false` |
| 7 | Orphaned files | Delete photo on item delete; upload tied to a real group |
| 8 | SSRF / hotlinking via URL paste | No URL-paste field; direct upload only |
| 9 | Leaked image URL viewable forever | Private bucket + short-lived signed URLs (members only) |
| 10 | Illegal/abusive user content (founder liability, F-1) | Fast delete path; policy-level awareness (not engineered away) |

## Deploy prerequisites (user actions, I'll guide with exact values)
1. Apply `20260627_drops_storage.sql` in the Supabase SQL editor.
2. Confirm `sharp` resolves on Vercel (it's already a dep used server-side).
Then push to deploy. (No new env vars; no new paid service.)

## Verification
- `npm run build` + `tsc` clean.
- Upload a real phone photo on the outside tab → preview appears → drop → photo renders in the feed via signed URL.
- **EXIF check:** upload a GPS-tagged photo; confirm the stored object has no GPS/metadata.
- **Security checks:** rename a `.svg`/`.html` to `.jpg` and upload → rejected (sharp throws); POST `/api/items` with a `photo_url` pointing outside the bucket / at another group → rejected; non-member POST to `/api/items/upload` → 403.
- Oversized (>5MB) and giant-dimension (bomb) images → rejected gracefully.
- Delete a drop with a photo → storage object removed.
- Signed URL expires after TTL; non-members can't fetch the raw object.
- Movies/music tabs unchanged (no photo field).
