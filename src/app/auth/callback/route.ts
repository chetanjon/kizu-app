import { createClient } from "@/lib/supabase-server";
import { isValidTimezone, nextEmailTime } from "@/lib/sunset";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/wall";
  const browserTz = searchParams.get("tz");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const name =
          user.user_metadata.full_name ||
          user.user_metadata.name ||
          user.email!.split("@")[0];
        const avatarUrl = user.user_metadata.avatar_url || null;

        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (existing) {
          // Returning user — refresh OAuth-derived fields, leave tz / sunset_frequency / next_sunset_at alone.
          await supabase
            .from("users")
            .update({ email: user.email!, name, avatar_url: avatarUrl })
            .eq("id", user.id);
        } else {
          // First sign-in — capture browser tz and seed first-email schedule.
          const tz =
            browserTz && isValidTimezone(browserTz) ? browserTz : "Etc/UTC";
          const firstEmail = nextEmailTime({
            timezone: tz,
            frequency: "daily",
          });
          await supabase.from("users").insert({
            id: user.id,
            email: user.email!,
            name,
            avatar_url: avatarUrl,
            timezone: tz,
            next_sunset_at: firstEmail?.toISOString() ?? null,
          });
        }

        if (next === "/wall") {
          const { data: packs } = await supabase
            .from("pack_members")
            .select("pack_id")
            .eq("user_id", user.id)
            .limit(1);

          if (!packs || packs.length === 0) {
            return NextResponse.redirect(`${origin}/create-pack`);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
