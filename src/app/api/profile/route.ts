import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { cleanServices } from "@/lib/services";
import { NextResponse } from "next/server";

// Set your display name, "you" figure (gender), mute pref, and/or streaming
// services. Partial updates ok.
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const update: { name?: string; gender?: string; mute_drop_pings?: boolean; services?: string[] } = {};

  if (typeof b.name === "string") {
    const name = b.name.trim().slice(0, 40);
    if (name) update.name = name;
  }
  if (b.gender === "male" || b.gender === "female") update.gender = b.gender;
  if (typeof b.mute_drop_pings === "boolean") update.mute_drop_pings = b.mute_drop_pings;
  if (Array.isArray(b.services)) update.services = cleanServices(b.services);

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("users").update(update).eq("id", user.id);
  return NextResponse.json({ ok: true, ...update });
}
