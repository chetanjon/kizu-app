"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  packId: string;
  packName: string;
  inviteCode: string;
  isHome: boolean;
  membershipCount: number;
};

export function PackActions({
  packId,
  packName,
  inviteCode,
  isHome,
  membershipCount,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setError("clipboard blocked");
    }
  };

  const onSwitchHome = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/packs/membership", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_id: packId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "failed to switch");
        return;
      }
      router.refresh();
    });
  };

  const onLeave = () => {
    const lastPack = membershipCount === 1;
    const confirmation = lastPack
      ? `leave ${packName}? this is your only pack — you will see an empty wall until you create or join another.`
      : `leave ${packName}? your posts stay with the pack but you lose access to the feed.`;
    if (!window.confirm(confirmation)) return;

    setError(null);
    startTransition(async () => {
      const res = await fetch(
        `/api/packs/membership?pack_id=${encodeURIComponent(packId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "failed to leave");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <code className="font-m text-xs font-bold tracking-[0.16em] uppercase px-3 py-2 rounded-lg border-[2.5px] border-stroke bg-bg flex-1 text-center">
          {inviteCode}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="font-m text-[10px] font-bold tracking-[0.08em] uppercase px-3 py-2 rounded-lg border-[2.5px] border-stroke bg-white shadow-[3px_3px_0_#1A1A1A] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_#1A1A1A] transition-transform"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {!isHome && (
          <button
            type="button"
            onClick={onSwitchHome}
            disabled={pending}
            className="font-m text-[10px] font-bold tracking-[0.08em] uppercase px-3 py-2 rounded-lg border-[2.5px] border-stroke bg-yellow text-yellow-t shadow-[3px_3px_0_#1A1A1A] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_#1A1A1A] transition-transform disabled:opacity-60"
          >
            make home
          </button>
        )}
        <button
          type="button"
          onClick={onLeave}
          disabled={pending}
          className="font-m text-[10px] font-bold tracking-[0.08em] uppercase px-3 py-2 rounded-lg border-[2.5px] border-stroke bg-white text-[#888] hover:text-stroke hover:bg-bg transition-colors disabled:opacity-60"
        >
          leave
        </button>
      </div>

      {error && (
        <div className="font-m text-[10px] text-[#B00020]">{error}</div>
      )}
    </div>
  );
}
