import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Pill, SmallPill, Avatar } from "@/components/ui";
import { InviteButton } from "@/components/invite-button";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().split("T")[0];
}

function getTitle(wins: number) {
  if (wins >= 50) return "Legend";
  if (wins >= 30) return "Scarred";
  if (wins >= 20) return "Veteran";
  if (wins >= 10) return "Tested";
  if (wins >= 5) return "Clean";
  return "Unproven";
}

function getWeekNumber(podCreatedAt: string): number {
  const created = new Date(podCreatedAt);
  const now = new Date();
  const diff = now.getTime() - created.getTime();
  return Math.max(1, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)));
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

const AVATAR_COLORS = ["bg-lime", "bg-blue", "bg-pink", "bg-purple", "bg-orange"];

export default async function Dashboard() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get user's pod membership
  const { data: membership } = await supabase
    .from("pod_members")
    .select("pod_id, wins, losses, current_streak, pods(id, name, invite_code, created_at)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) redirect("/create-pod");

  const pod = membership.pods as unknown as {
    id: string;
    name: string;
    invite_code: string;
    created_at: string;
  };
  const myWins = membership.wins;
  const myLosses = membership.losses;
  const myStreak = membership.current_streak;
  const weekNum = getWeekNumber(pod.created_at);

  // Get user's display name
  const { data: userData } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();
  const myName = userData?.name || user.email?.split("@")[0] || "You";
  const myInitials = getInitials(myName);

  // Get all pod members with user info
  const { data: podMembers } = await supabase
    .from("pod_members")
    .select("user_id, wins, losses, current_streak, users(id, name)")
    .eq("pod_id", pod.id);

  const members = (podMembers || []).map((pm, i) => {
    const u = pm.users as unknown as { id: string; name: string };
    return {
      id: pm.user_id,
      name: u.name,
      initials: getInitials(u.name),
      wins: pm.wins,
      losses: pm.losses,
      streak: pm.current_streak,
      avatarBg: AVATAR_COLORS[i % AVATAR_COLORS.length],
    };
  });

  // Get current week's bets
  const monday = getCurrentMonday();
  const { data: bets } = await supabase
    .from("bets")
    .select("id, user_id, goal_text, status")
    .eq("pod_id", pod.id)
    .eq("week_start", monday);

  const betsMap = new Map(
    (bets || []).map((b) => [b.user_id, b])
  );

  // Get current week's checkins (through bets)
  const betIds = (bets || []).map((b) => b.id);
  const { data: checkins } = betIds.length
    ? await supabase
        .from("checkins")
        .select("bet_id, result, checked_in_at")
        .in("bet_id", betIds)
    : { data: [] };

  const checkinsByBet = new Map(
    (checkins || []).map((c) => [c.bet_id, c])
  );

  // Count sealed members
  const sealedCount = (checkins || []).length;

  // Get proof drops this week
  const { data: proofs } = betIds.length
    ? await supabase
        .from("proof_drops")
        .select("id, user_id, fires, created_at, bet_id")
        .in("bet_id", betIds)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: [] };

  // Get stares this week
  const { data: stares } = await supabase
    .from("stares")
    .select("id")
    .eq("pod_id", pod.id)
    .eq("week_start", monday);

  const stareCount = stares?.length || 0;
  const proofCount = proofs?.length || 0;

  // Find my bet for the brief
  const myBet = betsMap.get(user.id);

  // Days into the week
  const dayOfWeek = new Date().getDay();
  const dayNum = dayOfWeek === 0 ? 7 : dayOfWeek; // Mon=1, Sun=7
  const daysLeft = Math.max(0, 7 - dayNum);
  const dayNames = ["", "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <div className="flex min-h-screen bg-bg">
      {/* ═══ SIDEBAR ═══ */}
      <aside className="w-[220px] shrink-0 bg-white border-r-[2.5px] border-stroke flex flex-col h-screen sticky top-0">
        <div className="px-5 pb-5 pt-6 border-b-[2.5px] border-stroke">
          <span className="font-h text-[26px] font-black">Kizu</span>
        </div>

        <div className="p-3.5">
          <div className="bg-yellow rounded-xl border-[2.5px] border-stroke shadow-[3px_3px_0_#1A1A1A] p-[10px_12px] flex items-center gap-2.5 mb-4">
            <Avatar initials={myInitials} bg="bg-white" size="sidebar" />
            <div>
              <div className="font-b font-bold text-[13px]">{myName}</div>
              <div className="font-m text-[10px] font-bold">
                {myWins}–{myLosses}
              </div>
            </div>
          </div>

          <div className="bg-lime border-2 border-stroke shadow-[3px_3px_0_#1A1A1A] rounded-[10px] px-3.5 py-2.5 mb-1 font-b font-bold text-sm">
            Dashboard
          </div>
          <a href="/bet" className="block px-3.5 py-2.5 text-[#888] font-b text-sm hover:text-stroke transition-colors">
            Place Bet
          </a>
          <a href="/checkin" className="block px-3.5 py-2.5 text-[#888] font-b text-sm hover:text-stroke transition-colors">
            Check In
          </a>
          <a href="/drop" className="block px-3.5 py-2.5 text-[#888] font-b text-sm hover:text-stroke transition-colors">
            The Drop
          </a>
          <a href="/profile" className="block px-3.5 py-2.5 text-[#888] font-b text-sm hover:text-stroke transition-colors">
            Profile
          </a>
        </div>

        <div className="mt-auto px-5 py-3.5 border-t-[2.5px] border-stroke">
          <Pill bg="bg-bg">Week {weekNum}</Pill>
          <div className="font-m text-[10px] text-[#888] mt-1.5">
            {pod.name}
          </div>
          <InviteButton inviteCode={pod.invite_code} />
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 p-7">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-h text-[28px] font-black tracking-[-0.03em]">
              Dashboard
            </h1>
            <div className="font-m text-[11px] text-[#888] mt-1">
              Week {weekNum} // {pod.name}
            </div>
          </div>
          {daysLeft > 0 ? (
            <Pill bg="bg-red text-white">{daysLeft} DAYS LEFT</Pill>
          ) : (
            <Pill bg="bg-orange">THE DROP</Pill>
          )}
        </div>

        {/* ═══ BENTO GRID ═══ */}
        <div className="grid grid-cols-4 gap-3.5">
          {/* Brief — yellow, spans 2 */}
          <div className="col-span-2 bg-yellow rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] px-[26px] py-6 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
            <div className="font-m text-[10px] font-bold text-yellow-t opacity-45 tracking-[0.08em] mb-3">
              THE BRIEF // {dayNames[dayNum]}
            </div>
            {myBet ? (
              <>
                <div className="font-h text-[22px] font-bold text-yellow-t leading-[1.25] mb-2">
                  Day {dayNum} of &apos;{myBet.goal_text}&apos;
                </div>
                <div className="font-b text-[13px] text-yellow-t opacity-60 leading-relaxed">
                  {daysLeft === 0
                    ? "Today is the Drop. Sunset's coming."
                    : daysLeft === 1
                      ? "Tomorrow is the Drop. Are you done?"
                      : `${daysLeft} days left. Keep moving.`}
                </div>
              </>
            ) : (
              <>
                <div className="font-h text-[22px] font-bold text-yellow-t leading-[1.25] mb-2">
                  No bet placed yet.
                </div>
                <div className="font-b text-[13px] text-yellow-t opacity-60 leading-relaxed">
                  Place your first bet for this week. Direct it at someone.
                </div>
              </>
            )}
            {sealedCount > 0 && (
              <div className="flex gap-2 mt-3.5">
                {members
                  .filter((m) => {
                    const bet = betsMap.get(m.id);
                    return bet && checkinsByBet.has(bet.id);
                  })
                  .map((m) => (
                    <Pill key={m.id} bg="bg-white">
                      {m.name.split(" ")[0]} sealed
                    </Pill>
                  ))}
              </div>
            )}
          </div>

          {/* Countdown — white */}
          <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-6 text-center flex flex-col justify-center items-center transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
            <div className="font-m text-[10px] font-bold text-[#7A7A7A] tracking-[0.08em] uppercase mb-3">
              SUNSET
            </div>
            <div className="font-h text-5xl font-black tracking-[-0.04em] leading-none">
              6:47
            </div>
            <div className="font-m text-[11px] text-[#888] mt-1.5">
              PM Sunday
            </div>
          </div>

          {/* Sealed — lime */}
          <div className="bg-lime rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-6 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
            <div className="font-m text-[10px] font-bold text-lime-t opacity-45 tracking-[0.08em] mb-3">
              SEALED
            </div>
            <div className="font-h text-[52px] font-black text-lime-t leading-none">
              {sealedCount}
            </div>
            <div className="font-b text-[13px] font-semibold text-lime-t opacity-50 mt-1.5">
              / {members.length} members
            </div>
          </div>

          {/* Members — white, spans 3 */}
          <div className="col-span-3 bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] overflow-hidden transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
            <div className="px-[22px] py-3.5 border-b-[2.5px] border-stroke flex justify-between items-center">
              <span className="font-h text-base font-extrabold">Members</span>
              <Pill bg="bg-bg">{members.length} people</Pill>
            </div>
            {members.map((m, i) => {
              const bet = betsMap.get(m.id);
              const checkin = bet ? checkinsByBet.get(bet.id) : null;
              const isSealed = !!checkin;
              return (
                <div key={m.id}>
                  <div className="flex items-center gap-3 px-[22px] py-3">
                    <Avatar initials={m.initials} bg={m.avatarBg} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-b font-semibold text-[13px]">
                          {m.name}
                        </span>
                        <span className="font-m text-[11px] font-bold text-[#5A5A64]">
                          {m.wins}–{m.losses}
                        </span>
                        {m.streak > 0 && (
                          <SmallPill bg="bg-purple">
                            {m.streak}W 🔥
                          </SmallPill>
                        )}
                      </div>
                      <div className="font-b text-[11px] text-[#888] mt-0.5">
                        {bet ? bet.goal_text : "No bet yet"}
                      </div>
                    </div>
                    {bet ? (
                      <Pill bg={isSealed ? "bg-lime" : "bg-bg"}>
                        {isSealed ? "SEALED" : "OPEN"}
                      </Pill>
                    ) : (
                      <Pill bg="bg-bg">NO BET</Pill>
                    )}
                  </div>
                  {i < members.length - 1 && (
                    <div className="border-t-[1.5px] border-dashed border-black/12" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Proofs + Stares stacked */}
          <div className="flex flex-col gap-3.5">
            <div className="bg-purple rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-5 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-m text-[10px] font-bold text-purple-t opacity-45 tracking-[0.08em] mb-2">
                PROOFS
              </div>
              <div className="font-h text-[40px] font-black text-purple-t leading-none">
                {proofCount}
              </div>
              <div className="font-b text-xs font-semibold text-purple-t opacity-50 mt-1">
                this week
              </div>
            </div>

            <div className="bg-pink rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-5 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-m text-[10px] font-bold text-pink-t opacity-45 tracking-[0.08em] mb-2">
                STARES
              </div>
              <div className="font-h text-[40px] font-black text-pink-t leading-none">
                {stareCount}
              </div>
              <div className="font-b text-xs font-semibold text-pink-t opacity-50 mt-1">
                this week
              </div>
            </div>
          </div>

          {/* Proof Drops — white, spans 2 */}
          <div className="col-span-2 bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] px-[22px] py-5 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
            <div className="font-h text-base font-extrabold mb-3">
              Proof Drops
            </div>
            {(proofs || []).length === 0 ? (
              <div className="font-b text-sm text-[#AAA] py-4">
                No proofs yet this week.
              </div>
            ) : (
              (proofs || []).map((p, i) => {
                const member = members.find((m) => m.id === p.user_id);
                return (
                  <div key={p.id}>
                    <div className="flex items-center gap-2.5 py-2.5">
                      <Avatar
                        initials={member ? member.initials.charAt(0) : "?"}
                        bg={member?.avatarBg || "bg-bg"}
                        size="small"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-b font-semibold text-xs">
                            {member?.name.split(" ")[0] || "Unknown"}
                          </span>
                          <span className="font-m text-[9px] text-[#AAA]">
                            {timeAgo(p.created_at)}
                          </span>
                        </div>
                      </div>
                      <SmallPill bg="bg-orange">🔥{p.fires}</SmallPill>
                    </div>
                    {i < (proofs || []).length - 1 && (
                      <div className="border-t-[1.5px] border-dashed border-black/12" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Record — black, spans 2 */}
          <div className="col-span-2 bg-stroke rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-[26px]">
            <div className="font-m text-[10px] font-bold text-[#555] tracking-[0.1em] mb-3.5">
              YOUR RECORD
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-h text-[68px] font-black text-white leading-none tracking-[-0.04em]">
                {myWins}
              </span>
              <span className="font-m text-[26px] text-[#444]">–</span>
              <span className="font-h text-[50px] font-black text-red leading-none">
                {myLosses}
              </span>
            </div>
            <div className="flex gap-2 mt-4">
              <Pill bg="bg-lime">{getTitle(myWins).toUpperCase()}</Pill>
              {myStreak > 0 && (
                <Pill bg="bg-purple">{myStreak}W 🔥</Pill>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
