# Outside-Drop Photo Upload — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a group member attach one optional photo from their phone (gallery or camera) when dropping an outside (`go_out`) place, stored privately and rendered fast across the feed.

**Architecture:** Photos upload through a new membership-gated route that re-encodes via `sharp` (strips EXIF/GPS, neutralizes SVG/malware, downscales to ~1600px webp) into a **private** `drops` bucket. The bucket-relative path is stored in `items.data.photo_url`; read surfaces convert that path → a short-lived, memoized signed URL server-side before render. The write route validates any incoming `photo_url` belongs to the user's own group; deleting a drop deletes its photo.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase (Storage + service-role admin client), `sharp` (already a dependency), Tailwind v4.

## Global Constraints

- **Budget = $0.** No new paid services, no new npm dependencies (`sharp` already present). — verbatim from CLAUDE.md.
- **Auth/write pattern:** authorize with `getUser()` + a `group_members` membership check, then write via `createAdminClient()` (service role); set `created_by`/owner from the verified user. Route-handler writes with the user client hit `new row violates RLS`.
- **No test framework in this repo** (TS + ESLint only). Per CLAUDE.md ("small commits, frequent verification"; "ask before adding dependencies"), the per-task verify cycle is **`npx tsc --noEmit`** (and `npm run build` at integration points) **+ the manual check stated in the task** — NOT a unit-test runner. Do not add jest/vitest/playwright.
- **Styling:** Tailwind utility classes inline using existing tokens (`bg-paper`, `text-ink`, `bg-ink`, `text-paper`, `border-ink`, `text-red`, `font-h/b/m`). No raw hexes, no new CSS files.
- **RED `#FF2E4D` is reserved** for the `kizu.` wordmark dot only — never use `text-red`/`bg-red` for buttons/fills; it's fine only for the tiny "remove" text link (matches the existing curate-admin pattern).
- **Do not push/deploy.** The plan ends at local commits + verification. Applying the SQL migration and any deploy are user-authorized actions.

---

### Task 1: Private `drops` storage bucket

Creates the private bucket photos live in. Like `20260623_p2_curate_storage.sql` but `public = false`. The bucket is reached only through server routes (service-role) + signed URLs, so no end-user storage RLS policies are needed.

**Files:**
- Create: `supabase/migrations/20260627_drops_storage.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: User applies the migration**

This is a deploy prerequisite (DB change), like prior storage migrations. Tell the user:
> "Apply `supabase/migrations/20260627_drops_storage.sql` in the Supabase SQL editor (project `undcbbwiytfzquriwwqx`), then confirm a private bucket named `drops` exists under Storage."

Do not proceed to runtime testing of uploads until confirmed. (Code can still be written; uploads will 400 until the bucket exists.)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260627_drops_storage.sql
git commit -m "feat: private drops storage bucket for outside-drop photos"
```

---

### Task 2: Signed-URL read helper

Central helper that recognizes a `drops` path and converts it to a memoized signed URL. Keeps "private" from meaning "slow": a generated URL is reused for ~30 min so the browser/HTTP layer caches the bytes.

**Files:**
- Create: `src/lib/drop-photos.ts`

**Interfaces:**
- Produces:
  - `isDropPhotoPath(v: unknown): v is string` — true only for `groups/<uuid>/<uuid>.webp`.
  - `signDropPhoto(admin: SupabaseClient, path: string): Promise<string | null>` — memoized signed URL.
  - `signPhotos<T>(admin: SupabaseClient, rows: T[], pick: (r: T) => Record<string, unknown> | null | undefined): Promise<void>` — in-place: replaces each row's `data.photo_url` with a signed URL when it's a drops path.

- [ ] **Step 1: Write the helper**

```typescript
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors referencing `src/lib/drop-photos.ts`.

- [ ] **Step 3: Sanity-check the path regex (manual, no test runner)**

Run:
```bash
node -e "const re=/^groups\/[0-9a-fA-F-]{36}\/[0-9a-fA-F-]{36}\.webp$/; console.log(re.test('groups/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222.webp'), re.test('https://evil.com/x.svg'), re.test('groups/abc/x.webp'))"
```
Expected: `true false false`

- [ ] **Step 4: Commit**

```bash
git add src/lib/drop-photos.ts
git commit -m "feat: signed-url helper for private drop photos"
```

---

### Task 3: Membership-gated upload route

The security core. Re-encodes every upload through `sharp` (strips EXIF/GPS, kills SVG/polyglot), downscales to 1600px webp, stores in the private `drops` bucket, returns the path + dimensions. Best-effort per-user rate limit.

**Files:**
- Create: `src/app/api/items/upload/route.ts`

**Interfaces:**
- Consumes: `createClient` (`@/lib/supabase-server`), `createAdminClient` (`@/lib/supabase-admin`), `sharp`.
- Produces: `POST` → `200 { path: string, width: number, height: number }` on success; `400/401/403/429` JSON `{ error }` otherwise. `path` matches `isDropPhotoPath`.

- [ ] **Step 1: Write the route**

```typescript
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs"; // sharp needs the Node runtime, not edge

