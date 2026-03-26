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
  const { goalText, directedAt, podId } = body;

  if (!goalText?.trim() || !directedAt || !podId) {
    return NextResponse.json(
      { error: "Goal text, directed at, and pod ID are required" },
      { status: 400 }
    );
  }

  // Get current Monday
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  const weekStart = monday.toISOString().split("T")[0];

  // Check if user already has a bet this week
  const { data: existing } = await supabase
    .from("bets")
    .select("id")
    .eq("user_id", user.id)
    .eq("pod_id", podId)
    .eq("week_start", weekStart)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "You already placed a bet this week" },
      { status: 400 }
    );
  }

  const { data: bet, error } = await supabase
    .from("bets")
    .insert({
      pod_id: podId,
      user_id: user.id,
      directed_at: directedAt,
      goal_text: goalText.trim(),
      week_start: weekStart,
    })
    .select("id, goal_text, directed_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to place bet" },
      { status: 500 }
    );
  }

  return NextResponse.json({ bet });
}
