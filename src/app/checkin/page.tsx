"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Pill } from "@/components/ui";

export default function CheckIn() {
  const router = useRouter();
  const [bet, setBet] = useState<{ id: string; goal_text: string } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [noBet, setNoBet] = useState(false);

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
        .select("pod_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) return;

      // Get current week's bet
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.getFullYear(), now.getMonth(), diff);
      const weekStart = monday.toISOString().split("T")[0];

      const { data: betData } = await supabase
        .from("bets")
        .select("id, goal_text")
        .eq("user_id", user.id)
        .eq("pod_id", membership.pod_id)
        .eq("week_start", weekStart)
        .limit(1)
        .single();

      if (!betData) {
        setNoBet(true);
        setLoading(false);
        return;
      }

      setBet(betData);

      // Check if already checked in
      const { data: existing } = await supabase
        .from("checkins")
        .select("id")
        .eq("bet_id", betData.id)
        .limit(1);

      if (existing && existing.length > 0) {
        setAlreadyCheckedIn(true);
      }

      setLoading(false);
    }
    load();
  }, []);

  const handleSubmit = async () => {
    if (!bet || !result) return;
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ betId: bet.id, result }),
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

  if (noBet) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="max-w-[500px] w-full">
          <div className="bg-yellow rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8 text-center">
            <div className="font-h text-2xl font-black text-yellow-t mb-2">
              No bet this week.
            </div>
            <p className="font-b text-sm text-yellow-t opacity-60 mb-6">
              Place a bet first before checking in.
            </p>
            <button
              onClick={() => router.push("/bet")}
              className="rounded-xl border-[2.5px] border-stroke bg-white font-b font-bold text-sm px-6 py-3 shadow-[4px_4px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A] cursor-pointer"
            >
              Place Bet →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (alreadyCheckedIn) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="max-w-[500px] w-full">
          <div className="bg-lime rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8 text-center">
            <div className="font-h text-2xl font-black text-lime-t mb-2">
              Already sealed.
            </div>
            <p className="font-b text-sm text-lime-t opacity-60 mb-6">
              Your check-in is locked. Results reveal at sunset on Sunday.
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

  const results = [
    { id: "delivered", label: "Delivered", sub: "Nailed it", activeBg: "bg-lime", activeText: "text-lime-t" },
    { id: "halfway", label: "Halfway", sub: "Partial", activeBg: "bg-yellow", activeText: "text-yellow-t" },
    { id: "missed", label: "Missed", sub: "Didn\u2019t make it", activeBg: "bg-pink", activeText: "text-pink-t" },
  ];

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="max-w-[640px] w-full py-12">
        <h1 className="font-h text-[38px] font-black tracking-[-0.03em] mb-7">
          Check in
        </h1>

        {/* Your bet card */}
        <div className="bg-yellow rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] px-[22px] py-5 mb-7">
          <div className="font-m text-[10px] font-bold text-yellow-t opacity-45 tracking-[0.08em] mb-1.5">
            YOUR BET
          </div>
          <div className="font-h text-lg font-bold text-yellow-t leading-[1.25]">
            {bet?.goal_text}
          </div>
        </div>

        {/* Result selector */}
        <div className="font-m text-[11px] font-bold text-[#7A7A7A] tracking-[0.08em] mb-3.5">
          RESULT
        </div>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {results.map((r) => (
            <div
              key={r.id}
              onClick={() => setResult(r.id)}
              className={`rounded-2xl border-[2.5px] border-stroke px-3.5 py-[22px] text-center cursor-pointer transition-all duration-150 ${
                result === r.id
                  ? `${r.activeBg} shadow-[6px_6px_0_#1A1A1A] translate-x-[-2px] translate-y-[-2px]`
                  : "bg-white shadow-[4px_4px_0_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A]"
              }`}
            >
              <div
                className={`font-h text-[17px] font-extrabold ${
                  result === r.id ? "" : "text-[#888]"
                }`}
              >
                {r.label}
              </div>
              <div
                className={`font-b text-[11px] mt-1 ${
                  result === r.id ? "opacity-60" : "text-[#AAA]"
                }`}
              >
                {r.sub}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-pink rounded-xl border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] px-4 py-3 font-b text-sm text-pink-t mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!result || submitting}
          className={`rounded-xl border-[2.5px] border-stroke font-b font-bold text-[15px] px-9 py-3.5 transition-all duration-[120ms] cursor-pointer ${
            result && !submitting
              ? "bg-lime text-lime-t shadow-[4px_4px_0_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A]"
              : "bg-[#AAA] text-[#666] shadow-none"
          }`}
        >
          {submitting ? "Sealing..." : "Submit — sealed until sunset"}
        </button>
      </div>
    </div>
  );
}
