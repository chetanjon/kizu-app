"use client";

import { useEffect, useRef, useState, useTransition } from "react";
// Parent passes a `key={existing?.id ?? "new"}` so this component remounts
// when the underlying comment row changes (after router.refresh()), avoiding
// the setState-in-effect anti-pattern.
import { useRouter } from "next/navigation";

const MAX = 200;

export type ExistingComment = {
  id: string;
  body: string;
  updated_at: string;
} | null;

const sanitize = (s: string) => s.replace(/[\r\n]+/g, " ");

export function CommentComposer({
  postId,
  existing,
}: {
  postId: string;
  existing: ExistingComment;
}) {
  const router = useRouter();
  const [mine, setMine] = useState<ExistingComment>(existing);
  const [editing, setEditing] = useState(existing === null);
  const [body, setBody] = useState(existing?.body ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(120, ta.scrollHeight)}px`;
  }, [body, editing]);

  const submit = () => {
    const cleaned = sanitize(body).trim();
    if (cleaned.length === 0 || cleaned.length > MAX) {
      setError(`1–${MAX} chars.`);
      return;
    }
    setError("");

    startTransition(async () => {
      let res: Response;
      if (mine) {
        res = await fetch("/api/comments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: mine.id, body: cleaned }),
        });
      } else {
        res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: postId, body: cleaned }),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "could not save.");
        return;
      }
      setMine(data.comment);
      setBody(data.comment.body);
      setEditing(false);
      router.refresh();
    });
  };

  const remove = () => {
    if (!mine) return;
    if (!confirm("delete your comment?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/comments?id=${mine.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "could not delete.");
        return;
      }
      setMine(null);
      setBody("");
      setEditing(true);
      router.refresh();
    });
  };

  if (!editing && mine) {
    return (
      <div className="mt-4 flex items-start gap-2 rounded-xl border-2 border-stroke bg-yellow shadow-[2px_2px_0_#1A1A1A] px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="font-m text-[10px] font-bold text-yellow-t opacity-60 tracking-[0.08em] mb-0.5">
            YOUR COMMENT
          </div>
          <p className="font-b text-[13px] text-yellow-t leading-snug break-words">
            {mine.body}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            onClick={() => setEditing(true)}
            className="font-m text-[10px] font-bold text-yellow-t hover:underline cursor-pointer"
          >
            edit
          </button>
          <button
            onClick={remove}
            disabled={pending}
            className="font-m text-[10px] font-bold text-yellow-t opacity-70 hover:underline cursor-pointer"
          >
            delete
          </button>
        </div>
      </div>
    );
  }

  const remaining = MAX - sanitize(body).trim().length;

  return (
    <div className="mt-4">
      <div className="rounded-xl border-2 border-stroke bg-white shadow-[2px_2px_0_#1A1A1A] px-3 py-2.5">
        <textarea
          ref={taRef}
          value={body}
          onChange={(e) => setBody(sanitize(e.target.value).slice(0, MAX))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={mine ? "edit your comment…" : "say one thing."}
          maxLength={MAX}
          rows={1}
          className="w-full resize-none bg-transparent font-b text-[13px] leading-snug outline-none placeholder:text-[#AAA]"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="font-m text-[10px] text-[#AAA]">
            {remaining} left · enter to post
          </span>
          <div className="flex items-center gap-2">
            {mine && (
              <button
                onClick={() => {
                  setBody(mine.body);
                  setEditing(false);
                  setError("");
                }}
                className="font-m text-[10px] font-bold text-[#888] hover:underline cursor-pointer"
              >
                cancel
              </button>
            )}
            <button
              onClick={submit}
              disabled={pending || sanitize(body).trim().length === 0}
              className={`rounded-lg border-2 border-stroke font-b font-bold text-[11px] px-3 py-1 transition-all duration-[120ms] cursor-pointer ${
                pending || sanitize(body).trim().length === 0
                  ? "bg-[#DDD] text-[#888] shadow-none"
                  : "bg-yellow text-yellow-t shadow-[2px_2px_0_#1A1A1A] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#1A1A1A]"
              }`}
            >
              {pending ? "…" : mine ? "save" : "post"}
            </button>
          </div>
        </div>
      </div>
      {error && (
        <div className="font-m text-[11px] text-pink-t bg-pink rounded-lg border-2 border-stroke px-3 py-1.5 mt-2">
          {error}
        </div>
      )}
    </div>
  );
}
