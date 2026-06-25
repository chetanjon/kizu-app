import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { setActiveGroup } from "@/lib/groups";
import { NextResponse } from "next/server";

// Join a group by invite code. Code lookup uses the admin client (you can't
// SELECT a group you're not in yet); membership insert also via admin so RLS
// doesn't block the first-touch. The caps trigger still enforces 20/group.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: group } = await admin
    .from("groups").select("id").eq("invite_code", code).maybeSingle();
  if (!group) return NextResponse.json({ error: "no group with that code" }, { status: 404 });

  const { error } = await admin
    .from("group_members")
    .upsert(
      { group_id: group.id, user_id: user.id, is_home: false },
      { onConflict: "group_id,user_id", ignoreDuplicates: true }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await setActiveGroup(admin, user.id, group.id);
  return NextResponse.json({ id: group.id });
}
