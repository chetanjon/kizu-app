"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/ui";

export default function CreatePod() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pod, setPod] = useState<{
    id: string;
    name: string;
    invite_code: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/pods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setPod(data.pod);
  };

  const inviteLink = pod
    ? `${window.location.origin}/join/${pod.invite_code}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Success state
  if (pod) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="w-full max-w-[480px]">
          <div className="bg-lime rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8">
            <Pill bg="bg-white">POD CREATED</Pill>
            <h1 className="font-h text-3xl font-black tracking-[-0.03em] mt-4 mb-1">
              {pod.name}
            </h1>
            <p className="font-b text-sm text-lime-t opacity-60 mb-6">
              Share this code with your crew. 3-5 people max.
            </p>

            {/* Invite code display */}
            <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[3px_3px_0_#1A1A1A] p-6 text-center mb-4">
              <div className="font-m text-[10px] font-bold text-[#888] tracking-[0.1em] mb-2">
                INVITE CODE
              </div>
              <div className="font-m text-5xl font-bold tracking-[0.15em] leading-none">
                {pod.invite_code}
              </div>
            </div>

            {/* Invite link */}
            <div className="bg-white rounded-xl border-[2.5px] border-stroke shadow-[3px_3px_0_#1A1A1A] px-4 py-3 flex items-center justify-between gap-3 mb-6">
              <span className="font-m text-xs text-[#666] truncate">
                {inviteLink}
              </span>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-lg border-2 border-stroke bg-yellow font-b font-bold text-xs px-3 py-1.5 shadow-[2px_2px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#1A1A1A] cursor-pointer"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Go to dashboard */}
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full rounded-xl border-[2.5px] border-stroke bg-yellow text-yellow-t font-b font-bold text-base px-6 py-3.5 shadow-[4px_4px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A] cursor-pointer"
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-[480px]">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-h text-5xl font-black tracking-[-0.04em]">
            Kizu
          </h1>
        </div>

        <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8">
          <h2 className="font-h text-2xl font-black tracking-[-0.03em] mb-2">
            Name your pod
          </h2>
          <p className="font-b text-sm text-[#888] mb-6 leading-relaxed">
            Your pod is your crew. 3-5 people. No hiding.
          </p>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Job Hunt Sprint"
            maxLength={30}
            className="w-full rounded-xl border-[2.5px] border-stroke bg-white font-b text-[15px] px-4 py-3.5 shadow-[3px_3px_0_#1A1A1A] outline-none focus:bg-[#FFFDF0] transition-colors placeholder:text-[#CCC] mb-2"
          />
          <div className="font-m text-[10px] text-[#AAA] mb-6">
            {name.length}/30 characters
          </div>

          {error && (
            <div className="bg-pink rounded-xl border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] px-4 py-3 font-b text-sm text-pink-t mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className={`w-full rounded-xl border-[2.5px] border-stroke font-b font-bold text-base px-6 py-3.5 transition-all duration-[120ms] cursor-pointer ${
              !name.trim() || loading
                ? "bg-[#AAA] text-[#666] shadow-none"
                : "bg-yellow text-yellow-t shadow-[4px_4px_0_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A]"
            }`}
          >
            {loading ? "Creating..." : "Create Pod →"}
          </button>
        </div>
      </div>
    </div>
  );
}
