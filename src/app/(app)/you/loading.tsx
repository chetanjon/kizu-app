// Profile-shaped skeleton: name, the taste-that-landed card, the picks grid.
export default function Loading() {
  return (
    <main className="max-w-[600px] mx-auto px-6 py-12 pb-28 animate-pulse">
      <div className="h-3 w-16 rounded bg-white/[0.08]" />
      <div className="mt-3 h-9 w-40 rounded bg-white/[0.08]" />
      <div className="mt-6 h-36 rounded-[22px] border border-hair bg-white/[0.08]" />
      <div className="mt-10 h-3 w-40 rounded bg-white/[0.08]" />
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-white/[0.08]" />
        ))}
      </div>
    </main>
  );
}
