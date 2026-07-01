"use client";

import { createClient } from "@/lib/supabase-browser";

// One-tap sign-in used on the public landing page. Starts Google OAuth directly
// instead of routing to /login first, so a visitor never sees "sign in" twice.
export default function SignInButton({
  className,
  children,
  next = "/home",
}: {
  className?: string;
  children: React.ReactNode;
  next?: string;
}) {
  async function go() {
    const supabase = createClient();
    const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback },
    });
  }
  return (
    <button onClick={go} className={className}>
      {children}
    </button>
  );
}