// best-effort per-user rate limit (per server instance; sized for ~50 friends)
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
function rateLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) { hits.set(userId, arr); return true; }
  arr.push(now); hits.set(userId, arr); return false;
}

// Upload one photo for an outside (go_out) drop. Group-membership gated.
// Re-encodes via sharp → strips EXIF/GPS, neutralizes SVG/polyglot, downscales
// to 1600px webp → stores in the PRIVATE `drops` bucket → returns the path.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (rateLimited(user.id)) return NextResponse.json({ error: "slow down a sec" }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const group_id = String(form?.get("group_id") ?? "");
  const file = form?.get("file");
  if (!group_id) return NextResponse.json({ error: "group_id required" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "too big (5mb max)" }, { status: 400 });

  const admin = createAdminClient();
  const { data: mem } = await admin
    .from("group_members").select("group_id")
    .eq("group_id", group_id).eq("user_id", user.id).maybeSingle();
  if (!mem) return NextResponse.json({ error: "not a member of that group" }, { status: 403 });

  let out: Buffer, width: number, height: number;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const { data, info } = await sharp(input, { limitInputPixels: 24_000_000 }) // ~24MP bomb guard
      .rotate()                                                                  // apply orientation, then drop EXIF
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    out = data; width = info.width; height = info.height;
  } catch {
    return NextResponse.json({ error: "couldn't read that image — try a different photo" }, { status: 400 });
  }

  const path = `groups/${group_id}/${crypto.randomUUID()}.webp`;
  const { error } = await admin.storage.from("drops").upload(path, out, {
    contentType: "image/webp",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ path, width, height });
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors. (If TS complains `out` is used before assignment, it won't — every catch path returns.)

- [ ] **Step 3: Verify the build picks up the route**

Run: `npm run build`
Expected: build succeeds and lists `/api/items/upload` among the routes.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/items/upload/route.ts
git commit -m "feat: group-gated photo upload route with sharp re-encode"
```

---

### Task 4: Harden `/api/items` (write validation + delete cleanup)

Closes the bypass where a client skips the upload route and sets `data.photo_url` to any URL, and deletes the stored photo when its drop is deleted.

**Files:**
- Modify: `src/app/api/items/route.ts`

**Interfaces:**
- Consumes: `isDropPhotoPath` from `@/lib/drop-photos`.

- [ ] **Step 1: Import the guard**

At the top of `src/app/api/items/route.ts`, add to the imports (after the existing `createRec` import on line 3):

```typescript
import { isDropPhotoPath } from "@/lib/drop-photos";
```

- [ ] **Step 2: Validate photo_url on write (POST)**

In `POST`, replace the existing insert's `data` handling. Find (around lines 30-42):

```typescript
  const { data: item, error } = await admin
    .from("items")
    .insert({
      group_id,
      created_by: user.id,
      type,
      rating_value,
      rating_style,
      note,
      data: (b.data && typeof b.data === "object") ? b.data : {},
    })
    .select("id")
    .single();
```

Replace with:

```typescript
  const data: Record<string, unknown> = (b.data && typeof b.data === "object") ? b.data : {};
  // Harden: a go_out photo_url, if present, must be an object WE stored in THIS group.
  // Blocks "skip the upload route, point photo_url at anything" (XSS/IDOR/SSRF).
  if (type === "go_out") {
    const p = data["photo_url"];
    if (p != null && !(isDropPhotoPath(p) && p.startsWith(`groups/${group_id}/`))) {
      return NextResponse.json({ error: "bad photo" }, { status: 400 });
    }
  }

  const { data: item, error } = await admin
    .from("items")
    .insert({
      group_id,
      created_by: user.id,
      type,
      rating_value,
      rating_style,
      note,
      data,
    })
    .select("id")
    .single();
```

- [ ] **Step 3: Delete the photo when the drop is deleted (DELETE)**

In `DELETE`, find (around lines 72-77):

```typescript
  const { data: item } = await admin.from("items").select("created_by").eq("id", id).maybeSingle();
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (item.created_by !== user.id) return NextResponse.json({ error: "not yours" }, { status: 403 });

  await admin.from("items").delete().eq("id", id);
  return NextResponse.json({ ok: true });
```

Replace with:

```typescript
  const { data: item } = await admin.from("items").select("created_by, data").eq("id", id).maybeSingle();
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (item.created_by !== user.id) return NextResponse.json({ error: "not yours" }, { status: 403 });

  await admin.from("items").delete().eq("id", id);

  // best-effort: remove the stored photo so deleted drops don't orphan files
  const p = (item.data as Record<string, unknown> | null)?.["photo_url"];
  if (isDropPhotoPath(p)) await admin.storage.from("drops").remove([p]);

  return NextResponse.json({ ok: true });
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/items/route.ts
git commit -m "feat: validate drop photo_url on write, delete photo on drop delete"
```

---

### Task 5: Composer photo UI

Adds the photo picker to the outside tab only: instant local preview, background upload with client-side downscale (snappy + dodges the 5MB reject), remove button, and wiring `photo_url`/dimensions into the drop.

**Files:**
- Modify: `src/components/drop-composer.tsx`

- [ ] **Step 1: Add photo state**

After the `musicNote` state (line 33: `const [musicNote, setMusicNote] = useState("");`), add:

```typescript
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDim, setPhotoDim] = useState<{ w: number; h: number } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
```

- [ ] **Step 2: Clear photo state on tab switch**

In `reset()` (line 39), add the photo resets:

```typescript
  function reset() { setQ(""); setPicked(null); setResults(null); setMsg(""); setPhotoPath(null); setPhotoPreview(null); setPhotoDim(null); }
