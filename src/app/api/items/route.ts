import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createRec } from "@/lib/recs";
import { isDropPhotoPath } from "@/lib/drop-photos";
import { NextResponse } from "next/server";

// Create a drop. Authorize via getUser, verify group membership, write via admin.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const group_id = String(b.group_id ?? "");
  const type = String(b.type ?? "");
  if (!group_id) return NextResponse.json({ error: "group_id required" }, { status: 400 });
  if (!["watch", "listen", "go_out"].includes(type)) {
    return NextResponse.json({ error: "bad type" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: mem } = await admin
    .from("group_members").select("group_id")
    .eq("group_id", group_id).eq("user_id", user.id).maybeSingle();
  if (!mem) return NextResponse.json({ error: "not a member of that group" }, { status: 403 });

  const rating_style = ["number", "stars", "word"].includes(b.rating_style) ? b.rating_style : null;
  const note = b.note ? String(b.note).slice(0, 200) : null;
  const rating_value = b.rating_value ? String(b.rating_value).slice(0, 40) : null;

  const data: Record<string, unknown> = (b.data && typeof b.data === "object") ? b.data : {};
  // Harden: a photo_url on ANY drop type, if present, must be an object WE stored
  // in THIS group's drops bucket. Blocks "skip the upload route, point photo_url
  // at anything" (XSS/IDOR/SSRF/hotlink) — including non-go_out drops via the API.
  {
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
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // optional: drop this FOR a specific group member (rec-as-invite).
  let recUrl: string | null = null;
  const rec_to = b.rec_to ? String(b.rec_to) : null;
  if (rec_to && rec_to !== user.id) {
    const { data: rmem } = await admin
      .from("group_members").select("group_id")
      .eq("group_id", group_id).eq("user_id", rec_to).maybeSingle();
    if (rmem) {
      const rec = await createRec(admin, user.id, item.id, rec_to);
      if (rec) recUrl = `/r/${rec.token}`;
    }
  }

  return NextResponse.json({ id: item.id, recUrl });
}

// Delete your own drop.
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const id = String(b.id ?? "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: item } = await admin.from("items").select("created_by, data").eq("id", id).maybeSingle();
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (item.created_by !== user.id) return NextResponse.json({ error: "not yours" }, { status: 403 });

  await admin.from("items").delete().eq("id", id);

  // best-effort: remove the stored photo so deleted drops don't orphan files
  const p = (item.data as Record<string, unknown> | null)?.["photo_url"];
  if (isDropPhotoPath(p)) await admin.storage.from("drops").remove([p]);

  return NextResponse.json({ ok: true });
}
