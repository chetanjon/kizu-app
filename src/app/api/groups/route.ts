import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { setActiveGroup } from "@/lib/groups";
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

  const { error: mErr } = await admin
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id, is_home: false });
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 400 });

  await setActiveGroup(admin, user.id, group.id);
  return NextResponse.json({ id: group.id, invite_code: group.invite_code });
}

// Rename / recolor a group — creator only.
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const group_id = String(b.group_id ?? "");
  if (!group_id) return NextResponse.json({ error: "group_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: group } = await admin.from("groups").select("created_by").eq("id", group_id).maybeSingle();
  if (!group) return NextResponse.json({ error: "no group" }, { status: 404 });
  if (group.created_by !== user.id) return NextResponse.json({ error: "only the creator can edit" }, { status: 403 });

  const update: { name?: string; color?: string } = {};
  if (typeof b.name === "string") { const n = b.name.trim().slice(0, 40); if (n) update.name = n; }
  if (/^#[0-9A-Fa-f]{6}$/.test(b.color)) update.color = b.color;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "nothing to update" }, { status: 400 });

  await admin.from("groups").update(update).eq("id", group_id);
  return NextResponse.json({ ok: true, ...update });
}
