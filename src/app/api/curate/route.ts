import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// Founder-only Curate admin API. Gated by FOUNDER_EMAIL (one founder, no DB role).
// Writes via the service-role client (curate tables have no write policies).
async function gate() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const founder = process.env.FOUNDER_EMAIL;
  if (!user || !founder || user.email !== founder) return null;
  return user;
}

// list everything (drops + their person) for the admin view.
export async function GET() {
  if (!(await gate())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const { data } = await admin
    .from("curate_drops")
    .select("id, type, moment, their_words, data, published, created_at, curate_people!curate_drops_person_id_fkey(id, name, photo_url, where_met, consent)")
    .order("created_at", { ascending: false });
  return NextResponse.json({ drops: data ?? [] });
}

// create a curate drop (and its person, if new).
export async function POST(req: Request) {
  if (!(await gate())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const admin = createAdminClient();

  const type = String(b.type ?? "");
  const moment = String(b.moment ?? "").trim();
  if (!["watch", "listen", "go_out"].includes(type)) return NextResponse.json({ error: "bad type" }, { status: 400 });
  if (!moment) return NextResponse.json({ error: "moment required" }, { status: 400 });

  let person_id = b.person_id ? String(b.person_id) : null;
  if (!person_id) {
    const name = String(b.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "person name required" }, { status: 400 });
    const { data: person, error: pErr } = await admin
      .from("curate_people")
      .insert({
        name: name.slice(0, 60),
        photo_url: b.photo_url ? String(b.photo_url) : null,
        where_met: b.where_met ? String(b.where_met).slice(0, 80) : null,
        consent: b.consent === true,
      })
      .select("id").single();
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 });
    person_id = person.id;
  }

  const { data: drop, error } = await admin
    .from("curate_drops")
    .insert({
      person_id,
      type,
      moment: moment.slice(0, 40),
      their_words: b.their_words ? String(b.their_words).slice(0, 240) : null,
      data: (b.data && typeof b.data === "object") ? b.data : {},
      published: b.published === true,
    })
    .select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: drop.id });
}

// toggle published / edit fields by drop id.
export async function PATCH(req: Request) {
  if (!(await gate())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const admin0 = createAdminClient();

  // toggle a person's consent (lives on curate_people, not the drop).
  if (typeof b.consent === "boolean" && b.person_id) {
    const { error } = await admin0.from("curate_people").update({ consent: b.consent }).eq("id", String(b.person_id));
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const id = String(b.id ?? "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof b.published === "boolean") patch.published = b.published;
  if (typeof b.moment === "string") patch.moment = b.moment.slice(0, 40);
  if (typeof b.their_words === "string") patch.their_words = b.their_words.slice(0, 240);
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "nothing to update" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("curate_drops").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// delete a drop.
export async function DELETE(req: Request) {
  if (!(await gate())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const id = String(b.id ?? "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("curate_drops").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
