import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PostChooser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/post");

  const { count } = await supabase
    .from("pack_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) === 0) redirect("/create-pack");

  return (
    <div className="min-h-screen bg-bg">
      <nav className="border-b-[2.5px] border-stroke bg-bg sticky top-0 z-10">
        <div className="max-w-[640px] mx-auto px-6 flex justify-between items-center h-16">
          <Link
            href="/wall"
            className="font-m text-[11px] text-[#888] hover:text-stroke transition-colors no-underline"
          >
            ← back to wall
          </Link>
          <span className="font-h text-xl font-black tracking-[-0.03em]">
            kizu
          </span>
        </div>
      </nav>

      <main className="max-w-[640px] mx-auto px-6 py-10">
        <h1 className="font-h text-3xl font-black tracking-[-0.03em] mb-2">
          witness.
        </h1>
        <p className="font-b text-sm text-[#888] mb-7">
          two ways. pick one.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/post/photo"
            className="bg-yellow rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A] no-underline block"
          >
            <div className="font-m text-[10px] font-bold text-yellow-t opacity-60 tracking-[0.1em] mb-2">
              ONE A DAY
            </div>
            <div className="font-h text-2xl font-black text-yellow-t tracking-[-0.02em] mb-1">
              open the camera.
            </div>
            <p className="font-b text-[13px] text-yellow-t opacity-70 leading-relaxed">
              back camera only. one shot. no filters, no retakes. what the lens
              sees is what posts.
            </p>
          </Link>

          <Link
            href="/post/receipt"
            className="bg-blue rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A] no-underline block"
          >
            <div className="font-m text-[10px] font-bold text-blue-t opacity-60 tracking-[0.1em] mb-2">
              ANY TIME
            </div>
            <div className="font-h text-2xl font-black text-blue-t tracking-[-0.02em] mb-1">
              paste a receipt.
            </div>
            <p className="font-b text-[13px] text-blue-t opacity-70 leading-relaxed">
              a screenshot from somewhere else — a tweet, a thread, a stat. drop
              it in. cover names and numbers first.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