```

- [ ] **Step 3: Add the downscale + upload helpers**

Immediately after `reset()` (before `onInput`), add:

```typescript
  // Shrink large photos in the browser before upload: faster upload + avoids the
  // 5MB server reject. Server still re-encodes authoritatively (EXIF strip etc.).
  async function downscale(file: File, max = 1600): Promise<File> {
    if (!file.type.startsWith("image/")) return file;
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      if (scale === 1 && file.size < 2 * 1024 * 1024) return file;
      const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bmp, 0, 0, w, h);
      const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.85));
      return blob ? new File([blob], "photo.webp", { type: "image/webp" }) : file;
    } catch { return file; } // HEIC/unsupported → send original, server handles it
  }

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true); setMsg("");
    setPhotoPreview(URL.createObjectURL(file)); // instant local preview, no network wait
    const fd = new FormData();
    fd.append("file", await downscale(file));
    fd.append("group_id", groupId);
    const res = await fetch("/api/items/upload", { method: "POST", body: fd });
    const j = await res.json();
    if (res.ok) { setPhotoPath(j.path); setPhotoDim({ w: j.width, h: j.height }); }
    else { setMsg(j.error || "couldn't add photo"); setPhotoPreview(null); }
    setUploadingPhoto(false);
  }

  function removePhoto() { setPhotoPath(null); setPhotoPreview(null); setPhotoDim(null); }
```

- [ ] **Step 4: Wire photo into the go_out drop payload**

In `drop()`, replace the `go_out` data line (line 98):

```typescript
      data = { place_name: name, subtype, music_note: musicNote.trim() || null, photo_url: null };
```

with:

```typescript
      data = {
        place_name: name, subtype, music_note: musicNote.trim() || null,
        photo_url: photoPath,
        ...(photoDim ? { photo_w: photoDim.w, photo_h: photoDim.h } : {}),
      };
```

- [ ] **Step 5: Add the picker UI to the outside tab**

In the `go_out` branch JSX, after the closing of the music-vibe `{["bar","brewery","pub"].includes(subtype) && ( ... )}` block (line 165) and before the closing `</div>` of that branch (line 166), insert:

```tsx
          <div className="flex items-center gap-3 mt-1">
            {photoPreview
              ? <img src={photoPreview} alt="" className="w-16 h-16 rounded-lg border-[2.5px] border-ink object-cover" />
              : <div className="w-16 h-16 rounded-lg border-[2.5px] border-dashed border-ink flex-none" />}
            <label className="font-h font-bold text-sm bg-ink text-paper border-[2.5px] border-ink rounded-xl px-4 py-2 cursor-pointer whitespace-nowrap">
              {uploadingPhoto ? "uploading…" : photoPreview ? "change photo" : "add a photo"}
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
            </label>
            {photoPreview && <button type="button" onClick={removePhoto} className="font-m text-xs text-red">remove</button>}
          </div>
