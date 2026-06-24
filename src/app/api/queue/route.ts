import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// Add an item to your queue. Authorize via getUser, verify you can see the item
// (member of its group), write via admin. Idempotent on the (user, item) unique.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const item_id = String(b.item_id ?? "");
  if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 });
  const source = ["group", "curate", "rec", "self"].includes(b.source) ? b.source : "group";

  const admin = createAdminClient();
  const { data: item } = await admin.from("items").select("group_id").eq("id", item_id).maybeSingle();
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: mem } = await admin
    .from("group_members").select("group_id")
    .eq("group_id", item.group_id).eq("user_id", user.id).maybeSingle();
  if (!mem) return NextResponse.json({ error: "not a member of that group" }, { status: 403 });

  const { error } = await admin
    .from("queue_items")
    .insert({ user_id: user.id, item_id, source });
  // unique_violation = already queued; treat as success.
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, queued: true });
}

// Remove an item from your queue.
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const item_id = String(b.item_id ?? "");
  if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("queue_items").delete().eq("user_id", user.id).eq("item_id", item_id);
  return NextResponse.json({ ok: true, queued: false });
}
