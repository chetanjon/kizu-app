import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const name = body.name?.trim();

  if (!name || name.length > 30) {
    return NextResponse.json(
      { error: "Pod name must be 1-30 characters" },
      { status: 400 }
    );
  }

  // Ensure user exists in public.users (may have failed during auth callback due to RLS)
  await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email!,
      name:
        user.user_metadata.full_name ||
        user.user_metadata.name ||
        user.email!.split("@")[0],
      avatar_url: user.user_metadata.avatar_url || null,
    },
    { onConflict: "id" }
  );

  // Check if user already has a pod
  const { data: existing } = await supabase
    .from("pod_members")
    .select("pod_id")
    .eq("user_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "You are already in a pod" },
      { status: 400 }
    );
  }

  // Generate invite code via Postgres function
  const { data: code, error: rpcError } = await supabase.rpc(
    "generate_invite_code"
  );

  if (rpcError || !code) {
    return NextResponse.json(
      { error: "Failed to generate invite code" },
      { status: 500 }
    );
  }

  // Create the pod
  const { data: pod, error: podError } = await supabase
    .from("pods")
    .insert({
      name,
      invite_code: code,
      created_by: user.id,
    })
    .select("id, name, invite_code")
    .single();

  if (podError) {
    return NextResponse.json(
      { error: "Failed to create pod" },
      { status: 500 }
    );
  }

  // Add creator as first member
  const { error: memberError } = await supabase.from("pod_members").insert({
    pod_id: pod.id,
    user_id: user.id,
  });

  if (memberError) {
    return NextResponse.json(
      { error: "Failed to join pod" },
      { status: 500 }
    );
  }

  return NextResponse.json({ pod });
}
