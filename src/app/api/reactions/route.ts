import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { REACTIONS } from "@/lib/reactions";
import { NextResponse } from "next/server";

const ALLOWED: readonly string[] = REACTIONS;

// Toggle a reaction on an item.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const item_id = String(b.item_id ?? "");
  const emoji = String(b.emoji ?? "");
  if (!item_id || !ALLOWED.includes(emoji)) return NextResponse.json({ error: "bad input" }, { status: 400 });

  const admin = createAdminClient();
  const { data: item } = await admin.from("items").select("group_id").eq("id", item_id).maybeSingle();
  if (!item) return NextResponse.json({ error: "no item" }, { status: 404 });
  const { data: mem } = await admin
    .from("group_members").select("group_id").eq("group_id", item.group_id).eq("user_id", user.id).maybeSingle();
  if (!mem) return NextResponse.json({ error: "not a member" }, { status: 403 });

  const { data: existing } = await admin
    .from("reactions").select("emoji")
    .eq("item_id", item_id).eq("user_id", user.id).eq("emoji", emoji).maybeSingle();

  if (existing) {
    await admin.from("reactions").delete().eq("item_id", item_id).eq("user_id", user.id).eq("emoji", emoji);
    return NextResponse.json({ active: false });
  }
  await admin.from("reactions").insert({ item_id, user_id: user.id, emoji });
  return NextResponse.json({ active: true });
}
