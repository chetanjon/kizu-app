"use client";

import { useState } from "react";

export function InviteButton({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const link = `${window.location.origin}/join/${inviteCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full mt-2.5 rounded-lg border-2 border-stroke bg-yellow font-b font-bold text-[11px] px-3 py-2 shadow-[2px_2px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#1A1A1A] cursor-pointer text-yellow-t"
    >
      {copied ? "Link copied!" : "Invite friends →"}
    </button>
  );
}
