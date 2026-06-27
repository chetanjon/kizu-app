import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushToUser } from "@/lib/push";

export type NotifKind = "rec_for_you" | "it_landed" | "weekly_read";

// Emit an in-app notification. Cryptic + earned-only by convention (callers pass
// a short on-brand line). Optional frequency cap: skip if a same-kind notif for
// this user already exists within `capHours` (used to keep things quiet).
export async function notify(
  admin: SupabaseClient,
  userId: string,
  kind: NotifKind,
  body: string,
  href: string | null = null,
  capHours?: number,
): Promise<void> {
  if (capHours) {
    const since = new Date(Date.now() - capHours * 3600 * 1000).toISOString();
    const { count } = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", kind)
      .gte("created_at", since);
    if ((count ?? 0) > 0) return;
  }
  await admin.from("notifications").insert({ user_id: userId, kind, body, href });

  // Also deliver to the lock screen for opted-in users. The cryptic line is the
  // push title; tapping opens href. Never let push failure affect the in-app notif.
  try {
    await sendPushToUser(admin, userId, { title: body, url: href ?? "/home" });
  } catch {
    /* push is best-effort */
  }
}
