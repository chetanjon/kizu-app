import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// Your recent notifications (newest first). User-scoped read via RLS.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("notifications")
    .select("id, kind, body, href, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const items = data ?? [];
  const unread = items.filter((n) => !n.read_at).length;
  return NextResponse.json({ items, unread });
}

// Dismiss notifications so they don't pile up: one by `id`, or `all` of yours.
// These are ephemeral nudges — the real thing (the queue, the drop) lives on.
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const id = b.id ? String(b.id) : null;
  if (!id && b.all !== true) return NextResponse.json({ error: "id or all required" }, { status: 400 });

  const admin = createAdminClient();
  const q = admin.from("notifications").delete().eq("user_id", user.id);
  await (id ? q.eq("id", id) : q);
  return NextResponse.json({ ok: true });
}
