import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PhotoComposer } from "@/components/photo-composer";

type Membership = {
  is_home: boolean;
  pack: {
    id: string;
    name: string;
    icon: string;
  } | null;
};

// YYYY-MM-DD in the given IANA timezone. Mirrors the client's
// localDate() in photo-composer so the server-side pre-check sees
// the same "today" the API enforces.
function todayIn(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(
      new Date()
    );
  } catch {
    return new Intl.DateTimeFormat("en-CA").format(new Date());
  }
}

export default async function PhotoPage({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/post/photo");

  const [{ data: memberData }, { data: profile }] = await Promise.all([
    supabase
      .from("pack_members")
      .select("is_home, pack:packs(id, name, icon)")
      .eq("user_id", user.id)
      .order("is_home", { ascending: false }),
    supabase.from("users").select("timezone").eq("id", user.id).maybeSingle(),
  ]);

  const memberships = ((memberData ?? []) as unknown as Membership[]).filter(
    (m) => m.pack
  );

  if (memberships.length === 0) redirect("/create-pack");

  const tz = profile?.timezone ?? "Etc/UTC";
  const today = todayIn(tz);

  const { data: existingPhoto } = await supabase
    .from("posts")
    .select("id")
    .eq("author_id", user.id)
    .eq("kind", "photo")
    .eq("local_date", today)
    .limit(1)
    .maybeSingle();

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
        {existingPhoto ? (
          <>
            <h1 className="font-h text-3xl font-black tracking-[-0.03em] mb-2">
              you already witnessed today.
            </h1>
            <p className="font-b text-sm text-[#888] mb-7">
              one shot per day. the next opens at sunrise in your timezone.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/wall"
                className="inline-block self-start font-m text-[11px] font-bold tracking-[0.08em] uppercase no-underline px-5 py-3 rounded-xl border-[2.5px] border-stroke bg-[#FFE15D] text-[#3D3408] shadow-[4px_4px_0_#1A1A1A] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_#1A1A1A] transition-transform"
              >
                back to wall
              </Link>
              <Link
                href="/post/receipt"
                className="font-m text-[11px] text-[#888] hover:text-stroke transition-colors no-underline"
              >
                drop a receipt instead →
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-h text-3xl font-black tracking-[-0.03em] mb-2">
              witness today.
            </h1>
            <p className="font-b text-sm text-[#888] mb-7">
              one shot. the camera points outward. whatever the lens sees is
              what your pack sees.
            </p>
            <PhotoComposer packs={packs} initialPackId={initial.pack!.id} />
          </>
        )}
      </main>
    </div>
  );
}
