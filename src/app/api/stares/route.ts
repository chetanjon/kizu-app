import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { toUser, podId } = body;

  if (!toUser || !podId) {
    return NextResponse.json(
      { error: "Target user and pod ID are required" },
      { status: 400 }
    );
  }

  if (toUser === user.id) {
    return NextResponse.json(
      { error: "You can't stare at yourself" },
      { status: 400 }
    );
  }

  // Verify both users are in the same pod
  const { data: memberships } = await supabase
    .from("pod_members")
    .select("user_id")
    .eq("pod_id", podId)
    .in("user_id", [user.id, toUser]);

  if (!memberships || memberships.length < 2) {
    return NextResponse.json(
      { error: "Both users must be members of the pod" },
      { status: 403 }
    );
  }

  // Current Monday
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  const weekStart = monday.toISOString().split("T")[0];

  // One stare per from->to per week
  const { data: existing } = await supabase
    .from("stares")
    .select("id")
    .eq("pod_id", podId)
    .eq("from_user", user.id)
    .eq("to_user", toUser)
    .eq("week_start", weekStart)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "You already sent a stare to this person this week" },
      { status: 400 }
    );
  }

  const { data: stare, error } = await supabase
    .from("stares")
    .insert({
      pod_id: podId,
      from_user: user.id,
      to_user: toUser,
      week_start: weekStart,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to send stare" }, { status: 500 });
  }

  return NextResponse.json({ stare });
}
