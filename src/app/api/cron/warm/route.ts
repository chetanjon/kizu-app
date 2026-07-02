import { createAdminClient } from "@/lib/supabase-admin";
import { availabilityMap } from "@/lib/providers";
import { NextResponse } from "next/server";

// Keep-warm + cache-warm in one. The Supabase pg_cron job hits this every
// 5 minutes:
//  1. the request itself keeps the Vercel function warm (no cold starts), and
//  2. running availabilityMap over the recent watch drops re-primes the 24h
//     TMDB data cache, so no real person ever pays those external fetches —
//     the first open of the day was eating 2s+ exactly there.
//
// Deliberately UNAUTHED (unlike the other cron routes): so the pg_cron job
// carries no secret in its SQL. Safe because the work is fixed and bounded
// (100 titles, 800ms-capped fetches that are data-cache hits after the first
// call of the day), it exposes nothing, and hammering it mostly reads cache.
export const maxDuration = 60;

export async function GET() {
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
  // fetch still runs, which is all the cache warming needs. The body stays
  // information-free on purpose (the route is public).
  await availabilityMap(rows, []);
  return NextResponse.json({ ok: true });
}
