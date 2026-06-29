import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { notify } from "@/lib/notify";
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
  const now = new Date().toISOString();
  let landed = false;
  let told: string | null = null; // dropper's name, to show "they'll know it landed"
  if (item_id && good) {
    const { data: item } = await admin.from("items").select("created_by, anon").eq("id", item_id).maybeSingle();
    landed = !!item && item.created_by !== user.id;

    if (landed && row.source_rec_id) {
      // came from a targeted rec → mark it landed + nudge the sender (north-star event).
      const { data: rec } = await admin
        .from("recs").select("from_user, landed_at").eq("id", row.source_rec_id).maybeSingle();
      if (rec && !rec.landed_at) {
        await admin.from("recs").update({ landed_at: now }).eq("id", row.source_rec_id);
        await notify(admin, rec.from_user, "it_landed", "it landed. they loved what you sent.", "/queue");
      }
    } else if (landed) {
      // a GROUP drop you loved → credit the dropper so it counts toward their
      // "took your word for it" number, and tell them. Reuses the recs/landed
      // plumbing: one landed rec from dropper→you, created once (idempotent).
      const dropper = item!.created_by;
      const { data: existing } = await admin
        .from("recs").select("id, landed_at")
        .eq("from_user", dropper).eq("to_user", user.id).eq("item_id", item_id).maybeSingle();
      let credited = false;
      if (!existing) {
        const { error: rerr } = await admin
          .from("recs").insert({ item_id, from_user: dropper, to_user: user.id, landed_at: now });
        credited = !rerr;
      } else if (!existing.landed_at) {
        await admin.from("recs").update({ landed_at: now }).eq("id", existing.id);
        credited = true;
      }
      if (credited) {
        await notify(admin, dropper, "it_landed", "it landed. someone loved what you dropped.", "/you");
        // tell the queuer who'll hear about it — but never unmask an anon drop.
        if (!item!.anon) {
          const { data: who } = await admin.from("users").select("name").eq("id", dropper).maybeSingle();
          told = who?.name ?? null;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, landed, told });
}
