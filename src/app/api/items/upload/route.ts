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
