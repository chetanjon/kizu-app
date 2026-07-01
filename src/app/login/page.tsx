"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase-browser";

function LoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/home";

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <h1 className="font-h text-5xl font-extrabold tracking-[-0.05em]">
            kizu<span className="text-red">.</span>
          </h1>
          <p className="font-b text-[15px] text-muted mt-3 leading-snug">
            a private taste space for<br />you and your people.
          </p>
        </div>

        <div className="bg-surface rounded-[22px] border-[2.5px] border-frame shadow-[8px_8px_0_#7C5CE6] p-8">
          <h2 className="font-h text-2xl font-extrabold tracking-[-0.03em] mb-1">sign in</h2>
          <p className="font-b text-sm text-muted mb-7">good taste runs in the group.</p>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 rounded-xl border-[2.5px] border-frame bg-surface-2 font-h font-bold text-[15px] px-6 py-3.5 shadow-[4px_4px_0_#0D0B09] transition-transform duration-100 hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            continue with google
          </button>
        </div>

        <p className="font-m text-[10px] text-muted text-center mt-6">
          no download · works in your browser
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
