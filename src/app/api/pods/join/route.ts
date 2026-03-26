import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Look up pod
  const { data: pod, error: podError } = await supabase
    .from("pods")
    .select("id, name")
    .eq("invite_code", code.toUpperCase())
    .single();

  if (podError || !pod) {
    return NextResponse.json({ error: "Pod not found" }, { status: 404 });
  }

  // Get member count
  const { count } = await supabase
    .from("pod_members")
    .select("id", { count: "exact", head: true })
    .eq("pod_id", pod.id);

  // Check if already a member
  const { data: membership } = await supabase
    .from("pod_members")
    .select("id")
    .eq("pod_id", pod.id)
    .eq("user_id", user.id)
    .limit(1);

  return NextResponse.json({
    pod,
    memberCount: count || 0,
    alreadyMember: (membership && membership.length > 0) || false,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const code = body.code?.trim()?.toUpperCase();

  if (!code) {
    return NextResponse.json(
      { error: "Invite code is required" },
      { status: 400 }
    );
  }

  // Look up pod
  const { data: pod, error: podError } = await supabase
    .from("pods")
    .select("id, name")
    .eq("invite_code", code)
    .single();

  if (podError || !pod) {
    return NextResponse.json({ error: "Pod not found" }, { status: 404 });
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("pod_members")
    .select("id")
    .eq("pod_id", pod.id)
    .eq("user_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "You are already in this pod" },
      { status: 400 }
    );
  }

  // Check member count
  const { count } = await supabase
    .from("pod_members")
    .select("id", { count: "exact", head: true })
    .eq("pod_id", pod.id);

  if ((count || 0) >= 5) {
    return NextResponse.json(
      { error: "This pod is full (5/5 members)" },
      { status: 400 }
    );
  }

  // Join the pod
  const { error: joinError } = await supabase.from("pod_members").insert({
    pod_id: pod.id,
    user_id: user.id,
  });

  if (joinError) {
    return NextResponse.json(
      { error: "Failed to join pod" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, podId: pod.id });
}