```

(`accept="image/*"` with no `capture` → the OS offers gallery *and* camera, per the gallery requirement.)

- [ ] **Step 6: Verify it compiles + builds**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors; build succeeds.

- [ ] **Step 7: Manual check (dev server)**

Run: `npm run dev`, open `/drop`, switch to the **outside** tab. Expected: a dashed photo placeholder + "add a photo" button appear under the subtype/music inputs; movies/music tabs show **no** photo field. Picking an image shows an instant preview and the button reads "uploading…" then settles. (Full upload success requires the bucket from Task 1.)

- [ ] **Step 8: Commit**

```bash
git add src/components/drop-composer.tsx
git commit -m "feat: photo picker on outside drops (preview, client downscale, upload)"
```

---

### Task 6: Render photos via signed URLs across surfaces

Converts stored `drops` paths → signed URLs on every surface that shows items, and makes the Home feed image load lazily without layout shift. Without this, go_out photos render as broken images (a path is not a URL).

**Files:**
- Modify: `src/app/(app)/home/page.tsx`
- Modify: `src/app/(app)/queue/page.tsx`
- Modify: `src/app/(app)/tonight/page.tsx`
- Modify: `src/app/r/[token]/page.tsx`

**Interfaces:**
- Consumes: `signPhotos`, `createAdminClient`.

- [ ] **Step 1: Sign photos on the Home feed**

In `src/app/(app)/home/page.tsx`, add imports near the top (alongside the existing imports):

```typescript
import { createAdminClient } from "@/lib/supabase-admin";
import { signPhotos } from "@/lib/drop-photos";
```

Right after the line that builds the typed items array (line 62: `const items = (iRaw ?? []) as unknown as Item[];`), add:

```typescript
  await signPhotos(createAdminClient(), items, (it) => it.data as Record<string, unknown>);
```

- [ ] **Step 2: Lazy, shift-free Home image**

In the same file, find the feed image (line 109):

```tsx
                <img src={cover} alt="" className="w-full h-full object-cover" />
```

Replace with:

```tsx
                <img src={cover} alt="" loading="lazy" decoding="async"
                  width={Number((it.data as Record<string, unknown>)?.["photo_w"]) || undefined}
                  height={Number((it.data as Record<string, unknown>)?.["photo_h"]) || undefined}
                  className="w-full h-full object-cover" />
```

- [ ] **Step 3: Sign photos on the Queue page**

In `src/app/(app)/queue/page.tsx` (the server component that fetches `queue_items` and passes them to `queue-client`), add the imports:

```typescript
import { createAdminClient } from "@/lib/supabase-admin";
import { signPhotos } from "@/lib/drop-photos";
```

After the queue rows are fetched into their array variable (the `.from("queue_items").select(...)` result; the nested item is under `items`), add — using the nested picker:

```typescript
  await signPhotos(createAdminClient(), rows, (r) => (r as { items?: { data?: Record<string, unknown> } }).items?.data);
```

Replace `rows` with the actual variable name holding the fetched array in that file. (Curate-queue entries use the public `curate` bucket; `isDropPhotoPath` skips them, so this is safe.)

- [ ] **Step 4: Sign photos on the Tonight page**

In `src/app/(app)/tonight/page.tsx` (server component feeding `tonight-dealer`), add the same two imports, then after the items are fetched (flat `data` shape, like Home), add:

```typescript
  await signPhotos(createAdminClient(), items, (it) => (it as { data?: Record<string, unknown> }).data);
```

Replace `items` with the actual fetched-array variable name in that file.

- [ ] **Step 5: Sign the photo on the /r/[token] page**

In `src/app/r/[token]/page.tsx`, add the same two imports. The rec row nests the item under `items`. After the rec row is fetched (single object, e.g. `rec`), add:

```typescript
  if (rec) await signPhotos(createAdminClient(), [rec], (r) => (r as { items?: { data?: Record<string, unknown> } }).items?.data);
```

Replace `rec` with the actual variable name holding the fetched rec row.

- [ ] **Step 6: Verify it compiles + builds**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors; build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(app\)/home/page.tsx src/app/\(app\)/queue/page.tsx src/app/\(app\)/tonight/page.tsx src/app/r/\[token\]/page.tsx
git commit -m "feat: render private drop photos via signed urls; lazy home images"
```

---

### Task 7: End-to-end + security verification

Runs the spec's verification checklist against the running app. Requires the `drops` bucket from Task 1 to be applied. No code unless a check fails (then fix in the relevant task's files and re-commit).

