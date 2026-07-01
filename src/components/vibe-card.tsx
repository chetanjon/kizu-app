// The presentational vibe-read card — aurora-framed title/body/tags. The read
// itself is one short 2–3 line paragraph that names the active people; there's
// no separate per-person section. Shared by the on-demand modal (vibe-read.tsx)
// and the weekly read page (/read/[id]) so the markup lives in one place.

export type Read = {
  title: string;
  body: string;
  tags: string[];
  top_picks: { type: string; title: string }[];
};

export default function VibeCard({ read }: { read: Read }) {
  return (
    <div className="rounded-[26px] overflow-hidden border-[3px] border-frame shadow-[9px_9px_0_#7C5CE6] text-white"
      style={{ background: "linear-gradient(135deg,#7C5CE6 0%,#FF6F9C 55%,#FF8A5B 100%)" }}>
      <div className="p-6" style={{ background: "linear-gradient(180deg,rgba(13,11,9,.10),rgba(13,11,9,.32))" }}>
        <div className="font-m text-[11px] font-bold tracking-[0.16em] opacity-90">✦ VIBE READ</div>
        <h2 className="font-h text-[30px] font-extrabold tracking-[-0.03em] leading-[1.05] mt-3" style={{ textShadow: "0 2px 16px rgba(0,0,0,.25)" }}>{read.title}</h2>
        <p className="text-[16px] leading-relaxed mt-4 opacity-95">{read.body}</p>

        {read.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {read.tags.map((t, i) => (
              <span key={i} className="font-m text-[11px] font-bold rounded-full px-3 py-1 border-2" style={{ background: "rgba(0,0,0,.22)", borderColor: "rgba(255,255,255,.5)" }}>{t}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,.25)" }}>
          <span className="font-h font-extrabold text-[17px] tracking-[-0.05em]">kizu<span style={{ color: "#FF2E4D" }}>.</span></span>
          <span className="font-m text-[10px] opacity-70">good taste runs in the group</span>
        </div>
      </div>
    </div>
  );
}
