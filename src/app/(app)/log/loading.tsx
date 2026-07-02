// Log-shaped skeleton: the centered deck card ghost.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[680px] px-4 pt-5 pb-28 min-h-[100dvh] flex flex-col items-center animate-pulse">
      <div className="mt-2 h-3 w-24 rounded bg-white/[0.08]" />
      <div className="mt-8 w-full flex items-center justify-center gap-4">
        <div className="w-[12%] aspect-[3/4] rounded-2xl bg-white/[0.08] opacity-50" />
        <div className="w-[58%] max-w-[320px] aspect-[3/4] rounded-3xl bg-white/[0.08]" />
        <div className="w-[12%] aspect-[3/4] rounded-2xl bg-white/[0.08] opacity-50" />
      </div>
      <div className="mt-6 h-4 w-40 rounded bg-white/[0.08]" />
      <div className="mt-2 h-3 w-24 rounded bg-white/[0.12]" />
    </main>
  );
}
