import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const HEX = /^#[0-9A-Fa-f]{6}$/;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const name = body.name?.trim();
  const colorA = body.color_a?.trim();
  const colorB = body.color_b?.trim();
  const icon = body.icon?.trim();
  const foundingDate = body.founding_date?.trim();

  if (!name || name.length > 40) {
    return NextResponse.json(
      { error: "name must be 1-40 characters" },
      { status: 400 }
    );
  }
  if (!HEX.test(colorA ?? "") || !HEX.test(colorB ?? "")) {
    return NextResponse.json(
      { error: "two hex colors required" },
      { status: 400 }
    );
  }
  if (!icon || icon.length > 8) {
    return NextResponse.json({ error: "icon required" }, { status: 400 });
  }
  if (!foundingDate || !/^\d{4}-\d{2}-\d{2}$/.test(foundingDate)) {
    return NextResponse.json(
      { error: "founding_date must be YYYY-MM-DD" },
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

  const { count: userPackCount } = await supabase
    .from("pack_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((userPackCount ?? 0) >= 5) {
    return NextResponse.json(
      { error: "you are already in 5 packs" },
      { status: 400 }
    );
  }

  const { data: code, error: rpcError } = await supabase.rpc(
    "generate_invite_code"
  );
  if (rpcError || !code) {
    return NextResponse.json(
      { error: "failed to generate invite code" },
      { status: 500 }
    );
  }

  const { data: pack, error: packError } = await supabase
    .from("packs")
    .insert({
      name,
      invite_code: code,
      color_a: colorA,
      color_b: colorB,
      icon,
      founding_date: foundingDate,
      created_by: user.id,
    })
    .select("id, name, invite_code")
    .single();

  if (packError || !pack) {
    return NextResponse.json(
      { error: "failed to create pack" },
      { status: 500 }
    );
  }

  const { count: existingHome } = await supabase
    .from("pack_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_home", true);

  const { error: memberError } = await supabase.from("pack_members").insert({
    pack_id: pack.id,
    user_id: user.id,
    is_home: (existingHome ?? 0) === 0,
  });

  if (memberError) {
    return NextResponse.json(
      { error: "failed to add creator to pack" },
      { status: 500 }
    );
  }

  return NextResponse.json({ pack });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("pack_members")
    .select(
      "is_home, joined_at, pack:packs(id, name, invite_code, color_a, color_b, icon, founding_date)"
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "failed to load packs" },
      { status: 500 }
    );
  }

  return NextResponse.json({ memberships: data ?? [] });
}
