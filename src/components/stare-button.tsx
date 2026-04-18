"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  toUser: string;
  podId: string;
  alreadySent: boolean;
};

export function StareButton({ toUser, podId, alreadySent }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  const disabled = alreadySent || isPending;

  const handleClick = async () => {
    if (disabled) return;
    setError(false);
    const res = await fetch("/api/stares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUser, podId }),
    });
    if (!res.ok) {
      setError(true);
      return;
    }
    startTransition(() => router.refresh());
  };

  const base =
    "font-m text-[10px] font-bold px-2.5 py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] transition-all duration-[120ms]";

  if (alreadySent) {
    return (
      <span className={`${base} bg-pink text-pink-t opacity-60`}>
        STARED
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${base} cursor-pointer ${
        error ? "bg-red text-white" : "bg-white hover:bg-pink hover:text-pink-t"
      } hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed`}
      title="Send a Stare (once per person per week)"
    >
      {isPending ? "..." : error ? "ERROR" : "STARE"}
    </button>
  );
}
