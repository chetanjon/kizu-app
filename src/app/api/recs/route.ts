import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createRec } from "@/lib/recs";
import { NextResponse } from "next/server";

// Recommend an item to someone (or generate a shareable link). Authorize via
// getUser, verify you can see the item, create the rec via admin.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const item_id = String(b.item_id ?? "");
  const to_user = b.to_user ? String(b.to_user) : null;
  if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 });

  const admin = createAdminClient();

  // you must be a member of the item's group to recommend it.
  const { data: item } = await admin.from("items").select("group_id").eq("id", item_id).maybeSingle();
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { data: mem } = await admin
    .from("group_members").select("group_id")
    .eq("group_id", item.group_id).eq("user_id", user.id).maybeSingle();
  if (!mem) return NextResponse.json({ error: "not a member of that group" }, { status: 403 });

  // if a recipient is named, they must share the group (member rec).
  if (to_user) {
    const { data: rmem } = await admin
      .from("group_members").select("group_id")
      .eq("group_id", item.group_id).eq("user_id", to_user).maybeSingle();
    if (!rmem) return NextResponse.json({ error: "recipient not in that group" }, { status: 400 });
  }

  const rec = await createRec(admin, user.id, item_id, to_user);
  if (!rec) return NextResponse.json({ error: "could not create rec" }, { status: 400 });

  return NextResponse.json({ token: rec.token, url: `/r/${rec.token}` });
}
