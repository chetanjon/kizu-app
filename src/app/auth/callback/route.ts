import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Upsert user into public.users table
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
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

        // If no explicit redirect, check if user has a pod
        if (next === "/dashboard") {
          const { data: pods } = await supabase
            .from("pod_members")
            .select("pod_id")
            .eq("user_id", user.id)
            .limit(1);

          if (!pods || pods.length === 0) {
            return NextResponse.redirect(`${origin}/create-pod`);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error — redirect to login
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
