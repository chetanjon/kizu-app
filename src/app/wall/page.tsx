import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { InviteButton } from "@/components/invite-button";
import { CommentList, type CommentRow } from "@/components/comment-list";
import { CommentComposer } from "@/components/comment-composer";
import { PostDeleteButton } from "@/components/post-delete-button";
import { Avatar } from "@/components/ui";
import {
  avatarBgFor,
  initialsOf,
  relativeTime,
} from "@/lib/format";

type Membership = {
  is_home: boolean;
  pack: {
    id: string;
    name: string;
    invite_code: string;
    color_a: string;
    color_b: string;
    icon: string;
    founding_date: string;
  } | null;
};

type PostRow = {
  id: string;
  kind: "photo" | "receipt";
  image_url: string;
  local_date: string;
  created_at: string;
  author_id: string;
  author: { id: string; name: string | null; avatar_url: string | null } | null;
  comments: CommentRow[];
};

const SIGN_TTL = 60 * 30;

export default async function Wall({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/wall");

  const { data } = await supabase
    .from("pack_members")
    .select(
      "is_home, pack:packs(id, name, invite_code, color_a, color_b, icon, founding_date)"
    )
    .eq("user_id", user.id)
    .order("is_home", { ascending: false });

  const memberships = ((data ?? []) as unknown as Membership[]).filter(
    (m) => m.pack
  );

  if (memberships.length === 0) redirect("/create-pack");

  const { pack: packParam } = await searchParams;
  const current =
    memberships.find((m) => m.pack!.id === packParam) ??
    memberships.find((m) => m.is_home) ??
    memberships[0];
  const pack = current.pack!;

  const { data: postsRaw } = await supabase
    .from("posts")
    .select(
      "id, kind, image_url, local_date, created_at, author_id, author:users(id, name, avatar_url), comments(id, body, author_id, updated_at, author:users(id, name, avatar_url))"
    )
    .eq("pack_id", pack.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const posts = (postsRaw ?? []) as unknown as PostRow[];

  const signedByPath: Record<string, string> = {};
  if (posts.length > 0) {
    const paths = posts.map((p) => p.image_url);
    const { data: signed } = await supabase.storage
      .from("posts")
      .createSignedUrls(paths, SIGN_TTL);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) signedByPath[s.path] = s.signedUrl;
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <nav className="border-b-[2.5px] border-stroke bg-bg sticky top-0 z-10">
        <div className="max-w-[900px] mx-auto px-6 flex justify-between items-center h-16">
          <span className="font-h text-2xl font-black tracking-[-0.03em]">
            kizu
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/post"
              className="rounded-lg border-[2.5px] border-stroke bg-yellow text-yellow-t font-b font-bold text-sm px-4 py-2 shadow-[3px_3px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#1A1A1A] no-underline"
            >
              + witness
            </Link>
            <Link
              href="/packs"
              className="font-m text-[10px] text-[#AAA] hover:text-stroke transition-colors no-underline"
            >
              packs
            </Link>
            <Link
              href="/settings"
              className="font-m text-[10px] text-[#AAA] hover:text-stroke transition-colors no-underline"
            >
              settings
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-[900px] mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="inline-block w-7 h-7 rounded-md border-2 border-stroke"
              style={{ backgroundColor: pack.color_a }}
            />
            <span className="font-h text-3xl font-black">{pack.icon}</span>
            <span
              className="inline-block w-7 h-7 rounded-md border-2 border-stroke"
              style={{ backgroundColor: pack.color_b }}
            />
            <h1 className="font-h text-3xl font-black tracking-[-0.03em] ml-2">
              {pack.name}
            </h1>
          </div>
          <div className="font-m text-[11px] text-[#888] tracking-[0.08em] mb-4">
            FOUNDED {pack.founding_date} · CODE {pack.invite_code}
          </div>
          <InviteButton inviteCode={pack.invite_code} />
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-10 text-center">
            <div className="font-h text-2xl font-black tracking-[-0.03em] mb-2">
              nothing yet.
            </div>
            <p className="font-b text-sm text-[#888] mb-1">
              that&apos;s not nothing.
            </p>
            <Link
              href="/post"
              className="inline-block mt-6 rounded-xl border-[2.5px] border-stroke bg-yellow text-yellow-t font-b font-bold text-sm px-6 py-3 shadow-[4px_4px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A] no-underline"
            >
              witness something →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => {
              const myComment =
                post.comments.find((c) => c.author_id === user.id) ?? null;
              const others = post.comments.filter(
                (c) => c.author_id !== user.id
              );
              const src = signedByPath[post.image_url];
              const authorName = post.author?.name ?? "someone";
              return (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-5"
                >
                  <header className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        initials={initialsOf(authorName)}
                        bg={avatarBgFor(post.author?.id ?? post.id)}
                        size="small"
                      />
                      <div>
                        <div className="font-b text-sm font-bold leading-tight">
                          {authorName}
                        </div>
                        <div className="font-m text-[10px] text-[#999] tracking-[0.05em]">
                          {post.kind.toUpperCase()} ·{" "}
                          {relativeTime(post.created_at)}
                        </div>
                      </div>
                    </div>
                    {post.author_id === user.id && (
                      <PostDeleteButton postId={post.id} />
                    )}
                  </header>

                  {src ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={src}
                      alt={`${post.kind} from ${authorName}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full rounded-xl border-[2.5px] border-stroke shadow-[3px_3px_0_#1A1A1A] max-h-[600px] object-contain bg-bg"
                    />
                  ) : (
                    <div className="w-full h-40 rounded-xl border-[2.5px] border-stroke bg-bg flex items-center justify-center font-m text-[11px] text-[#999]">
                      image unavailable
                    </div>
                  )}

                  <CommentList
                    comments={others}
                    currentUserId={user.id}
                  />
                  <CommentComposer
                    key={myComment?.id ?? `new-${post.id}`}
                    postId={post.id}
                    existing={
                      myComment
                        ? {
                            id: myComment.id,
                            body: myComment.body,
                            updated_at: myComment.updated_at,
                          }
                        : null
                    }
                  />
                </article>
              );
            })}
          </div>
        )}

        {memberships.length > 1 && (
          <div className="mt-10">
            <div className="font-m text-[10px] font-bold text-[#888] tracking-[0.1em] mb-3">
              YOUR PACKS
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
              {memberships.map((m) => {
                const isCurrent = m.pack!.id === pack.id;
                return (
                  <Link
                    key={m.pack!.id}
                    href={`/wall?pack=${m.pack!.id}`}
                    className={`rounded-2xl border-[2.5px] border-stroke p-5 transition-all duration-150 no-underline ${
                      isCurrent
                        ? "bg-yellow shadow-[5px_5px_0_#1A1A1A] translate-x-[-2px] translate-y-[-2px]"
                        : "bg-white shadow-[3px_3px_0_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#1A1A1A]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="inline-block w-4 h-4 rounded-sm border-2 border-stroke"
                        style={{ backgroundColor: m.pack!.color_a }}
                      />
                      <span className="font-h text-lg font-black">
                        {m.pack!.icon}
                      </span>
                      <span
                        className="inline-block w-4 h-4 rounded-sm border-2 border-stroke"
                        style={{ backgroundColor: m.pack!.color_b }}
                      />
                    </div>
                    <div className="font-h font-extrabold tracking-[-0.02em]">
                      {m.pack!.name}
                    </div>
                    {m.is_home && (
                      <div className="font-m text-[9px] font-bold text-[#888] tracking-[0.08em] mt-1">
                        HOME
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
