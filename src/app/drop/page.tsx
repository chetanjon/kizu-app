"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Pill } from "@/components/ui";

const AVATAR_COLORS = ["bg-lime", "bg-blue", "bg-pink", "bg-purple", "bg-orange"];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

type MemberResult = {
  name: string;
  initials: string;
  record: string;
  bet: string;
  result: string | null; // delivered, halfway, missed, or null (no checkin)
  color: string;
};

export default function TheDrop() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [dropState, setDropState] = useState<"wait" | "dropping" | "done">("wait");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("pod_members")
        .select("pod_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) return;

      // Get current week
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.getFullYear(), now.getMonth(), diff);
      const weekStart = monday.toISOString().split("T")[0];

      // Get all members
      const { data: podMembers } = await supabase
        .from("pod_members")
        .select("user_id, wins, losses, users(id, name)")
        .eq("pod_id", membership.pod_id);

      // Get bets
      const { data: bets } = await supabase
        .from("bets")
        .select("id, user_id, goal_text")
        .eq("pod_id", membership.pod_id)
        .eq("week_start", weekStart);

      const betIds = (bets || []).map((b) => b.id);
      const betsMap = new Map((bets || []).map((b) => [b.user_id, b]));

      // Get checkins
      const { data: checkins } = betIds.length
        ? await supabase.from("checkins").select("bet_id, result").in("bet_id", betIds)
        : { data: [] };

      const checkinMap = new Map((checkins || []).map((c) => [c.bet_id, c.result]));

      const memberResults = (podMembers || []).map((pm, i) => {
        const u = pm.users as unknown as { id: string; name: string };
        const bet = betsMap.get(pm.user_id);
        const result = bet ? checkinMap.get(bet.id) || null : null;
        return {
          name: u.name,
          initials: getInitials(u.name),
          record: `${pm.wins}–${pm.losses}`,
          bet: bet?.goal_text || "No bet",
          result,
          color: AVATAR_COLORS[i % AVATAR_COLORS.length],
        };
      });

      setMembers(memberResults);
      setLoading(false);
    }
    load();
  }, []);

  const triggerDrop = () => {
    if (dropState !== "wait") return;
    setDropState("dropping");
    members.forEach((_, i) => {
      setTimeout(() => setRevealed((prev) => [...prev, i]), 400 + i * 600);
    });
    setTimeout(
      () => setDropState("done"),
      400 + members.length * 600 + 400
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="font-h text-xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="max-w-[700px] w-full py-12">
        <h1 className="font-h text-[44px] font-black tracking-[-0.04em]">
          The Sunday Drop.
        </h1>
        <p className="font-m text-xs text-[#888] mt-1.5 mb-8">
          Results reveal at sunset. One by one.
        </p>

        {/* Countdown / trigger state */}
        {dropState === "wait" && (
          <div className="bg-stroke rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] text-center px-7 py-14 mb-4">
            <div className="font-h text-[88px] font-black text-white leading-none tracking-[-0.06em]">
              6:47
            </div>
            <div className="mt-3.5">
              <Pill bg="bg-orange">SUNSET IN 2H 14M</Pill>
            </div>
            <p className="font-b text-sm text-[#888] mt-6 max-w-[280px] mx-auto leading-relaxed">
              Results are sealed. At sunset, they reveal one by one.
            </p>
            <div className="mt-7">
              <button
                onClick={triggerDrop}
                className="rounded-xl border-[2.5px] border-stroke bg-yellow text-yellow-t font-b font-bold text-[15px] px-9 py-3.5 shadow-[4px_4px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A] cursor-pointer"
              >
                Trigger the Drop →
              </button>
            </div>
          </div>
        )}

        {/* Reveal state */}
        {dropState !== "wait" && (
          <div className="flex flex-col gap-2.5">
            {members.map((m, i) => {
              const isRevealed = revealed.includes(i);
              const bgClass = isRevealed
                ? m.result === "delivered"
                  ? "bg-lime"
                  : m.result === "missed"
                    ? "bg-pink"
                    : m.result === "halfway"
                      ? "bg-yellow"
                      : "bg-white"
                : "bg-white";
              const textColor = isRevealed
                ? m.result === "delivered"
                  ? "text-lime-t"
                  : m.result === "missed"
                    ? "text-pink-t"
                    : ""
                : "";

              return (
                <div
                  key={i}
                  className={`${bgClass} rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] px-[22px] py-4 transition-all duration-300 ${
                    isRevealed ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-[42px] h-[42px] rounded-xl border-2 border-stroke flex items-center justify-center font-m text-sm font-bold shrink-0 ${
                        isRevealed ? "bg-white" : "bg-bg"
                      }`}
                    >
                      {m.initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-b text-[15px] font-bold ${
                            isRevealed ? "" : "text-[#AAA]"
                          }`}
                        >
                          {m.name}
                        </span>
                        {isRevealed && (
                          <span className="font-m text-xs font-bold text-[#5A5A64]">
                            {m.record}
                          </span>
                        )}
                      </div>
                      {isRevealed ? (
                        <div className={`font-b text-[13px] mt-1 ${textColor} opacity-70`}>
                          {m.bet}
                        </div>
                      ) : (
                        <div className="font-m text-[11px] text-[#AAA] mt-1">
                          Sealed ●
                        </div>
                      )}
                    </div>
                    {isRevealed && m.result && (
                      <Pill
                        bg={
                          m.result === "delivered"
                            ? "bg-green text-stroke"
                            : m.result === "missed"
                              ? "bg-red text-white"
                              : "bg-yellow"
                        }
                      >
                        {m.result.toUpperCase()}
                      </Pill>
                    )}
                    {isRevealed && !m.result && (
                      <Pill bg="bg-bg">NO CHECK-IN</Pill>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {dropState !== "wait" && (
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-xl border-[2.5px] border-stroke bg-white font-b font-bold text-sm px-6 py-3 shadow-[4px_4px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A] cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
