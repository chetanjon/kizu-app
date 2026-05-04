"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/ui";

const PALETTE: { hex: string; label: string }[] = [
  { hex: "#FFE15D", label: "yellow" },
  { hex: "#C8F05A", label: "lime" },
  { hex: "#FF8FAB", label: "pink" },
  { hex: "#7EB8FF", label: "blue" },
  { hex: "#FFA052", label: "orange" },
  { hex: "#B89AFF", label: "purple" },
  { hex: "#FF6B6B", label: "red" },
  { hex: "#5ADB8A", label: "green" },
];

const ICONS = ["◆", "●", "▲", "★", "✦", "✺", "❖", "◯", "□", "▼", "◐", "◑"];

const today = () => new Date().toISOString().slice(0, 10);

export default function CreatePack() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [colorA, setColorA] = useState(PALETTE[0].hex);
  const [colorB, setColorB] = useState(PALETTE[2].hex);
  const [icon, setIcon] = useState(ICONS[0]);
  const [foundingDate, setFoundingDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [pack, setPack] = useState<{
    id: string;
    name: string;
    invite_code: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    if (colorA === colorB) {
      setError("pick two different colors.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/packs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        color_a: colorA,
        color_b: colorB,
        icon,
        founding_date: foundingDate,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "something went wrong.");
      return;
    }

    setPack(data.pack);
  };

  const inviteLink = pack
    ? `${window.location.origin}/join/${pack.invite_code}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (pack) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="w-full max-w-[480px]">
          <div className="bg-lime rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8">
            <Pill bg="bg-white">PACK CREATED</Pill>
            <h1 className="font-h text-3xl font-black tracking-[-0.03em] mt-4 mb-1">
              {pack.name}
            </h1>
            <p className="font-b text-sm text-lime-t opacity-60 mb-6">
              share this code with your people. up to 20.
            </p>

            <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[3px_3px_0_#1A1A1A] p-6 text-center mb-4">
              <div className="font-m text-[10px] font-bold text-[#888] tracking-[0.1em] mb-2">
                INVITE CODE
              </div>
              <div className="font-m text-5xl font-bold tracking-[0.15em] leading-none">
                {pack.invite_code}
              </div>
            </div>

            <div className="bg-white rounded-xl border-[2.5px] border-stroke shadow-[3px_3px_0_#1A1A1A] px-4 py-3 flex items-center justify-between gap-3 mb-6">
              <span className="font-m text-xs text-[#666] truncate">
                {inviteLink}
              </span>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-lg border-2 border-stroke bg-yellow font-b font-bold text-xs px-3 py-1.5 shadow-[2px_2px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#1A1A1A] cursor-pointer"
              >
                {copied ? "copied." : "copy"}
              </button>
            </div>

            <button
              onClick={() => router.push("/wall")}
              className="w-full rounded-xl border-[2.5px] border-stroke bg-yellow text-yellow-t font-b font-bold text-base px-6 py-3.5 shadow-[4px_4px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A] cursor-pointer"
            >
              go to your wall →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-10">
          <h1 className="font-h text-5xl font-black tracking-[-0.04em]">
            kizu
          </h1>
        </div>

        <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8">
          <h2 className="font-h text-2xl font-black tracking-[-0.03em] mb-2">
            name your pack
          </h2>
          <p className="font-b text-sm text-[#888] mb-6 leading-relaxed">
            5 to 20 people. the ones you actually want around.
          </p>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. brooklyn coven"
            maxLength={40}
            className="w-full rounded-xl border-[2.5px] border-stroke bg-white font-b text-[15px] px-4 py-3.5 shadow-[3px_3px_0_#1A1A1A] outline-none focus:bg-[#FFFDF0] transition-colors placeholder:text-[#CCC] mb-2"
          />
          <div className="font-m text-[10px] text-[#AAA] mb-6">
            {name.length}/40
          </div>

          <div className="font-m text-[10px] font-bold text-[#888] tracking-[0.1em] mb-3">
            COLORS — PICK TWO
          </div>
          <div className="grid grid-cols-8 gap-2 mb-6">
            {PALETTE.map(({ hex, label }) => {
              const role =
                colorA === hex ? "A" : colorB === hex ? "B" : null;
              return (
                <button
                  key={hex}
                  type="button"
                  aria-label={label}
                  onClick={() => {
                    if (role === "A") return;
                    if (role === "B") {
                      setColorB(colorA);
                      setColorA(hex);
                      return;
                    }
                    setColorB(colorA);
                    setColorA(hex);
                  }}
                  style={{ backgroundColor: hex }}
                  className={`h-10 rounded-lg border-[2.5px] border-stroke shadow-[2px_2px_0_#1A1A1A] flex items-center justify-center font-m text-[11px] font-bold cursor-pointer ${
                    role
                      ? "translate-x-[-1px] translate-y-[-1px] shadow-[3px_3px_0_#1A1A1A]"
                      : ""
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>

          <div className="font-m text-[10px] font-bold text-[#888] tracking-[0.1em] mb-3">
            ICON
          </div>
          <div className="grid grid-cols-6 gap-2 mb-6">
            {ICONS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setIcon(g)}
                className={`h-10 rounded-lg border-[2.5px] border-stroke font-h font-black text-lg cursor-pointer ${
                  icon === g
                    ? "bg-yellow text-yellow-t shadow-[3px_3px_0_#1A1A1A] translate-x-[-1px] translate-y-[-1px]"
                    : "bg-white shadow-[2px_2px_0_#1A1A1A]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="font-m text-[10px] font-bold text-[#888] tracking-[0.1em] mb-3">
            FOUNDING DATE
          </div>
          <input
            type="date"
            value={foundingDate}
            onChange={(e) => setFoundingDate(e.target.value)}
            max={today()}
            className="w-full rounded-xl border-[2.5px] border-stroke bg-white font-m text-[14px] px-4 py-3 shadow-[3px_3px_0_#1A1A1A] outline-none mb-6"
          />

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
            {loading ? "creating..." : "create pack →"}
          </button>
        </div>
      </div>
    </div>
  );
}
