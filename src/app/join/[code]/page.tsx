"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/ui";

export default function JoinPod({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();

  const [state, setState] = useState<"loading" | "confirm" | "error" | "joining" | "done">("loading");
  const [pod, setPod] = useState<{ id: string; name: string } | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    async function lookupPod() {
      const res = await fetch(`/api/pods/join?code=${code}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Pod not found");
        setState("error");
        return;
      }

      if (data.alreadyMember) {
        router.push("/dashboard");
        return;
      }

      setPod(data.pod);
      setMemberCount(data.memberCount);
      setState("confirm");
    }

    lookupPod();
  }, [code, router]);

  const handleJoin = async () => {
    setState("joining");

    const res = await fetch("/api/pods/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to join");
      setState("error");
      return;
    }

    setState("done");
    setTimeout(() => router.push("/dashboard"), 1000);
  };

  // Loading
  if (state === "loading") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="font-h text-2xl font-black mb-2">Looking up pod...</div>
          <div className="font-m text-[11px] text-[#AAA]">CODE: {code.toUpperCase()}</div>
        </div>
      </div>
    );
  }

  // Error
  if (state === "error") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="w-full max-w-[420px]">
          <div className="bg-pink rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8 text-center">
            <div className="font-h text-2xl font-black text-pink-t mb-2">
              {error}
            </div>
            <p className="font-b text-sm text-pink-t opacity-60 mb-6">
              Check the invite link and try again.
            </p>
            <button
              onClick={() => router.push("/")}
              className="rounded-xl border-[2.5px] border-stroke bg-white font-b font-bold text-sm px-6 py-3 shadow-[4px_4px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A] cursor-pointer"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Done
  if (state === "done") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="bg-lime rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8 text-center">
          <div className="font-h text-3xl font-black text-lime-t">
            You&apos;re in.
          </div>
          <div className="font-b text-sm text-lime-t opacity-60 mt-2">
            Redirecting to dashboard...
          </div>
        </div>
      </div>
    );
  }

  // Confirm join
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <h1 className="font-h text-5xl font-black tracking-[-0.04em]">
            Kizu
          </h1>
        </div>

        <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8 text-center">
          <Pill bg="bg-yellow">INVITE</Pill>
          <h2 className="font-h text-2xl font-black tracking-[-0.03em] mt-4 mb-1">
            Join {pod?.name}?
          </h2>
          <p className="font-b text-sm text-[#888] mb-2">
            {memberCount}/5 members
          </p>
          <p className="font-b text-xs text-[#AAA] mb-8 leading-relaxed">
            One goal per week. Direct it at someone. If you miss, they set your goal next week.
          </p>

          <button
            onClick={handleJoin}
            disabled={state === "joining"}
            className={`w-full rounded-xl border-[2.5px] border-stroke font-b font-bold text-base px-6 py-3.5 transition-all duration-[120ms] cursor-pointer ${
              state === "joining"
                ? "bg-[#AAA] text-[#666] shadow-none"
                : "bg-lime text-lime-t shadow-[4px_4px_0_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A]"
            }`}
          >
            {state === "joining" ? "Joining..." : "Join Pod →"}
          </button>
        </div>
      </div>
    </div>
  );
}
