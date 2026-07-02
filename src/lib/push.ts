import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT;
const configured = Boolean(PUBLIC && PRIVATE && SUBJECT);
if (configured) {
  webpush.setVapidDetails(SUBJECT!, PUBLIC!, PRIVATE!);
}

// `kind` is an optional marker echoed into the notification's data so the app
// can find and auto-dismiss a class of notifications later (e.g. "drop").
// `tag` collapses same-tag notifications into ONE tray entry (used to de-dupe a
// burst of kizu-curate pings into a single "kizu drop.").
export type PushPayload = { title: string; body?: string; url?: string; kind?: string; tag?: string };

// Send a web push to all of a user's subscriptions. No-ops if VAPID isn't
// configured (safe to deploy before the env vars exist). Never throws.
// Prunes dead subscriptions on 404/410.
export async function sendPushToUser(
  admin: SupabaseClient,
  userId: string,
  payload: PushPayload,
): Promise<void> {
  if (!configured) return;
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (!subs || subs.length === 0) return;

  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    }),
  );
}
