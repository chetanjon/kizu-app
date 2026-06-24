import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// Mark a queued item done with a verdict (loved/liked/meh).
// "Landed" = you loved/liked something someone ELSE dropped — the seed of the
// north-star metric. Phase 1 just records it (queryable via items.created_by);
// the explicit recs.landed_at + "it landed" notification arrive in Phase 3/4.
const VERDICTS = ["loved", "liked", "meh"] as const;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const item_id = String(b.item_id ?? "");
  const verdict = String(b.verdict ?? "");
  if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 });
  if (!VERDICTS.includes(verdict as (typeof VERDICTS)[number])) {
    return NextResponse.json({ error: "bad verdict" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("queue_items").select("id").eq("user_id", user.id).eq("item_id", item_id).maybeSingle();
  if (!row) return NextResponse.json({ error: "not in your queue" }, { status: 404 });

  const { error } = await admin
    .from("queue_items")
    .update({ verdict, done_at: new Date().toISOString() })
    .eq("user_id", user.id).eq("item_id", item_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // did this land for whoever dropped it?
  const { data: item } = await admin.from("items").select("created_by").eq("id", item_id).maybeSingle();
  const landed = !!item && item.created_by !== user.id && (verdict === "loved" || verdict === "liked");

  return NextResponse.json({ ok: true, landed });
}
