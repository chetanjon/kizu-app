import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReceiptComposer } from "@/components/receipt-composer";

type Membership = {
  is_home: boolean;
  pack: {
    id: string;
    name: string;
    icon: string;
  } | null;
};

export default async function ReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/post/receipt");

  const { data } = await supabase
    .from("pack_members")
    .select("is_home, pack:packs(id, name, icon)")
    .eq("user_id", user.id)
    .order("is_home", { ascending: false });

  const memberships = ((data ?? []) as unknown as Membership[]).filter(
    (m) => m.pack
  );

  if (memberships.length === 0) redirect("/create-pack");

  const { pack: packParam } = await searchParams;
  const initial =
    memberships.find((m) => m.pack!.id === packParam) ??
    memberships.find((m) => m.is_home) ??
    memberships[0];

  const packs = memberships.map((m) => ({
    id: m.pack!.id,
    name: m.pack!.name,
    icon: m.pack!.icon,
    is_home: m.is_home,
  }));

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
          paste a receipt.
        </h1>
        <p className="font-b text-sm text-[#888] mb-7">
          a screenshot from somewhere else. names and numbers should be covered
          first.
        </p>
        <ReceiptComposer packs={packs} initialPackId={initial.pack!.id} />
      </main>
    </div>
  );
}
