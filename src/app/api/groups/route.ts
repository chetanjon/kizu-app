import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// Create a group. We authorize with the user-scoped client (getUser), then
// write with the admin client — reliable across route-handler token edge cases.
// created_by/user_id come from the verified user, so this stays safe.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const color = /^#[0-9A-Fa-f]{6}$/.test(body.color) ? body.color : "#6B4BD6";
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const admin = createAdminClient();

  // Make sure the profile row exists (FK target for groups.created_by).
  await admin.from("users").upsert(
    { id: user.id, email: user.email ?? `${user.id}@kizu.local` },
    { onConflict: "id", ignoreDuplicates: true }
  );

  const { data: group, error } = await admin
    .from("groups")
    .insert({ name, color, created_by: user.id })
    .select("id, invite_code")
    .single();
  if (error || !group) {
    return NextResponse.json({ error: error?.message ?? "create failed" }, { status: 400 });
  }

  const { count } = await admin
    .from("group_members").select("*", { count: "exact", head: true }).eq("user_id", user.id);

  const { error: mErr } = await admin
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id, is_home: (count ?? 0) === 0 });
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 400 });

  return NextResponse.json({ id: group.id, invite_code: group.invite_code });
}
