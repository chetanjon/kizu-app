import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <main className="max-w-[420px] w-full text-center">
        <div className="font-m text-[11px] font-bold tracking-[0.12em] uppercase text-muted mb-4">
          404
        </div>
        <h1 className="font-h text-4xl font-black tracking-[-0.04em] mb-3">
          nothing here.
        </h1>
        <p className="font-b text-sm text-ink-2 mb-8">
          that page moved or never was. your people are back home.
        </p>
        <Link
          href="/home"
          className="inline-block font-h text-sm font-bold no-underline px-5 py-3 rounded-full border-[2.5px] border-ink bg-vibe text-white shadow-[3px_3px_0_#14110F] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_#14110F] transition-transform"
        >
          back to kizu<span className="text-red">.</span>
        </Link>
      </main>
    </div>
  );
}
