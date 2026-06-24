import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name =
          user.user_metadata.full_name ||
          user.user_metadata.name ||
          user.email!.split("@")[0];
        const avatarUrl = user.user_metadata.avatar_url || null;

        const { data: existing } = await supabase
          .from("users").select("id").eq("id", user.id).maybeSingle();

        if (existing) {
          await supabase.from("users")
            .update({ email: user.email!, name, avatar_url: avatarUrl })
            .eq("id", user.id);
        } else {
          await supabase.from("users")
            .insert({ id: user.id, email: user.email!, name, avatar_url: avatarUrl });
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
