import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// Public read of the curate river: published drops by CONSENTED people,
// newest first, paginated. Powers infinite scroll below the Home threshold.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);
  const limit = Math.min(24, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10) || 12));

  const admin = createAdminClient();
  const { data } = await admin
    .from("curate_drops")
    .select("id, type, moment, their_words, data, curate_people!curate_drops_person_id_fkey(name, photo_url, where_met, consent)")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // admin bypasses RLS, so enforce the consent gate here.
  const drops = (data ?? []).filter((d) => {
    const p = d.curate_people as unknown as { consent?: boolean } | null;
    return p?.consent === true;
  });

  return NextResponse.json({ drops, nextOffset: offset + limit, done: (data ?? []).length < limit });
}
