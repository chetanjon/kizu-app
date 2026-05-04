import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// PATCH: switch the caller's home pack.
// Body: { pack_id }
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const packId = body?.pack_id;
  if (!packId || !UUID.test(packId)) {
    return NextResponse.json({ error: "valid pack_id required" }, { status: 400 });
  }

  // Confirm the user is actually in the pack (RLS would also block, but we
  // want a clean 404 instead of a silent zero-row update).
  const { data: target } = await supabase
    .from("pack_members")
    .select("id, is_home")
    .eq("user_id", user.id)
    .eq("pack_id", packId)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: "you are not in that pack" }, { status: 404 });
  }
  if (target.is_home) {
    return NextResponse.json({ ok: true, alreadyHome: true });
  }

  // Demote any current home first to avoid colliding with the partial unique
  // index `unique_home_per_user`. Then promote the chosen one.
  const { error: demoteError } = await supabase
    .from("pack_members")
    .update({ is_home: false })
    .eq("user_id", user.id)
    .eq("is_home", true);
  if (demoteError) {
    return NextResponse.json({ error: "failed to switch home" }, { status: 500 });
  }

  const { error: promoteError } = await supabase
    .from("pack_members")
    .update({ is_home: true })
    .eq("id", target.id);
  if (promoteError) {
    return NextResponse.json({ error: "failed to switch home" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE: leave a pack the caller is in.
// Query: ?pack_id=...
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const packId = searchParams.get("pack_id");
  if (!packId || !UUID.test(packId)) {
    return NextResponse.json({ error: "valid pack_id required" }, { status: 400 });
  }

  const { data: leaving } = await supabase
    .from("pack_members")
    .select("id, is_home")
    .eq("user_id", user.id)
    .eq("pack_id", packId)
    .maybeSingle();

  if (!leaving) {
    return NextResponse.json({ error: "you are not in that pack" }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("pack_members")
    .delete()
    .eq("id", leaving.id);
  if (deleteError) {
    return NextResponse.json({ error: "failed to leave pack" }, { status: 500 });
  }

  // If the user was leaving their home pack and still belongs to others,
  // promote the oldest remaining membership to home so they always have one.
  if (leaving.is_home) {
    const { data: remaining } = await supabase
      .from("pack_members")
      .select("id")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: true })
      .limit(1);
    if (remaining && remaining.length > 0) {
      await supabase
        .from("pack_members")
        .update({ is_home: true })
        .eq("id", remaining[0].id);
    }
  }

  return NextResponse.json({ ok: true });
}
