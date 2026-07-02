// Invite-shaped skeleton: the wordmark is real, the invite card ghosts in.
// Ghost blocks must stay bg-white/[0.08]-[0.12] (bg-surface is invisible on paper).
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 animate-pulse">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-7">
          <span className="font-h text-3xl font-extrabold tracking-[-0.05em]">
            kizu<span className="text-red">.</span>
          </span>
        </div>
        <div className="rounded-[22px] border-[2.5px] border-frame p-8 text-center shadow-[8px_8px_0_#0D0B09]">
          <div className="h-3 w-32 rounded bg-white/[0.08] mx-auto" />
          <div className="mt-3 h-9 w-3/4 rounded bg-white/[0.12] mx-auto" />
          <div className="mt-4 h-3.5 w-full rounded bg-white/[0.08]" />
          <div className="mt-2 h-3.5 w-2/3 rounded bg-white/[0.08] mx-auto" />
          <div className="mt-7 h-12 w-full rounded-full bg-white/[0.12]" />
          <div className="mt-4 h-2.5 w-40 rounded bg-white/[0.08] mx-auto" />
        </div>
      </div>
    </div>
  );
}
