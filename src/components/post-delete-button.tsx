"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function PostDeleteButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (
      !confirm(
        "delete this post? the image and any comments on it go with it."
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/posts?id=${postId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "could not delete.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={remove}
        disabled={pending}
        className="font-m text-[10px] text-[#AAA] hover:text-pink-t transition-colors cursor-pointer disabled:opacity-40"
      >
        {pending ? "…" : "delete"}
      </button>
      {error && (
        <span className="font-m text-[10px] text-pink-t mt-1">{error}</span>
      )}
    </div>
  );
}
