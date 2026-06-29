import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { generateTasteRead } from "@/lib/vibe";
import { getUserSignals } from "@/lib/taste-signals";
import { NextResponse } from "next/server";

const MIN_SIGNALS = 5; // below this the read is thin — show the "coming" copy instead.

// Generate (and cache) the user's personal taste read. Self-scoped: no group.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: me } = await admin.from("users").select("name").eq("id", user.id).maybeSingle();
  const signals = await getUserSignals(admin, user.id);

  if (signals.signalCount < MIN_SIGNALS) {
    return NextResponse.json(
      { error: `kizu needs a little more to go on — drop or queue a few more things first (${signals.signalCount}/${MIN_SIGNALS}).` },
      { status: 400 }
    );
  }

  try {
    const read = await generateTasteRead((me?.name || "you").toLowerCase(), signals.signals);
    await admin.from("taste_reads").insert({ user_id: user.id, card_data: read });
    return NextResponse.json({ read });
  } catch (e) {
    return NextResponse.json({ error: (e as Error)?.message ?? "taste read failed" }, { status: 500 });
  }
}
