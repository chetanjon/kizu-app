import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { generateVibe, type VibeItem } from "@/lib/vibe";
import { NextResponse } from "next/server";

const MIN_DROPS = 3; // low for the test; raise toward ~6 later

function metaFor(type: string, d: Record<string, any>): string {
  if (type === "watch") return [d.year, d.media_type].filter(Boolean).join(" · ");
  if (type === "listen") return d.artist || "";
  return [d.subtype, d.music_note].filter(Boolean).join(" · ");
}

// Generate (and cache) the group's vibe read.
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

  const { data: group } = await admin.from("groups").select("name").eq("id", group_id).single();
  const { data: memRows } = await admin
    .from("group_members").select("users(name)").eq("group_id", group_id);
  const members = ((memRows ?? []) as unknown as { users: { name: string | null } | null }[])
    .map((m) => m.users?.name).filter(Boolean) as string[];

  const { data: rows } = await admin
    .from("items")
    .select("type, rating_value, note, data, users!items_created_by_fkey(name)")
    .eq("group_id", group_id)
    .order("created_at", { ascending: false })
    .limit(60);
  const items = (rows ?? []) as unknown as {
    type: string; rating_value: string | null; note: string | null;
    data: Record<string, any>; users: { name: string | null } | null;
  }[];

  if (items.length < MIN_DROPS) {
    return NextResponse.json(
      { error: `drop at least ${MIN_DROPS} things first — the vibe read needs something to read (${items.length}/${MIN_DROPS}).` },
      { status: 400 }
    );
  }

  const vibeItems: VibeItem[] = items.map((it) => ({
    type: it.type as VibeItem["type"],
    title: it.data?.title || it.data?.place_name || "untitled",
    meta: metaFor(it.type, it.data || {}),
    rating: it.rating_value || undefined,
    note: it.note || undefined,
    who: it.users?.name || "someone",
  }));

  try {
    const read = await generateVibe(group?.name || "the group", members, vibeItems);
    await admin.from("vibe_reads").insert({
      group_id,
      summary: read.title || read.body.slice(0, 120),
      card_data: read,
    });
    return NextResponse.json({ read });
  } catch (e) {
    return NextResponse.json({ error: (e as Error)?.message ?? "vibe read failed" }, { status: 500 });
  }
}
