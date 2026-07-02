// Watchlist-shaped skeleton: kicker + headline ghosts, then thumb rows.
export default function Loading() {
  return (
    <main className="max-w-[700px] mx-auto px-6 py-10 animate-pulse">
      <div className="h-3 w-52 rounded bg-surface" />
      <div className="mt-3 h-9 w-64 rounded bg-surface" />
      <div className="mt-8 flex flex-col">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-t border-hair first:border-t-0">
            <div className="w-[56px] h-[84px] flex-none rounded-lg bg-surface" />
            <div className="flex-1">
              <div className="h-5 w-2/3 rounded bg-surface" />
              <div className="mt-2 h-3 w-1/3 rounded bg-surface-2" />
            </div>
            <div className="h-8 w-16 rounded-full bg-surface" />
          </div>
        ))}
      </div>
    </main>
  );
}
