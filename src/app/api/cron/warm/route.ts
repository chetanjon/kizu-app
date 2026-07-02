import { createAdminClient } from "@/lib/supabase-admin";
import { availabilityMap } from "@/lib/providers";
import { NextResponse } from "next/server";

// Keep-warm + cache-warm in one. The Supabase pg_cron job hits this every
// 5 minutes with `Authorization: Bearer <CRON_SECRET>`:
//  1. the request itself keeps the Vercel function warm (no cold starts), and
//  2. running availabilityMap over the recent watch drops re-primes the 24h
//     TMDB data cache, so no real person ever pays those external fetches —
//     the first open of the day was eating 2s+ exactly there.
export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  // the titles feeds actually render: the most recent watch drops across all
  // groups (each group's feed caps at its recent slice, so 100 covers them).
  const { data } = await admin
    .from("items")
    .select("id, type, data")
    .eq("type", "watch")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as { id: string; type: string; data: Record<string, unknown> }[];
  // mine=[] → no "you have it" match is computed, but every title's provider
  // fetch still runs, which is all the cache warming needs.
  const warmed = await availabilityMap(rows, []);
  return NextResponse.json({ ok: true, titles: rows.length, cached: warmed.size >= 0 });
}
