import { createAdminClient } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/auth";
import { getUserSignals } from "@/lib/taste-signals";
import { getTasteMatches } from "@/lib/taste-match";
import { TYPE, SHADOW, imgSm, title as titleOf, typeWord as typeWordOf, type DropType } from "@/lib/item-render";
import TasteRead from "@/components/taste-read";
import { SignOutButton } from "@/components/sign-out-button";
import InstallPrompt from "@/components/install-prompt";
import PushToggle from "@/components/push-toggle";
import MuteDropsToggle from "@/components/mute-drops-toggle";
import ServicesSetter from "@/components/services-setter";
import MusicAppSetter from "@/components/music-app-setter";
import { cleanMusicApp } from "@/lib/music-apps";
import { redirect } from "next/navigation";

const MIN_SIGNALS = 5; // keep in sync with /api/read

type Read = { signature: string; tags: string[] };

// evidence titles come straight from drop data — a playlist-style track name
// can run 50+ chars and wrap the row into a paragraph. Keep each one short.
const trunc = (s: string) => (s.length > 30 ? s.slice(0, 29).trimEnd() + "…" : s);

export default async function You({ searchParams }: { searchParams: Promise<{ music?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const admin = createAdminClient();
  const incoming = cleanMusicApp((await searchParams)?.music);

  const [{ data: me }, signals, matches, { data: cachedRow }] = await Promise.all([
    admin.from("users").select("name, mute_drop_pings, services, music_app").eq("id", user.id).maybeSingle(),
    getUserSignals(admin, user.id),
    getTasteMatches(admin, user.id),
    admin.from("taste_reads").select("card_data").eq("user_id", user.id)
      .order("generated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const cached = (cachedRow?.card_data as Read | undefined) ?? null;
  const ready = signals.signalCount >= MIN_SIGNALS;

  return (
    <main className="max-w-[600px] mx-auto px-6 py-12 pb-28">
      <div className="font-m text-[11px] tracking-widest uppercase text-muted">profile</div>
      <h1 className="font-h text-4xl font-extrabold tracking-[-0.04em] mt-1.5">
        {(me?.name ?? "you").toLowerCase()}
      </h1>

      {/* taste that landed — two mirror numbers: your word in the group, and
          theirs in you. The quiet analytics keepsake (no charts, no streaks). */}
      {signals.recsLanded > 0 || signals.landedForYou > 0 ? (
        <div className="mt-6 rounded-[22px] border border-hair bg-stage px-5 py-5 shadow-[5px_5px_0_#7C5CE6]">
          <div className="font-m text-[10px] font-extrabold tracking-[0.13em] uppercase text-ink-2">taste that landed</div>
          <div className="mt-3.5 flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4 border-b border-hair pb-3">
              <p className="font-b text-[12px] text-muted leading-snug max-w-[220px]">the group ran with yours</p>
              <div className="font-h text-[44px] font-black leading-none text-ink tracking-[-0.04em] shrink-0">{signals.recsLanded}</div>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-b text-[12px] text-muted leading-snug max-w-[220px]">you ran with theirs</p>
              <div className="font-h text-[44px] font-black leading-none text-ink tracking-[-0.04em] shrink-0">{signals.landedForYou}</div>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-5 text-muted font-b text-sm">
          nothing&apos;s landed yet. drop something <span className="text-vibe-2">for</span> someone, or run with a rec.
        </p>
      )}

      {/* the taste read */}
      {ready || cached ? (
        <TasteRead initial={cached} />
      ) : (
        <p className="text-muted mt-6 font-b text-sm">
          soon: your taste signature. the shape of what you love, in one line.
          drop or save a few more things and it shows up here.
        </p>
      )}

      {/* what you're known for — your standout drops, big */}
      {signals.picks.length > 0 && (
        <div className="mt-10">
          <div className="font-m text-[11px] tracking-widest uppercase text-muted mb-3">what you&apos;re known for</div>
          <div className="grid grid-cols-3 gap-2.5">
            {signals.picks.map((p, i) => {
              const t = TYPE[p.type as DropType];
              const cover = imgSm(p);
              const showImg = !!cover && cover.startsWith("http");
              return (
                <div key={i}>
                  <div className={`relative aspect-[3/4] rounded-xl border-[2.5px] border-frame overflow-hidden flex items-end ${SHADOW[p.type as DropType]}`}
                    style={{ background: showImg ? undefined : t.color }}>
                    {showImg && <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent" />
                    <div className="relative font-h font-extrabold text-[13px] leading-[1.05] text-white p-2 line-clamp-3">{titleOf(p)}</div>
                  </div>
                  <div className="font-m text-[10px] font-bold uppercase tracking-wider mt-1.5" style={{ color: t.color }}>{typeWordOf(p)}</div>
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
          <div className="flex flex-col">
            {matches.map((m, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3 border-t border-hair py-3 first:border-t-0 first:pt-0">
                <div className="min-w-0">
                  <span className="font-h font-bold text-sm" title={`you & ${m.name}`}>you &amp; {m.name.split(" ")[0]}</span>
                  {m.evidence.length > 0 && (
                    <span className="font-b text-[13px] text-muted"> · you both love {m.evidence.map(trunc).join(", ")}</span>
                  )}
                </div>
                <span className="font-m text-sm font-bold text-vibe-2 shrink-0">{m.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* settings — quiet, tap-to-edit rows */}
      <div className="mt-12">
        <div className="font-m text-[11px] tracking-widest uppercase text-muted mb-3">settings</div>
        <div className="flex flex-col gap-2.5">
          <InstallPrompt inline />
          <ServicesSetter initial={me?.services ?? []} />
          <MusicAppSetter initial={me?.music_app ?? null} incoming={incoming} />
          {/* notifications — one group: the master switch, then what it pings about */}
          <div className="flex flex-col gap-1">
            <PushToggle />
            <MuteDropsToggle initialMuted={me?.mute_drop_pings ?? false} />
          </div>
        </div>
      </div>

      <div className="mt-10 pt-7 border-t border-hair text-center">
        <SignOutButton />
      </div>
    </main>
  );
}
