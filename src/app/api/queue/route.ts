import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// Add to your queue. Target is EITHER a group item (item_id, must be visible to
// you) OR a curate pick (curate_drop_id, must be published). Authorize via
// getUser, write via admin. Idempotent on the per-target unique.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const item_id = b.item_id ? String(b.item_id) : null;
  const curate_drop_id = b.curate_drop_id ? String(b.curate_drop_id) : null;
  if (!item_id && !curate_drop_id) {
    return NextResponse.json({ error: "item_id or curate_drop_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  let row: { user_id: string; item_id?: string; curate_drop_id?: string; source: string };

  if (item_id) {
    const { data: item } = await admin.from("items").select("group_id, created_by").eq("id", item_id).maybeSingle();
    if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
    // You can always re-queue your OWN item (e.g. "revisit" from the log deck),
    // even if you've since left its group. Otherwise you must be a member.
    if (item.created_by !== user.id) {
      const { data: mem } = await admin
        .from("group_members").select("group_id")
        .eq("group_id", item.group_id).eq("user_id", user.id).maybeSingle();
      if (!mem) return NextResponse.json({ error: "not a member of that group" }, { status: 403 });
    }
    row = { user_id: user.id, item_id, source: "group" };
  } else {
    const { data: cd } = await admin
      .from("curate_drops").select("id").eq("id", curate_drop_id!).eq("published", true).maybeSingle();
    if (!cd) return NextResponse.json({ error: "not found" }, { status: 404 });
    row = { user_id: user.id, curate_drop_id: curate_drop_id!, source: "curate" };
  }

  const { error } = await admin.from("queue_items").insert(row);
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, queued: true });
}

// Remove from your queue (by either target).
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const item_id = b.item_id ? String(b.item_id) : null;
  const curate_drop_id = b.curate_drop_id ? String(b.curate_drop_id) : null;
  if (!item_id && !curate_drop_id) {
    return NextResponse.json({ error: "item_id or curate_drop_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const q = admin.from("queue_items").delete().eq("user_id", user.id);
  await (item_id ? q.eq("item_id", item_id) : q.eq("curate_drop_id", curate_drop_id!));
  return NextResponse.json({ ok: true, queued: false });
}
