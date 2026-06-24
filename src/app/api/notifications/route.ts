import { createClient } from "@/lib/supabase-server";
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
