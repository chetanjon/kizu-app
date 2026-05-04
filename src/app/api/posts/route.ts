import { createClient } from "@/lib/supabase-server";
import { blurReceipt } from "@/lib/blur-receipt";
import { NextResponse } from "next/server";

// Receipts go through Claude vision + sharp; give the route enough headroom.
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const form = await request.formData();
  const packId = form.get("pack_id");
  const kind = form.get("kind");
  const localDate = form.get("local_date");
  const image = form.get("image");

  if (typeof packId !== "string") {
    return NextResponse.json({ error: "pack_id required" }, { status: 400 });
  }
  if (kind !== "receipt" && kind !== "photo") {
    return NextResponse.json(
      { error: "kind must be 'receipt' or 'photo'" },
      { status: 400 }
    );
  }
  if (typeof localDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
    return NextResponse.json(
      { error: "local_date must be YYYY-MM-DD" },
      { status: 400 }
    );
  }
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "image required" }, { status: 400 });
  }
  const ext = ALLOWED.get(image.type);
  if (!ext) {
    return NextResponse.json(
      { error: "image must be png, jpeg, or webp" },
      { status: 400 }
    );
  }
  if (image.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `image too large (max ${MAX_BYTES / 1024 / 1024}MB)` },
      { status: 400 }
    );
  }

  const { data: membership } = await supabase
    .from("pack_members")
    .select("pack_id")
    .eq("pack_id", packId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json(
      { error: "not a member of this pack" },
      { status: 403 }
    );
  }

  const postId = crypto.randomUUID();
  const rawBuffer = Buffer.from(await image.arrayBuffer());

  // Receipts: redact PII before anything touches Storage. If the pipeline
  // throws we drop the post entirely — better to lose the upload than to
  // store an un-blurred screenshot.
  let storedBuffer: Buffer = rawBuffer;
  let storedExt: string = ext;
  let storedContentType: string = image.type;
  if (kind === "receipt") {
    try {
      const blurred = await blurReceipt(rawBuffer, image.type);
      storedBuffer = blurred.buffer;
      storedExt = blurred.ext;
      storedContentType = blurred.contentType;
    } catch (err) {
      console.error("receipt blur failed:", err);
      return NextResponse.json(
        {
          error:
            "could not redact this image. try another screenshot, or wait a moment and retry.",
        },
        { status: 502 }
      );
    }
  }

  const objectPath = `${packId}/${postId}.${storedExt}`;
  const { error: uploadError } = await supabase.storage
    .from("posts")
    .upload(objectPath, storedBuffer, {
      contentType: storedContentType,
      upsert: false,
    });
  if (uploadError) {
    return NextResponse.json(
      { error: `upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: post, error: insertError } = await supabase
    .from("posts")
    .insert({
      id: postId,
      pack_id: packId,
      author_id: user.id,
      kind,
      image_url: objectPath,
      local_date: localDate,
    })
    .select("id, pack_id, kind, image_url, local_date, created_at")
    .single();

  if (insertError || !post) {
    await supabase.storage.from("posts").remove([objectPath]);
    return NextResponse.json(
      {
        error:
          insertError?.message ?? "could not write post; storage rolled back",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ post });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { data: post, error: lookupError } = await supabase
    .from("posts")
    .select("id, image_url, author_id")
    .eq("id", id)
    .maybeSingle();

  if (lookupError || !post) {
    return NextResponse.json({ error: "post not found" }, { status: 404 });
  }
  if (post.author_id !== user.id) {
    return NextResponse.json({ error: "not your post" }, { status: 403 });
  }

  const { error: deleteRowError } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);

  if (deleteRowError) {
    return NextResponse.json(
      { error: deleteRowError.message },
      { status: 500 }
    );
  }

  await supabase.storage.from("posts").remove([post.image_url]);

  return NextResponse.json({ ok: true });
}
