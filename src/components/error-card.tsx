"use client";

// Shared boundary UI for error.tsx files. Kizu voice: quiet, direct, one action.
export default function ErrorCard({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-7">
          <span className="font-h text-3xl font-extrabold tracking-[-0.05em]">
            kizu<span className="text-red">.</span>
          </span>
        </div>
        <div className="bg-surface rounded-[22px] border-[2.5px] border-frame p-8 text-center shadow-[8px_8px_0_#0D0B09]">
          <h1 className="font-h text-2xl font-extrabold tracking-[-0.03em]">something broke.</h1>
          <p className="font-b text-sm text-muted mt-2">not you, us. give it another go.</p>
          <button
            onClick={reset}
            className="mt-6 font-h font-extrabold text-[15px] bg-vibe text-white border-[2.5px] border-frame rounded-full px-8 py-3 shadow-[4px_4px_0_#0D0B09] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-transform"
          >
            try again
          </button>
        </div>
      </div>
    </div>
  );
}
