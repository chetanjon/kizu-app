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
  const { betId, result } = body;

  if (!betId || !result) {
    return NextResponse.json(
      { error: "Bet ID and result are required" },
      { status: 400 }
    );
  }

  if (!["delivered", "halfway", "missed"].includes(result)) {
    return NextResponse.json(
      { error: "Result must be delivered, halfway, or missed" },
      { status: 400 }
    );
  }

  // Verify the bet belongs to the user
  const { data: bet } = await supabase
    .from("bets")
    .select("id, user_id")
    .eq("id", betId)
    .single();

  if (!bet || bet.user_id !== user.id) {
    return NextResponse.json(
      { error: "Bet not found" },
      { status: 404 }
    );
  }

  // Check if already checked in
  const { data: existing } = await supabase
    .from("checkins")
    .select("id")
    .eq("bet_id", betId)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "Already checked in for this bet" },
      { status: 400 }
    );
  }

  const { data: checkin, error } = await supabase
    .from("checkins")
    .insert({
      bet_id: betId,
      result,
      sealed_at: new Date().toISOString(),
    })
    .select("id, result")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to check in" },
      { status: 500 }
    );
  }

  return NextResponse.json({ checkin });
}
