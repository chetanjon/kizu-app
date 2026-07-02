// Home-shaped skeleton — paints the instant you tap the tab, so the nav never
// feels dead while the server renders. Ghost blocks only; the wordmark is real.
export default function Loading() {
  return (
    <div className="min-h-screen pb-28 animate-pulse">
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 h-16 border-b border-hair">
        <span className="font-h text-2xl font-extrabold tracking-[-0.05em]">kizu<span className="text-red">.</span></span>
        <div className="flex items-center gap-3">
          <div className="w-24 h-9 rounded-full bg-surface" />
          <div className="w-9 h-9 rounded-full bg-surface" />
        </div>
      </header>
      <main className="max-w-[600px] mx-auto px-5 py-6">
        {/* the read pill */}
        <div className="w-44 h-11 rounded-full bg-surface" />
        {/* the reel strip */}
        <div className="mt-9 h-3 w-32 rounded bg-surface" />
        <div className="mt-3 flex gap-3 overflow-hidden">
          <div className="w-[240px] aspect-[16/9] flex-none rounded-[14px] bg-surface" />
          <div className="w-[240px] aspect-[16/9] flex-none rounded-[14px] bg-surface" />
        </div>
        {/* the tabs pill */}
        <div className="mt-7 h-10 w-56 rounded-full bg-surface" />
        {/* feed cards */}
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4 py-6 border-t border-hair first:border-t-0 mt-2">
            <div className="w-[116px] h-[174px] flex-none rounded-[12px] bg-surface" />
            <div className="flex-1 flex flex-col">
              <div className="h-6 rounded-md bg-surface" />
              <div className="mt-3 h-6 w-3/4 rounded bg-surface-2" />
              <div className="mt-2 h-4 w-1/2 rounded bg-surface-2" />
              <div className="mt-auto flex items-center gap-2 pt-3">
                <div className="w-[26px] h-[26px] rounded-full bg-surface" />
                <div className="h-3 w-20 rounded bg-surface" />
                <div className="ml-auto h-8 w-20 rounded-full bg-surface" />
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
