import { createClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import ThemeToggle from "@/components/theme-toggle";

// Phase 6 builds the real "taste read" here (behavioral read + recs-that-landed
// + signature picks). Placeholder for now, but it owns sign-out.
export default async function You() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: me } = user
    ? await supabase.from("users").select("name").eq("id", user.id).maybeSingle()
    : { data: null };

  return (
    <main className="max-w-[600px] mx-auto px-6 py-12">
      <div className="font-m text-[11px] tracking-widest uppercase text-muted">you</div>
      <h1 className="font-h text-4xl font-extrabold tracking-[-0.04em] mt-1.5">
        {(me?.name ?? "you").toLowerCase()}
      </h1>
      <p className="text-muted mt-3 font-b">
        soon: kizu will read your taste back to you — the patterns you can&apos;t see
        yourself, and how often people take your word for it.
      </p>
      <p className="font-m text-[11px] text-muted mt-6">your read is coming.</p>

      <div className="mt-10 pt-8 border-t-[2px] border-hair">
        <ThemeToggle />
      </div>
      <div className="mt-8 pt-8 border-t-[2px] border-hair">
        <SignOutButton />
      </div>
    </main>
  );
}
