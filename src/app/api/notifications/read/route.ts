import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// Mark notifications read (one by id, or all). Owner-scoped.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const id = b.id ? String(b.id) : null;
  const now = new Date().toISOString();

  const admin = createAdminClient();
  const q = admin.from("notifications").update({ read_at: now }).eq("user_id", user.id).is("read_at", null);
  await (id ? q.eq("id", id) : q);
  return NextResponse.json({ ok: true });
}