**Files:** none (verification task).

- [ ] **Step 1: Build is clean**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed, no errors.

- [ ] **Step 2: Happy path**

`npm run dev` → `/drop` → outside tab → name a place, pick a real phone photo → preview appears → drop it. Expected: redirect to `/home`; the card shows the photo (loaded via a `…/storage/v1/object/sign/…` signed URL — check the network tab / `<img src>`).

- [ ] **Step 3: EXIF/GPS is stripped**

Upload a photo known to contain GPS EXIF. Download the stored object (from the Supabase Storage UI) and inspect:
```bash
# macOS: mdls shows no GPS; or use exiftool if installed
exiftool ~/Downloads/<stored>.webp | grep -i gps || echo "no GPS — good"
```
Expected: no GPS/metadata (sharp re-encode strips it).

- [ ] **Step 4: Malicious-file rejection**

Rename an `.svg` or `.html` file to `photo.jpg` and upload via the outside tab. Expected: "couldn't read that image — try a different photo" (sharp throws on non-raster); nothing stored.

- [ ] **Step 5: Write-path bypass rejected**

With a logged-in session, POST directly to `/api/items` with `type: "go_out"` and `data.photo_url` set to (a) an external URL and (b) a path under a *different* group id. Example:
```bash
curl -i -X POST http://localhost:3000/api/items -H 'Content-Type: application/json' \
  --cookie "<your dev session cookies>" \
  -d '{"group_id":"<your-group>","type":"go_out","data":{"place_name":"x","photo_url":"https://evil.com/a.svg"}}'
```
Expected: `400 {"error":"bad photo"}` for both.

- [ ] **Step 6: Membership gate on upload**

POST to `/api/items/upload` with a `group_id` the user does not belong to. Expected: `403 {"error":"not a member of that group"}`. Unauthenticated → `401`.

- [ ] **Step 7: Oversized + bomb rejection**

Upload a >5MB file (after disabling client downscale, or via curl). Expected: `400 "too big (5mb max)"`. A pixel-bomb (huge dimensions, tiny bytes) → `400 "couldn't read that image…"` (limitInputPixels).

- [ ] **Step 8: Delete removes the photo**

Delete a go_out drop that has a photo (the card's delete button). Expected: `{ ok: true }`; the object is gone from the `drops` bucket in the Supabase Storage UI.

- [ ] **Step 9: Other surfaces + unchanged tabs**

Confirm the photo also renders on Queue, Tonight, and a `/r/<token>` link for that drop. Confirm movies/music drops still show poster/album art and have no photo field. Confirm the Curate river still renders (its public-bucket photos untouched).

- [ ] **Step 10: Final summary**

Report pass/fail per check. If all pass, the feature is complete and ready for the user to decide on deploy (apply migration to prod project if not already + push). Do not push/deploy without explicit user say-so.

---

## Self-Review

**Spec coverage:**
- Private `drops` bucket → Task 1 ✓
- `sharp` re-encode (EXIF strip, SVG kill, 1600px webp, pixel-bomb guard) → Task 3 ✓
- Membership-gated upload route returning path+dims → Task 3 ✓
- Write-path `photo_url` validation → Task 4 ✓
- Delete-on-delete cleanup → Task 4 ✓
- Composer UI (gallery/camera, preview, remove, client downscale) → Task 5 ✓
- Signed-URL read path + memoization → Task 2 + Task 6 ✓
- Performance (small webp, memoized signed urls, lazy/dimensioned imgs, instant preview, bounded feed) → Tasks 2/5/6 ✓
- Rate limiting → Task 3 ✓
- Capacity guard (graceful upload failure) → upload route returns error JSON; composer surfaces it (Task 5) ✓
- R2 fallback → documented in spec (no code now; storage hidden behind helper keeps the swap cheap) ✓
- Security threat-model checks → Task 7 ✓

**Placeholder scan:** No TBD/TODO. Tasks 6.3–6.5 intentionally say "replace `rows`/`items`/`rec` with the actual variable name" — the surrounding files weren't fully read; this is an explicit, bounded lookup, not a vague instruction, and the exact snippet + picker shape are given.

**Type consistency:** `isDropPhotoPath`, `signDropPhoto`, `signPhotos` signatures match between Task 2 (definition) and Tasks 4/6 (use). Upload returns `{ path, width, height }` (Task 3) consumed as `j.path/j.width/j.height` (Task 5). `data.photo_w/photo_h` written (Task 5) and read (Task 6.2) match.
