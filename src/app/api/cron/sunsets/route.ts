import { createAdminClient } from "@/lib/supabase-admin";
import { FROM_EMAIL, getResend } from "@/lib/resend";
import { sunsetEmailPayload } from "@/lib/sunset-email";
import { type Frequency, nextEmailTime } from "@/lib/sunset";
import { NextResponse } from "next/server";

const BATCH = 50;
const ONE_HOUR_MS = 60 * 60 * 1000;

type DueUser = {
  id: string;
  email: string;
  timezone: string;
  sunset_frequency: Frequency;
};

const isAuthorized = (req: Request): boolean => {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization");
  if (!auth) return false;
  const [scheme, token] = auth.split(" ");
  return scheme?.toLowerCase() === "bearer" && token === expected;
};

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const resend = getResend();
  const supabase = createAdminClient();
  const payload = sunsetEmailPayload();

  const { data: due, error } = await supabase
    .from("users")
    .select("id, email, timezone, sunset_frequency")
    .lte("next_sunset_at", new Date().toISOString())
    .not("next_sunset_at", "is", null)
    .neq("sunset_frequency", "off")
    .order("next_sunset_at", { ascending: true })
    .limit(BATCH);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = (due ?? []) as DueUser[];
  if (users.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0, failed: 0 });
  }

  const now = new Date();
  const results = await Promise.allSettled(
    users.map(async (u) => {
      try {
        const sendResult = await resend.emails.send({
          from: FROM_EMAIL,
          to: [u.email],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        });
        if (sendResult.error) throw new Error(sendResult.error.message);

        const next = nextEmailTime({
          timezone: u.timezone,
          frequency: u.sunset_frequency,
          lastSentAt: now,
        });
        await supabase
          .from("users")
          .update({ next_sunset_at: next ? next.toISOString() : null })
          .eq("id", u.id);
        return "sent" as const;
      } catch (err) {
        // On failure, advance by 1 hour so this user doesn't block the
        // queue and gets retried next pass instead of blocking now.
        const retry = new Date(now.getTime() + ONE_HOUR_MS).toISOString();
        await supabase
          .from("users")
          .update({ next_sunset_at: retry })
          .eq("id", u.id);
        console.error("sunset email failed for", u.id, err);
        return "failed" as const;
      }
    })
  );

  let sent = 0;
  let failed = 0;
  for (const r of results) {
    if (r.status === "fulfilled" && r.value === "sent") sent++;
    else failed++;
  }

  return NextResponse.json({
    processed: users.length,
    sent,
    failed,
  });
}
