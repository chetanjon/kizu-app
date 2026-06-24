import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// Founder-only photo upload for curate people. Accepts a file (gallery/camera),
// stores it in the public `curate` bucket, returns its public URL.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const founder = process.env.FOUNDER_EMAIL;
  if (!user || !founder || user.email !== founder) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "too big (5mb max)" }, { status: 400 });

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `people/${crypto.randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage.from("curate").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data } = admin.storage.from("curate").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
