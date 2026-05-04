import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const MAX = 200;

const cleanBody = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;
  const trimmed = raw.replace(/[\r\n]+/g, " ").trim();
  if (trimmed.length === 0 || trimmed.length > MAX) return null;
  return trimmed;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const json = await request.json();
  const postId = json.post_id;
  const body = cleanBody(json.body);

  if (typeof postId !== "string") {
    return NextResponse.json({ error: "post_id required" }, { status: 400 });
  }
  if (body === null) {
    return NextResponse.json(
      { error: `body must be 1–${MAX} chars` },
      { status: 400 }
    );
  }

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, body })
    .select("id, post_id, author_id, body, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "you already have a comment on this post" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const json = await request.json();
  const id = json.id;
  const body = cleanBody(json.body);

  if (typeof id !== "string") {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  if (body === null) {
    return NextResponse.json(
      { error: `body must be 1–${MAX} chars` },
      { status: 400 }
    );
  }

  const { data: comment, error } = await supabase
    .from("comments")
    .update({ body })
    .eq("id", id)
    .eq("author_id", user.id)
    .select("id, post_id, author_id, body, created_at, updated_at")
    .single();

  if (error || !comment) {
    return NextResponse.json(
      { error: error?.message ?? "comment not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ comment });
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

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
