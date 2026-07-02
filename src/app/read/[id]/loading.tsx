// Read-shaped skeleton: kicker + headline + the vibe card + act-on-it rows.
// Ghost blocks must stay bg-white/[0.08]-[0.12] (bg-surface is invisible on paper).
export default function Loading() {
  return (
    <main className="max-w-[480px] mx-auto px-5 py-10 animate-pulse">
      <div className="h-3 w-28 rounded bg-white/[0.08]" />
      <div className="mt-2 mb-6 h-6 w-64 rounded bg-white/[0.12]" />
      <div className="aspect-[4/5] rounded-[24px] border-[2.5px] border-frame bg-white/[0.08]" />
      <div className="mt-8 h-3 w-20 rounded bg-white/[0.08]" />
      <div className="mt-3 flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3 border border-hair rounded-2xl px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="h-4 w-2/3 rounded bg-white/[0.12]" />
              <div className="mt-1.5 h-2.5 w-14 rounded bg-white/[0.08]" />
            </div>
            <div className="h-8 w-24 rounded-full bg-white/[0.08] shrink-0" />
          </div>
        ))}
      </div>
    </main>
  );
}
