import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Pill } from "@/components/ui";

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getTitle(wins: number) {
  if (wins >= 50) return "Legend";
  if (wins >= 30) return "Scarred";
  if (wins >= 20) return "Veteran";
  if (wins >= 10) return "Tested";
  if (wins >= 5) return "Clean";
  return "Unproven";
}

export default async function Profile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: userData } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();

  const myName = userData?.name || user.email?.split("@")[0] || "You";
  const myInitials = getInitials(myName);

  const { data: membership } = await supabase
    .from("pod_members")
    .select("pod_id, wins, losses, current_streak")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) redirect("/create-pod");

  const wins = membership.wins;
  const losses = membership.losses;
  const streak = membership.current_streak;
  const title = getTitle(wins);

  // Get all bets for Receipt Wall
  const { data: bets } = await supabase
    .from("bets")
    .select("id, goal_text, week_start, status")
    .eq("user_id", user.id)
    .eq("pod_id", membership.pod_id)
    .order("week_start", { ascending: false })
    .limit(20);

  // Get checkins for these bets
  const betIds = (bets || []).map((b) => b.id);
  const { data: checkins } = betIds.length
    ? await supabase.from("checkins").select("bet_id, result").in("bet_id", betIds)
    : { data: [] };

  const checkinMap = new Map((checkins || []).map((c) => [c.bet_id, c.result]));

  // Build wall data
  const wall = (bets || []).map((b, i) => {
    const result = checkinMap.get(b.id) || null;
    return {
      week: (bets || []).length - i,
      goal: b.goal_text,
      result,
    };
  });

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="max-w-[700px] w-full py-12">
        {/* Top cards: Profile + Record */}
        <div className="grid grid-cols-2 gap-3.5 mb-7">
          {/* Profile card — purple */}
          <div className="bg-purple rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-[26px]">
            <div className="flex items-center gap-3.5">
              <div className="w-[60px] h-[60px] rounded-xl border-2 border-stroke flex items-center justify-center font-m text-lg font-bold bg-white shrink-0">
                {myInitials}
              </div>
              <div>
                <div className="font-h text-[26px] font-bold">{myName}</div>
                <div className="flex gap-1.5 mt-1.5">
                  <Pill bg="bg-lime">{title.toUpperCase()}</Pill>
                  {streak > 0 && <Pill bg="bg-yellow">{streak}W 🔥</Pill>}
                </div>
              </div>
            </div>
          </div>

          {/* Record card — black */}
          <div className="bg-stroke rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-[26px] flex flex-col justify-center">
            <div className="font-m text-[10px] font-bold text-[#666] tracking-[0.1em] mb-2.5">
              RECORD
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-h text-[62px] font-black text-white leading-none tracking-[-0.04em]">
                {wins}
              </span>
              <span className="font-m text-2xl text-[#444]">–</span>
              <span className="font-h text-[46px] font-black text-red leading-none">
                {losses}
              </span>
            </div>
          </div>
        </div>

        {/* Receipt Wall */}
        <div className="font-m text-[11px] font-bold text-[#7A7A7A] tracking-[0.08em] mb-3.5">
          RECEIPT WALL
        </div>
        <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[44px_16px_1fr_auto] gap-2.5 items-center px-[22px] py-3 border-b-[2.5px] border-stroke">
            <span className="font-m text-[9px] font-bold text-[#888]">WK</span>
            <span />
            <span className="font-m text-[9px] font-bold text-[#888]">GOAL</span>
            <span className="font-m text-[9px] font-bold text-[#888]">RESULT</span>
          </div>

          {wall.length === 0 ? (
            <div className="px-[22px] py-8 text-center font-b text-sm text-[#AAA]">
              No bets yet. Your wall is clean — for now.
            </div>
          ) : (
            wall.map((r, i) => (
              <div key={i}>
                <div className="grid grid-cols-[44px_16px_1fr_auto] gap-2.5 items-center px-[22px] py-3.5">
                  <span className="font-m text-xs font-bold text-[#888]">
                    W{r.week}
                  </span>
                  <div
                    className={`w-2.5 h-2.5 rounded border-2 border-stroke ${
                      r.result === "delivered"
                        ? "bg-green"
                        : r.result === "missed"
                          ? "bg-red"
                          : r.result === "halfway"
                            ? "bg-orange"
                            : "bg-bg"
                    }`}
                  />
                  <div className="font-b text-[13px] leading-[1.5]">
                    {r.goal}
                  </div>
                  {r.result ? (
                    <Pill
                      bg={
                        r.result === "delivered"
                          ? "bg-lime"
                          : r.result === "missed"
                            ? "bg-pink"
                            : "bg-yellow"
                      }
                    >
                      {r.result.toUpperCase()}
                    </Pill>
                  ) : (
                    <Pill bg="bg-bg">OPEN</Pill>
                  )}
                </div>
                {i < wall.length - 1 && (
                  <div className="border-t-[1.5px] border-dashed border-black/12" />
                )}
              </div>
            ))
          )}
        </div>
        <p className="font-m text-[11px] font-bold text-[#888] text-center mt-4">
          THE WALL DOESN&apos;T LIE.
        </p>
      </div>
    </div>
  );
}
