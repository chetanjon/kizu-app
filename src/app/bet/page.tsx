"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Pill } from "@/components/ui";

const AVATAR_COLORS = ["bg-lime", "bg-blue", "bg-pink", "bg-purple", "bg-orange"];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function PlaceBet() {
  const router = useRouter();
  const [members, setMembers] = useState<
    { id: string; name: string; initials: string; color: string }[]
  >([]);
  const [podId, setPodId] = useState("");
  const [weekNum, setWeekNum] = useState(1);
  const [myName, setMyName] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [goalText, setGoalText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [alreadyBet, setAlreadyBet] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's pod
      const { data: membership } = await supabase
        .from("pod_members")
        .select("pod_id, pods(id, name, created_at)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) return;

      // Get user's name
      const { data: userData } = await supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single();
      setMyName(userData?.name?.split(" ")[0] || "You");

      const pod = membership.pods as unknown as { id: string; name: string; created_at: string };
      setPodId(pod.id);

      const created = new Date(pod.created_at);
      const diff = Date.now() - created.getTime();
      setWeekNum(Math.max(1, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))));

      // Get pod members (excluding current user)
      const { data: podMembers } = await supabase
        .from("pod_members")
        .select("user_id, users(id, name)")
        .eq("pod_id", pod.id);

      const others = (podMembers || [])
        .filter((pm) => pm.user_id !== user.id)
        .map((pm, i) => {
          const u = pm.users as unknown as { id: string; name: string };
          return {
            id: u.id,
            name: u.name,
            initials: getInitials(u.name),
            color: AVATAR_COLORS[i % AVATAR_COLORS.length],
          };
        });
      setMembers(others);

      // Check if already bet this week
      const now = new Date();
      const day = now.getDay();
      const d = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.getFullYear(), now.getMonth(), d);
      const weekStart = monday.toISOString().split("T")[0];

      const { data: existingBet } = await supabase
        .from("bets")
        .select("id")
        .eq("user_id", user.id)
        .eq("pod_id", pod.id)
        .eq("week_start", weekStart)
        .limit(1);

      if (existingBet && existingBet.length > 0) {
        setAlreadyBet(true);
      }

      setLoading(false);
    }
    load();
  }, []);

  const handleSubmit = async () => {
    if (!selected || !goalText.trim()) return;
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/bets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goalText: goalText.trim(),
        directedAt: selected,
        podId,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="font-h text-xl font-bold">Loading...</div>
      </div>
    );
  }

  if (alreadyBet) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="max-w-[500px] w-full">
          <div className="bg-lime rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8 text-center">
            <div className="font-h text-2xl font-black text-lime-t mb-2">
              Bet already placed.
            </div>
            <p className="font-b text-sm text-lime-t opacity-60 mb-6">
              You already made your bet this week. Come back next Monday.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-xl border-[2.5px] border-stroke bg-white font-b font-bold text-sm px-6 py-3 shadow-[4px_4px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A] cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="max-w-[640px] w-full py-12">
        <Pill bg="bg-yellow">WEEK {weekNum}</Pill>
        <h1 className="font-h text-[clamp(36px,5vw,52px)] font-black tracking-[-0.04em] leading-[0.95] mt-4">
          Call your
          <br />
          shot.
        </h1>
        <p className="font-b text-[15px] text-[#888] mt-3 mb-3">
          Write one goal for this week. Pick who you&apos;re betting to — if you fail, they set your goal next week.
        </p>

        {/* Dynamic preview */}
        {selected && goalText.trim() && (
          <div className="bg-yellow rounded-xl border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] px-4 py-3 mb-8">
            <p className="font-b text-sm text-yellow-t">
              <span className="font-bold">{myName}</span> bets{" "}
              <span className="font-bold">{members.find((m) => m.id === selected)?.name.split(" ")[0]}</span>{" "}
              they&apos;ll{" "}
              <span className="italic">&ldquo;{goalText.trim()}&rdquo;</span>
            </p>
          </div>
        )}
        {!selected || !goalText.trim() ? <div className="mb-8" /> : null}

        {/* Member selector */}
        <div className="font-m text-[11px] font-bold text-[#7A7A7A] tracking-[0.08em] mb-1.5">
          WHO ARE YOU BETTING TO?
        </div>
        <p className="font-b text-xs text-[#AAA] mb-3.5">
          If you miss, this person sets your goal next week.
        </p>
        <div className="flex gap-[18px] mb-10">
          {members.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelected(m.id)}
              className="text-center cursor-pointer transition-transform duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px]"
            >
              <div
                className={`w-14 h-14 rounded-xl border-2 border-stroke flex items-center justify-center font-m text-sm font-bold mx-auto ${
                  selected === m.id ? m.color : "bg-bg"
                }`}
              >
                {m.initials}
              </div>
              <div
                className={`font-b text-xs mt-2 ${
                  selected === m.id ? "font-bold" : "text-[#888]"
                }`}
              >
                {m.name.split(" ")[0]}
              </div>
            </div>
          ))}
        </div>

        {/* Goal textarea */}
        <div className="font-m text-[11px] font-bold text-[#7A7A7A] tracking-[0.08em] mb-3.5">
          YOUR GOAL THIS WEEK
        </div>
        <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] overflow-hidden mb-3">
          <textarea
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder={`e.g. "Send 5 cold emails to hiring managers"`}
            className="w-full min-h-[150px] px-[22px] py-5 bg-transparent border-none font-b text-base leading-[1.7] resize-none outline-none placeholder:text-[#CCC]"
          />
        </div>
        <p className="font-m text-[10px] text-[#AAA] mb-7">
          This goes on your Receipt Wall. Forever.
        </p>

        {error && (
          <div className="bg-pink rounded-xl border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] px-4 py-3 font-b text-sm text-pink-t mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selected || !goalText.trim() || submitting}
          className={`rounded-xl border-[2.5px] border-stroke font-b font-bold text-[15px] px-9 py-3.5 transition-all duration-[120ms] cursor-pointer ${
            selected && goalText.trim() && !submitting
              ? "bg-yellow text-yellow-t shadow-[4px_4px_0_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A]"
              : "bg-[#AAA] text-[#666] shadow-none"
          }`}
        >
          {submitting ? "Placing..." : "Place bet →"}
        </button>
      </div>
    </div>
  );
}
