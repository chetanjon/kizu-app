import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// Set your display name and/or your "you" figure (gender). Partial updates ok.
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const update: { name?: string; gender?: string } = {};

  if (typeof b.name === "string") {
    const name = b.name.trim().slice(0, 40);
    if (name) update.name = name;
  }
  if (b.gender === "male" || b.gender === "female") update.gender = b.gender;

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("users").update(update).eq("id", user.id);
  return NextResponse.json({ ok: true, ...update });
}
