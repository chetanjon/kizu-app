import { createAdminClient } from "@/lib/supabase-admin";
import { buildAndStoreVibe } from "@/lib/group-vibe";
import { notify } from "@/lib/notify";
import { NextResponse } from "next/server";

// The weekly ritual (the appointment mechanic). Vercel Cron hits this with
// `Authorization: Bearer <CRON_SECRET>`. For each ACTIVE group, generate + store
// the vibe read and push every member a cryptic "the week's read is in" → /home.
export const maxDuration = 300; // a model call per group

// The Monday (UTC) of the given date's week, as YYYY-MM-DD — the stable key for
// "this week", so a re-run (or DST-shifted double fire) maps to the same period.
function mondayUTC(d: Date): string {
  const day = d.getUTCDay(); // 0=Sun … 6=Sat
  const delta = day === 0 ? -6 : 1 - day; // days back to Monday
  const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + delta));
  return m.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const since = new Date(now.getTime() - 14 * 86400 * 1000).toISOString();
  const periodStart = mondayUTC(now); // the week's Monday (UTC), YYYY-MM-DD

  const { data: groups } = await admin.from("groups").select("id");
  let groupsRead = 0, pushed = 0;
  for (const g of groups ?? []) {
    // skip dead groups — need a drop in the last 2 weeks to be worth a read + ping.
    const { count: recent } = await admin
      .from("items").select("id", { count: "exact", head: true }).eq("group_id", g.id).gte("created_at", since);
    if (!recent) continue;

    // idempotency: if this group already has THIS week's read, skip before we
    // burn a model call. The partial unique index is the backstop for races.
    const { data: already } = await admin
      .from("vibe_reads").select("id")
      .eq("group_id", g.id).eq("source", "weekly").eq("period_start", periodStart)
      .maybeSingle();
    if (already) continue;

    try {
      const result = await buildAndStoreVibe(admin, g.id, "weekly", periodStart);
      if (!result) continue;
      groupsRead++;
      const { data: members } = await admin.from("group_members").select("user_id").eq("group_id", g.id);
      for (const m of members ?? []) {
        await notify(admin, m.user_id, "weekly_read", "the week's read is in.", `/read/${result.id}`);
        pushed++;
      }
    } catch {
      /* one bad group shouldn't kill the whole run */
    }
  }

  return NextResponse.json({ ok: true, groupsRead, pushed });
}
