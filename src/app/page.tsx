import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

// "/" is the ONE public page — invite-only app lives behind it.
// Authed people skip straight to the app; everyone else (and Google) gets
// something real to read instead of a bounce to /login.
export default async function Landing() {
  const user = await getCurrentUser();
  if (user) redirect("/home");

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 h-16">
        <span className="font-h text-2xl font-extrabold tracking-[-0.05em]">
          kizu<span className="text-red">.</span>
        </span>
        <Link
          href="/login"
          className="font-m text-xs font-bold border-[2px] border-ink rounded-full px-4 py-2 bg-surface hover:-translate-y-[1px] transition-transform"
        >
          enter
        </Link>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-[860px] mx-auto w-full px-6 sm:px-10 py-16">
        <div className="font-m text-[11px] tracking-widest uppercase text-muted">
          a private taste space · invite-only
        </div>
        <h1 className="font-h font-extrabold tracking-[-0.045em] leading-[0.95] text-[clamp(2.75rem,9vw,5.5rem)] mt-3">
          good taste runs<br />in the <span className="text-vibe">group</span>
          <span className="text-red">.</span>
        </h1>
        <p className="font-b text-lg text-ink-2 mt-6 max-w-[520px] leading-snug">
          drop the movies, music, and places you love into one space with your
          people. queue what to do tonight. let an AI read your group&apos;s vibe
          back to you.
        </p>

        <div className="flex flex-wrap gap-2 mt-7 font-m text-[11px] font-bold">
          <span className="border-[2px] border-ink rounded-md px-2.5 py-1" style={{ background: "#2F6FE0", color: "#fff" }}>movies</span>
          <span className="border-[2px] border-ink rounded-md px-2.5 py-1" style={{ background: "#E0567E", color: "#fff" }}>music</span>
          <span className="border-[2px] border-ink rounded-md px-2.5 py-1" style={{ background: "#1B8A6B", color: "#fff" }}>outside</span>
        </div>

        <div className="mt-10 flex items-center gap-5">
          <Link
            href="/login"
            className="font-h font-bold text-base bg-vibe text-white border-[2.5px] border-ink rounded-full px-7 py-3 shadow-[5px_5px_0_#14110F] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] transition-transform"
          >
            enter your space
          </Link>
          <span className="font-m text-[11px] text-muted">no download · in your browser</span>
        </div>
      </main>

      <footer className="px-6 sm:px-10 py-8 font-m text-[11px] text-muted">
        kizu<span className="text-red">.</span> · joined by people you trust, never a public feed
      </footer>
    </div>
  );
}
