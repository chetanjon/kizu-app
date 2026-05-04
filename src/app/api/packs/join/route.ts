import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const PACK_MAX = 20;
const PACKS_PER_USER_MAX = 5;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: pack, error: packError } = await supabase
    .from("packs")
    .select("id, name, color_a, color_b, icon")
    .eq("invite_code", code.toUpperCase())
    .single();

  if (packError || !pack) {
    return NextResponse.json({ error: "pack not found" }, { status: 404 });
  }

  const { count } = await supabase
    .from("pack_members")
    .select("id", { count: "exact", head: true })
    .eq("pack_id", pack.id);

  const { data: membership } = await supabase
    .from("pack_members")
    .select("id")
    .eq("pack_id", pack.id)
    .eq("user_id", user.id)
    .limit(1);

  return NextResponse.json({
    pack,
    memberCount: count ?? 0,
    alreadyMember: (membership && membership.length > 0) || false,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const code = body.code?.trim()?.toUpperCase();
  const setHome: boolean = !!body.set_home;

  if (!code) {
    return NextResponse.json(
      { error: "invite code is required" },
      { status: 400 }
    );
  }

  await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email!,
      name:
        user.user_metadata.full_name ||
        user.user_metadata.name ||
        user.email!.split("@")[0],
      avatar_url: user.user_metadata.avatar_url || null,
    },
    { onConflict: "id" }
  );

  const { data: pack, error: packError } = await supabase
    .from("packs")
    .select("id, name")
    .eq("invite_code", code)
    .single();

  if (packError || !pack) {
    return NextResponse.json({ error: "pack not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("pack_members")
    .select("id")
    .eq("pack_id", pack.id)
    .eq("user_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "you are already in this pack" },
      { status: 400 }
    );
  }

  const { count: packCount } = await supabase
    .from("pack_members")
    .select("id", { count: "exact", head: true })
    .eq("pack_id", pack.id);

  if ((packCount ?? 0) >= PACK_MAX) {
    return NextResponse.json(
      { error: `this pack is full (${PACK_MAX}/${PACK_MAX})` },
      { status: 400 }
    );
  }

  const { count: userPackCount } = await supabase
    .from("pack_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((userPackCount ?? 0) >= PACKS_PER_USER_MAX) {
    return NextResponse.json(
      { error: `you are already in ${PACKS_PER_USER_MAX} packs` },
      { status: 400 }
    );
  }

  const { count: existingHome } = await supabase
    .from("pack_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_home", true);

  const isHome = setHome || (existingHome ?? 0) === 0;

  if (isHome && (existingHome ?? 0) > 0) {
    await supabase
      .from("pack_members")
      .update({ is_home: false })
      .eq("user_id", user.id);
  }

  const { error: joinError } = await supabase.from("pack_members").insert({
    pack_id: pack.id,
    user_id: user.id,
    is_home: isHome,
  });

  if (joinError) {
    return NextResponse.json(
      { error: "failed to join pack" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, packId: pack.id });
}
