import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { buildAndStoreVibe, MIN_VIBE_DROPS } from "@/lib/group-vibe";
import { NextResponse } from "next/server";

// Generate (and cache) the group's vibe read — on-demand button. The weekly cron
// uses the same buildAndStoreVibe() helper.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const group_id = String(body.group_id ?? "");
  if (!group_id) return NextResponse.json({ error: "group_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: mem } = await admin
    .from("group_members").select("group_id").eq("group_id", group_id).eq("user_id", user.id).maybeSingle();
  if (!mem) return NextResponse.json({ error: "not a member" }, { status: 403 });

  // friendly gate before we burn a model call.
  const { count } = await admin.from("items").select("id", { count: "exact", head: true }).eq("group_id", group_id);
  if ((count ?? 0) < MIN_VIBE_DROPS) {
    return NextResponse.json(
      { error: `drop at least ${MIN_VIBE_DROPS} things first — the vibe read needs something to read (${count ?? 0}/${MIN_VIBE_DROPS}).` },
      { status: 400 }
    );
  }

  try {
    const result = await buildAndStoreVibe(admin, group_id);
    if (!result) return NextResponse.json({ error: "not enough to read yet." }, { status: 400 });
    return NextResponse.json({ read: result.read });
  } catch (e) {
    return NextResponse.json({ error: (e as Error)?.message ?? "vibe read failed" }, { status: 500 });
  }
}
