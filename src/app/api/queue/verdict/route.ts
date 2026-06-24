import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// Mark a queued thing done with a verdict (loved/liked/meh). Target is either a
// group item (item_id) or a curate pick (curate_drop_id).
// "Landed" = you loved/liked something someone ELSE dropped (group items only);
// the seed of the north-star metric. Phase 3/4 add the explicit rec + notify.
const VERDICTS = ["loved", "liked", "meh"] as const;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const item_id = b.item_id ? String(b.item_id) : null;
  const curate_drop_id = b.curate_drop_id ? String(b.curate_drop_id) : null;
  const verdict = String(b.verdict ?? "");
  if (!item_id && !curate_drop_id) {
    return NextResponse.json({ error: "item_id or curate_drop_id required" }, { status: 400 });
  }
  if (!VERDICTS.includes(verdict as (typeof VERDICTS)[number])) {
    return NextResponse.json({ error: "bad verdict" }, { status: 400 });
  }

  const admin = createAdminClient();
  const col = item_id ? "item_id" : "curate_drop_id";
  const val = (item_id ?? curate_drop_id)!;

  const { data: row } = await admin
    .from("queue_items").select("id, source_rec_id").eq("user_id", user.id).eq(col, val).maybeSingle();
  if (!row) return NextResponse.json({ error: "not in your queue" }, { status: 404 });

  const { error } = await admin
    .from("queue_items")
    .update({ verdict, done_at: new Date().toISOString() })
    .eq("user_id", user.id).eq(col, val);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const good = verdict === "loved" || verdict === "liked";
  let landed = false;
  if (item_id && good) {
    const { data: item } = await admin.from("items").select("created_by").eq("id", item_id).maybeSingle();
    landed = !!item && item.created_by !== user.id;

    // if this came from a rec, mark it landed (the north-star event).
    if (row.source_rec_id) {
      await admin.from("recs").update({ landed_at: new Date().toISOString() })
        .eq("id", row.source_rec_id).is("landed_at", null);
    }
  }

  return NextResponse.json({ ok: true, landed });
}
