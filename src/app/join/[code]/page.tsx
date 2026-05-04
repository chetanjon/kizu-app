"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/ui";

type Pack = {
  id: string;
  name: string;
  color_a: string;
  color_b: string;
  icon: string;
};

export default function JoinPack({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();

  const [state, setState] = useState<
    "loading" | "confirm" | "error" | "joining" | "done"
  >("loading");
  const [pack, setPack] = useState<Pack | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [setHome, setSetHome] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function lookupPack() {
      const res = await fetch(`/api/packs/join?code=${code}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "pack not found");
        setState("error");
        return;
      }

      if (data.alreadyMember) {
        router.push("/wall");
        return;
      }

      setPack(data.pack);
      setMemberCount(data.memberCount);
      setState("confirm");
    }

    lookupPack();
  }, [code, router]);

  const handleJoin = async () => {
    setState("joining");

    const res = await fetch("/api/packs/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, set_home: setHome }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "failed to join.");
      setState("error");
      return;
    }

    setState("done");
    setTimeout(() => router.push("/wall"), 1000);
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="font-h text-2xl font-black mb-2">looking up pack…</div>
          <div className="font-m text-[11px] text-[#AAA]">
            CODE: {code.toUpperCase()}
          </div>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="w-full max-w-[420px]">
          <div className="bg-pink rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8 text-center">
            <div className="font-h text-2xl font-black text-pink-t mb-2">
              {error}
            </div>
            <p className="font-b text-sm text-pink-t opacity-60 mb-6">
              the link may be wrong, or the pack is full.
            </p>
            <button
              onClick={() => router.push("/")}
              className="rounded-xl border-[2.5px] border-stroke bg-white font-b font-bold text-sm px-6 py-3 shadow-[4px_4px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A] cursor-pointer"
            >
              go home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="bg-lime rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8 text-center">
          <div className="font-h text-3xl font-black text-lime-t">
            you&apos;re in.
          </div>
          <div className="font-b text-sm text-lime-t opacity-60 mt-2">
            taking you to the wall…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <h1 className="font-h text-5xl font-black tracking-[-0.04em]">kizu</h1>
        </div>

        <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8 text-center">
          <Pill bg="bg-yellow">INVITE</Pill>

          {pack && (
            <div className="flex items-center justify-center gap-2 mt-5 mb-1">
              <span
                className="inline-block w-6 h-6 rounded-md border-2 border-stroke"
                style={{ backgroundColor: pack.color_a }}
              />
              <span className="font-h text-3xl font-black tracking-[-0.03em]">
                {pack.icon}
              </span>
              <span
                className="inline-block w-6 h-6 rounded-md border-2 border-stroke"
                style={{ backgroundColor: pack.color_b }}
              />
            </div>
          )}

          <h2 className="font-h text-2xl font-black tracking-[-0.03em] mb-1">
            join {pack?.name}?
          </h2>
          <p className="font-b text-sm text-[#888] mb-6">
            {memberCount}/20 members
          </p>

          <label className="flex items-start gap-3 text-left mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={setHome}
              onChange={(e) => setSetHome(e.target.checked)}
              className="mt-1 w-5 h-5 border-2 border-stroke cursor-pointer"
            />
            <span className="font-b text-xs text-[#555] leading-relaxed">
              make this my home pack. only one home pack at a time — this will
              demote your current one.
            </span>
          </label>

          <button
            onClick={handleJoin}
            disabled={state === "joining"}
            className={`w-full rounded-xl border-[2.5px] border-stroke font-b font-bold text-base px-6 py-3.5 transition-all duration-[120ms] cursor-pointer ${
              state === "joining"
                ? "bg-[#AAA] text-[#666] shadow-none"
                : "bg-lime text-lime-t shadow-[4px_4px_0_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A]"
            }`}
          >
            {state === "joining" ? "joining…" : "join pack →"}
          </button>
        </div>
      </div>
    </div>
  );
}
