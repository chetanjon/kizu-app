import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createRec } from "@/lib/recs";
import { sendPushToUser } from "@/lib/push";
import { isDropPhotoPath } from "@/lib/drop-photos";
import { resolveListen } from "@/lib/odesli";
import { NextResponse } from "next/server";

// Create a drop. Authorize via getUser, verify group membership, write via admin.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const group_id = String(b.group_id ?? "");
  const type = String(b.type ?? "");
  if (!group_id) return NextResponse.json({ error: "group_id required" }, { status: 400 });
  if (!["watch", "listen", "go_out"].includes(type)) {
    return NextResponse.json({ error: "bad type" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: mem } = await admin
    .from("group_members").select("group_id")
    .eq("group_id", group_id).eq("user_id", user.id).maybeSingle();
  if (!mem) return NextResponse.json({ error: "not a member of that group" }, { status: 403 });

  const rating_style = ["number", "stars", "word"].includes(b.rating_style) ? b.rating_style : null;
  const note = b.note ? String(b.note).slice(0, 200) : null;
  const rating_value = b.rating_value ? String(b.rating_value).slice(0, 40) : null;

  const data: Record<string, unknown> = (b.data && typeof b.data === "object") ? b.data : {};
  // Harden: a photo_url on ANY drop type, if present, must be an object WE stored
  // in THIS group's drops bucket. Blocks "skip the upload route, point photo_url
  // at anything" (XSS/IDOR/SSRF/hotlink) — including non-go_out drops via the API.
  {
    const p = data["photo_url"];
    if (p != null && !(isDropPhotoPath(p) && p.startsWith(`groups/${group_id}/`))) {
      return NextResponse.json({ error: "bad photo" }, { status: 400 });
    }
  }

  // Music: a song dropped by typed title only carries Apple (iTunes search gives
  // nothing else). Enrich it through Odesli so the dropper's pick opens in every
  // app — and "your music app" has a link to use. Pasted links already arrive
  // enriched (they came through Odesli), so the !spotify guard skips them.
  if (type === "listen") {
    const pl = (data.platform_links && typeof data.platform_links === "object")
      ? (data.platform_links as Record<string, string>) : {};
    const seed = (typeof data.source_url === "string" && data.source_url) || pl.apple || pl.spotify || null;
    if (!pl.spotify && seed) {
      const enriched = await resolveListen(seed);
      if (enriched && Object.keys(enriched.platform_links).length) {
        // keep the original links, add the ones Odesli found.
        data.platform_links = { ...enriched.platform_links, ...pl };
        if (!data.odesli_url) data.odesli_url = enriched.odesli_url;
      }
    }
  }

  // recipients of a targeted drop (attributed — option 3). Array now; tolerate the
  // legacy single-string shape so an in-flight old client mid-deploy still works.
  const recTo: string[] = Array.isArray(b.rec_to)
    ? b.rec_to.map((x: unknown) => String(x))
    : b.rec_to ? [String(b.rec_to)] : [];
  const targets = [...new Set(recTo)].filter((id) => id && id !== user.id);

  // anon is an EXPLICIT group-wide choice, decoupled from targeting: a targeted
  // drop is always attributed (you're vouching for it), so anon only applies when
  // there are no recipients. One missed surface = an identity leak, so every read
  // path (feed/queue/tonight/vibe/taste-match) checks items.anon.
  // a private log is creator-only: never targeted, never anon, no group ping.
  const isPrivate = b.private === true;
  const anon = !isPrivate && targets.length === 0 && b.anon === true;

  const { data: item, error } = await admin
    .from("items")
    .insert({
      group_id,
      created_by: user.id,
      type,
      rating_value,
      rating_style,
      note,
      data,
      anon,
      private: isPrivate,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // a private log stops here — no recs, no group push. it's just yours.
  if (isPrivate) return NextResponse.json({ id: item.id });

  // one rec per valid member target. Each gets its own queue row + cryptic ping
  // (createRec handles all three). Non-members skip silently. Remember who was
  // recced so they're left out of the generic group push below.
  let recUrl: string | null = null;
  const recced: string[] = [];
  for (const id of targets) {
    const { data: rmem } = await admin
      .from("group_members").select("group_id")
      .eq("group_id", group_id).eq("user_id", id).maybeSingle();
    if (!rmem) continue;
    const rec = await createRec(admin, user.id, item.id, id);
    if (rec) {
      recced.push(id);
      if (!recUrl) recUrl = `/r/${rec.token}`;
    }
  }

  // Cryptic, push-only ping to the rest of the group — the feed already shows
  // the drop in-app, so we deliberately skip the in-app notifications table.
  // Awaited (not fire-and-forget): serverless freezes work after the response.
  // Skip the dropper, and the rec recipients (they get the specific rec ping).
  const skip = new Set<string>([user.id, ...recced]);
  const { data: members } = await admin
    .from("group_members").select("user_id").eq("group_id", group_id);
  const recipients = (members ?? []).map((m) => m.user_id).filter((id) => !skip.has(id));
  // honor per-user opt-out: anyone who muted drop pings is dropped from the fan-out.
  const { data: muted } = recipients.length
    ? await admin.from("users").select("id").eq("mute_drop_pings", true).in("id", recipients)
    : { data: [] };
  const mutedSet = new Set((muted ?? []).map((u) => u.id));
  await Promise.all(
    recipients
      .filter((id) => !mutedSet.has(id))
      .map((id) =>
        sendPushToUser(admin, id, {
          title: "someone dropped something.",
          url: "/home",
          kind: "drop",
        }),
      ),
  );

  return NextResponse.json({ id: item.id, recUrl });
}

// Share one of your OWN private logs with the crew: flip private → false and
// fan out the same cryptic, push-only ping a fresh drop sends (skip the sharer,
// honor per-user drop mutes). No recs, no in-app row — the feed shows it.
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const id = String(b.id ?? "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: item } = await admin
    .from("items").select("created_by, group_id, private").eq("id", id).maybeSingle();
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (item.created_by !== user.id) return NextResponse.json({ error: "not yours" }, { status: 403 });
  if (!item.private) return NextResponse.json({ ok: true, already: true });

  await admin.from("items").update({ private: false }).eq("id", id);

  const { data: members } = await admin
    .from("group_members").select("user_id").eq("group_id", item.group_id);
  const recipients = (members ?? []).map((m) => m.user_id).filter((uid) => uid !== user.id);
  const { data: muted } = recipients.length
    ? await admin.from("users").select("id").eq("mute_drop_pings", true).in("id", recipients)
    : { data: [] };
  const mutedSet = new Set((muted ?? []).map((u) => u.id));
  await Promise.all(
    recipients.filter((uid) => !mutedSet.has(uid)).map((uid) =>
      sendPushToUser(admin, uid, { title: "someone dropped something.", url: "/home", kind: "drop" }),
    ),
  );

  return NextResponse.json({ ok: true });
}

// Delete your own drop.
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const id = String(b.id ?? "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: item } = await admin.from("items").select("created_by, data").eq("id", id).maybeSingle();
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (item.created_by !== user.id) return NextResponse.json({ error: "not yours" }, { status: 403 });

  await admin.from("items").delete().eq("id", id);

  // best-effort: remove the stored photo so deleted drops don't orphan files
  const p = (item.data as Record<string, unknown> | null)?.["photo_url"];
  if (isDropPhotoPath(p)) await admin.storage.from("drops").remove([p]);

  return NextResponse.json({ ok: true });
}
