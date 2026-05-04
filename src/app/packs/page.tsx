import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PackActions } from "@/components/pack-actions";
import { avatarBgFor, initialsOf } from "@/lib/format";

export const dynamic = "force-dynamic";

type Membership = {
  is_home: boolean;
  joined_at: string;
  pack: {
    id: string;
    name: string;
    invite_code: string;
    color_a: string;
    color_b: string;
    icon: string;
    founding_date: string;
    created_by: string;
  } | null;
};

type Member = {
  user_id: string;
  is_home: boolean;
  joined_at: string;
  user: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
};

function formatFounding(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PacksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/packs");

  const { data: rawMemberships } = await supabase
    .from("pack_members")
    .select(
      "is_home, joined_at, pack:packs(id, name, invite_code, color_a, color_b, icon, founding_date, created_by)"
    )
    .eq("user_id", user.id)
    .order("is_home", { ascending: false })
    .order("joined_at", { ascending: true });

  const memberships = ((rawMemberships ?? []) as unknown as Membership[]).filter(
    (m) => m.pack
  );

  const packIds = memberships.map((m) => m.pack!.id);
  let membersByPack: Record<string, Member[]> = {};
  if (packIds.length > 0) {
    const { data: rawMembers } = await supabase
      .from("pack_members")
      .select(
        "pack_id, user_id, is_home, joined_at, user:users(id, name, avatar_url)"
      )
      .in("pack_id", packIds)
      .order("joined_at", { ascending: true });
    const grouped: Record<string, Member[]> = {};
    for (const row of (rawMembers ?? []) as unknown as (Member & {
      pack_id: string;
    })[]) {
      const pid = row.pack_id;
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push(row);
    }
    membersByPack = grouped;
  }

  return (
    <div className="min-h-screen bg-bg">
      <nav className="border-b-[2.5px] border-stroke bg-bg sticky top-0 z-10">
        <div className="max-w-[820px] mx-auto px-6 flex justify-between items-center h-16">
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

      <main className="max-w-[820px] mx-auto px-6 py-10">
        <div className="flex items-baseline justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="font-h text-3xl font-black tracking-[-0.03em] mb-1">
              your packs.
            </h1>
            <p className="font-b text-sm text-[#888]">
              {memberships.length === 0
                ? "you are not in a pack yet."
                : `${memberships.length} ${
                    memberships.length === 1 ? "pack" : "packs"
                  }. up to 5.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/create-pack"
              className="font-m text-[11px] font-bold tracking-[0.08em] uppercase no-underline px-4 py-2 rounded-lg border-[2.5px] border-stroke bg-yellow text-yellow-t shadow-[3px_3px_0_#1A1A1A] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_#1A1A1A] transition-transform"
            >
              + new pack
            </Link>
            <Link
              href="/join"
              className="font-m text-[11px] text-[#888] hover:text-stroke transition-colors no-underline"
            >
              join with code
            </Link>
          </div>
        </div>

        {memberships.length === 0 ? (
          <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8 text-center">
            <p className="font-b text-sm text-[#888] mb-5">
              nothing yet. that&apos;s not nothing.
            </p>
            <Link
              href="/create-pack"
              className="inline-block font-m text-[11px] font-bold tracking-[0.08em] uppercase no-underline px-5 py-3 rounded-lg border-[2.5px] border-stroke bg-yellow text-yellow-t shadow-[4px_4px_0_#1A1A1A] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_#1A1A1A] transition-transform"
            >
              start your first pack
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {memberships.map((m) => {
              const pack = m.pack!;
              const members = membersByPack[pack.id] ?? [];
              const isCreator = pack.created_by === user.id;
              return (
                <article
                  key={pack.id}
                  className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] overflow-hidden"
                >
                  <div
                    className="h-2 w-full"
                    style={{
                      background: `linear-gradient(90deg, ${pack.color_a} 0%, ${pack.color_b} 100%)`,
                    }}
                  />
                  <div className="p-7">
                    <header className="flex items-start gap-4 mb-5 flex-wrap">
                      <div
                        className="w-14 h-14 rounded-xl border-[2.5px] border-stroke flex items-center justify-center text-2xl shrink-0"
                        style={{ backgroundColor: pack.color_a }}
                      >
                        {pack.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h2 className="font-h text-2xl font-black tracking-[-0.02em]">
                            {pack.name}
                          </h2>
                          {m.is_home && (
                            <span className="font-m text-[9px] font-bold tracking-[0.12em] uppercase px-2 py-1 rounded-md border-2 border-stroke bg-yellow text-yellow-t">
                              home
                            </span>
                          )}
                          {isCreator && (
                            <span className="font-m text-[9px] font-bold tracking-[0.12em] uppercase px-2 py-1 rounded-md border-2 border-stroke bg-bg text-[#555]">
                              founder
                            </span>
                          )}
                        </div>
                        <div className="font-m text-[10px] text-[#888] tracking-wider uppercase">
                          since {formatFounding(pack.founding_date)} ·{" "}
                          {members.length}/{20}{" "}
                          {members.length === 1 ? "member" : "members"}
                        </div>
                      </div>
                      <Link
                        href={`/wall?pack=${pack.id}`}
                        className="font-m text-[10px] font-bold tracking-[0.08em] uppercase no-underline px-3 py-2 rounded-lg border-[2.5px] border-stroke bg-white shadow-[3px_3px_0_#1A1A1A] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_#1A1A1A] transition-transform"
                      >
                        wall →
                      </Link>
                    </header>

                    <div className="mb-6">
                      <div className="font-m text-[10px] font-bold tracking-[0.12em] uppercase text-[#888] mb-3">
                        the pack
                      </div>
                      <ul className="flex flex-col gap-2">
                        {members.map((mem) => {
                          const u = mem.user;
                          if (!u) return null;
                          const isYou = u.id === user.id;
                          const isFounder = pack.created_by === u.id;
                          return (
                            <li
                              key={mem.user_id}
                              className="flex items-center gap-3"
                            >
                              {u.avatar_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={u.avatar_url}
                                  alt={u.name ?? "member"}
                                  loading="lazy"
                                  className="w-8 h-8 rounded-full border-2 border-stroke object-cover bg-bg"
                                />
                              ) : (
                                <div
                                  className={`w-8 h-8 rounded-full border-2 border-stroke flex items-center justify-center font-m text-[10px] font-bold ${avatarBgFor(
                                    u.id
                                  )}`}
                                >
                                  {initialsOf(u.name)}
                                </div>
                              )}
                              <span className="font-b text-sm">
                                {u.name ?? "unnamed"}
                                {isYou && (
                                  <span className="font-m text-[10px] text-[#888] ml-1">
                                    (you)
                                  </span>
                                )}
                              </span>
                              {isFounder && (
                                <span className="font-m text-[9px] font-bold tracking-[0.12em] uppercase text-[#888]">
                                  founder
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div>
                      <div className="font-m text-[10px] font-bold tracking-[0.12em] uppercase text-[#888] mb-3">
                        invite code
                      </div>
                      <PackActions
                        packId={pack.id}
                        packName={pack.name}
                        inviteCode={pack.invite_code}
                        isHome={m.is_home}
                        membershipCount={memberships.length}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
