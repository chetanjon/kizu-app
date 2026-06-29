import { createAdminClient } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/auth";
import { getUserSignals } from "@/lib/taste-signals";
import { getTasteMatches } from "@/lib/taste-match";
import { TYPE, title as titleOf, sub as subOf, type DropType } from "@/lib/item-render";
import TasteRead from "@/components/taste-read";
import { SignOutButton } from "@/components/sign-out-button";
import InstallPrompt from "@/components/install-prompt";
import PushToggle from "@/components/push-toggle";
import MuteDropsToggle from "@/components/mute-drops-toggle";
import { redirect } from "next/navigation";

const MIN_SIGNALS = 5; // keep in sync with /api/read

type Read = { signature: string; tags: string[] };

export default async function You() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const admin = createAdminClient();

  const [{ data: me }, signals, matches, { data: cachedRow }] = await Promise.all([
    admin.from("users").select("name, mute_drop_pings").eq("id", user.id).maybeSingle(),
    getUserSignals(admin, user.id),
    getTasteMatches(admin, user.id),
    admin.from("taste_reads").select("card_data").eq("user_id", user.id)
      .order("generated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const cached = (cachedRow?.card_data as Read | undefined) ?? null;
  const ready = signals.signalCount >= MIN_SIGNALS;

  return (
    <main className="max-w-[600px] mx-auto px-6 py-12">
      <div className="font-m text-[11px] tracking-widest uppercase text-muted">you</div>
      <h1 className="font-h text-4xl font-extrabold tracking-[-0.04em] mt-1.5">
        {(me?.name ?? "you").toLowerCase()}
      </h1>

      {/* the one number: how often people take your word for it */}
      <div className="mt-5">
        {signals.recsLanded > 0 ? (
          <p className="font-b text-ink">
            <span className="font-h text-2xl font-extrabold text-vibe tracking-[-0.03em]">{signals.recsLanded}</span>
            <span className="ml-2">{signals.recsLanded === 1 ? "person took your word for it." : "times your word landed."}</span>
          </p>
        ) : (
          <p className="text-muted font-b text-sm">
            no one&apos;s taken your word for it yet — drop something <span className="text-vibe">for</span> someone.
          </p>
        )}
      </div>

      {/* the taste read */}
      {ready || cached ? (
        <TasteRead initial={cached} />
      ) : (
        <p className="text-muted mt-6 font-b text-sm">
          soon: your taste signature — the shape of what you love, in one line.
          drop or queue a few more things and it shows up here.
        </p>
      )}

      {/* signature picks */}
      {signals.picks.length > 0 && (
        <div className="mt-10">
          <div className="font-m text-[11px] tracking-widest uppercase text-muted mb-3">your signature picks</div>
          <div className="flex flex-col gap-2.5">
            {signals.picks.map((p, i) => {
              const t = TYPE[p.type as DropType];
              return (
                <div key={i} className="flex items-center gap-3 border-[2px] border-ink rounded-xl px-3.5 py-2.5 bg-surface shadow-[2px_2px_0_#14110F]">
                  <span className="font-m text-[10px] font-bold rounded px-1.5 py-0.5 text-white shrink-0" style={{ background: t.color }}>{t.label}</span>
                  <div className="min-w-0">
                    <div className="font-h font-bold text-sm truncate">{titleOf(p)}</div>
                    {subOf(p) ? <div className="font-m text-[10px] text-muted truncate">{subOf(p)}</div> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* taste-match: who you actually share taste with */}
      {matches.length > 0 && (
        <div className="mt-10">
          <div className="font-m text-[11px] tracking-widest uppercase text-muted mb-3">taste in common</div>
          <div className="flex flex-col gap-2.5">
            {matches.map((m, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3 border-b-[2px] border-hair pb-2.5">
                <div className="min-w-0">
                  <span className="font-h font-bold text-sm">you &amp; {m.name}</span>
                  {m.evidence.length > 0 && (
                    <span className="font-b text-[13px] text-muted"> · you both love {m.evidence.join(", ")}</span>
                  )}
                </div>
                <span className="font-m text-sm font-bold text-vibe shrink-0">{m.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* settings + sign out (unchanged) */}
      <div className="mt-12 max-w-[420px] flex flex-col gap-3">
        <InstallPrompt inline />
        <PushToggle />
        <MuteDropsToggle initialMuted={me?.mute_drop_pings ?? false} />
      </div>
      <div className="mt-10 pt-8 border-t-[2px] border-hair">
        <SignOutButton />
      </div>
    </main>
  );
}
