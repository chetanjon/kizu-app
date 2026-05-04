import { Avatar } from "@/components/ui";
import { avatarBgFor, initialsOf, relativeTime } from "@/lib/format";

export type CommentRow = {
  id: string;
  body: string;
  author_id: string;
  updated_at: string;
  author: { id: string; name: string | null; avatar_url: string | null } | null;
};

export function CommentList({
  comments,
  currentUserId,
}: {
  comments: CommentRow[];
  currentUserId: string;
}) {
  if (comments.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2.5 mt-4">
      {comments.map((c) => {
        const mine = c.author_id === currentUserId;
        const name = c.author?.name ?? "someone";
        return (
          <li
            key={c.id}
            className={`flex items-start gap-2.5 rounded-xl border-2 border-stroke px-3 py-2.5 ${
              mine ? "bg-yellow shadow-[2px_2px_0_#1A1A1A]" : "bg-bg"
            }`}
          >
            <Avatar
              initials={initialsOf(name)}
              bg={avatarBgFor(c.author?.id ?? c.id)}
              size="small"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-b text-[12px] font-bold leading-tight">
                  {name}
                </span>
                <span className="font-m text-[10px] text-[#999]">
                  {relativeTime(c.updated_at)}
                </span>
              </div>
              <p className="font-b text-[13px] leading-snug break-words">
                {c.body}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
