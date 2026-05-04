import { createClient } from "@/lib/supabase-server";
import {
  type Frequency,
  isValidTimezone,
  nextEmailTime,
} from "@/lib/sunset";
import { NextResponse } from "next/server";

const FREQUENCIES = new Set<Frequency>([
  "daily",
  "every_2_days",
  "weekly",
  "off",
]);

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const incomingTz: unknown = body.timezone;
  const incomingFreq: unknown = body.sunset_frequency;

  const updates: { timezone?: string; sunset_frequency?: Frequency } = {};

  if (typeof incomingTz === "string") {
    if (!isValidTimezone(incomingTz)) {
      return NextResponse.json(
        { error: "invalid timezone" },
        { status: 400 }
      );
    }
    updates.timezone = incomingTz;
  }

  if (typeof incomingFreq === "string") {
    if (!FREQUENCIES.has(incomingFreq as Frequency)) {
      return NextResponse.json(
        { error: "invalid frequency" },
        { status: 400 }
      );
    }
    updates.sunset_frequency = incomingFreq as Frequency;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("timezone, sunset_frequency")
    .eq("id", user.id)
    .single();

  const finalTz = updates.timezone ?? existing?.timezone ?? "Etc/UTC";
  const finalFreq = (updates.sunset_frequency ??
    existing?.sunset_frequency ??
    "daily") as Frequency;

  const next = nextEmailTime({ timezone: finalTz, frequency: finalFreq });

  const { data: row, error } = await supabase
    .from("users")
    .update({
      ...updates,
      next_sunset_at: next ? next.toISOString() : null,
    })
    .eq("id", user.id)
    .select("timezone, sunset_frequency, next_sunset_at")
    .single();

  if (error || !row) {
    return NextResponse.json(
      { error: error?.message ?? "could not save" },
      { status: 500 }
    );
  }

  return NextResponse.json({ user: row });
}
