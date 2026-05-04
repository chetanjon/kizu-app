import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <main className="max-w-[420px] w-full text-center">
        <div className="font-m text-[11px] font-bold tracking-[0.08em] uppercase text-[#888] mb-4">
          404
        </div>
        <h1 className="font-h text-4xl font-black tracking-[-0.03em] mb-3">
          the moment passed.
        </h1>
        <p className="font-b text-sm text-[#888] mb-8">
          it always does. nothing here, or nothing here anymore.
        </p>
        <Link
          href="/wall"
          className="inline-block font-m text-[11px] font-bold tracking-[0.08em] uppercase no-underline px-5 py-3 rounded-xl border-[2.5px] border-stroke bg-[#FFE15D] text-[#3D3408] shadow-[4px_4px_0_#1A1A1A] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_#1A1A1A] transition-transform"
        >
          back to the wall
        </Link>
      </main>
    </div>
  );
}
