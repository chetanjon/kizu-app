import { createAdminClient } from "@/lib/supabase-admin";
import { buildAndStoreVibe } from "@/lib/group-vibe";
import { notify } from "@/lib/notify";
import { NextResponse } from "next/server";

// The weekly ritual (the appointment mechanic). Vercel Cron hits this with
// `Authorization: Bearer <CRON_SECRET>`. For each ACTIVE group, generate + store
// the vibe read and push every member a cryptic "the week's read is in" → /home.
export const maxDuration = 300; // a model call per group

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const since = new Date(Date.now() - 14 * 86400 * 1000).toISOString();

  const { data: groups } = await admin.from("groups").select("id");
  let groupsRead = 0, pushed = 0;
  for (const g of groups ?? []) {
    // skip dead groups — need a drop in the last 2 weeks to be worth a read + ping.
    const { count: recent } = await admin
      .from("items").select("id", { count: "exact", head: true }).eq("group_id", g.id).gte("created_at", since);
    if (!recent) continue;

    try {
      const read = await buildAndStoreVibe(admin, g.id);
      if (!read) continue;
      groupsRead++;
      const { data: members } = await admin.from("group_members").select("user_id").eq("group_id", g.id);
      for (const m of members ?? []) {
        await notify(admin, m.user_id, "weekly_read", "the week's read is in.", "/home");
        pushed++;
      }
    } catch {
      /* one bad group shouldn't kill the whole run */
    }
  }

  return NextResponse.json({ ok: true, groupsRead, pushed });
}
