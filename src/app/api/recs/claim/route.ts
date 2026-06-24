import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// After a non-member signs up from /r/<token>, attach the rec to their queue.
// Claims the rec (sets to_user if it was an open link) and queues the item.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const token = String(b.token ?? "");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: rec } = await admin
    .from("recs").select("id, item_id, from_user, to_user").eq("token", token).maybeSingle();
  if (!rec) return NextResponse.json({ error: "not found" }, { status: 404 });

  // don't let someone claim their own rec.
  if (rec.from_user === user.id) return NextResponse.json({ ok: true, self: true });

  if (!rec.to_user) {
    await admin.from("recs").update({ to_user: user.id }).eq("id", rec.id);
  }
  await admin.from("queue_items").insert({
    user_id: user.id,
    item_id: rec.item_id,
    source: "rec",
    source_rec_id: rec.id,
  });

  return NextResponse.json({ ok: true });
}
