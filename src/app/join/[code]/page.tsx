import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import SignInButton from "@/components/sign-in-button";

// Invite link landing: kizu.app/join/<CODE>.
// Signed out → a PUBLIC "you're invited" page (and crawlable link-preview
// tags), one tap into Google OAuth and back here. Signed in → auto-join → feed.
// The page only reveals the group's name, and only to holders of the code —
// the same thing the invite message itself already told them.

async function groupByCode(code: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("groups").select("id, name, color").eq("invite_code", code.toUpperCase()).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const group = await groupByCode(code);
  // the layout's title template appends "· kizu"
  const title = group ? `you're invited to ${group.name.toLowerCase()}` : "you're invited";
  return { title, description: "a private taste space for you and your people." };
}

export default async function JoinByCode({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const group = await groupByCode(code);

  const user = await getCurrentUser();

  if (user) {
    if (!group) redirect("/groups/new?error=badcode");
    const admin = createAdminClient();
    const { count } = await admin
      .from("group_members").select("*", { count: "exact", head: true }).eq("user_id", user.id);
    await admin.from("group_members").upsert(
      { group_id: group.id, user_id: user.id, is_home: (count ?? 0) === 0 },
      { onConflict: "group_id,user_id", ignoreDuplicates: true }
    );
    redirect("/home");
  }

  // signed out → the invite, readable before any wall.
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-7">
          <span className="font-h text-3xl font-extrabold tracking-[-0.05em]">kizu<span className="text-red">.</span></span>
        </div>
        {group ? (
          <div className="bg-surface rounded-[22px] border-[2.5px] border-frame p-8 text-center" style={{ boxShadow: `8px 8px 0 ${group.color}` }}>
            <div className="font-m text-[11px] tracking-widest uppercase text-muted">you&apos;re invited to</div>
            <h1 className="font-h text-4xl font-extrabold tracking-[-0.04em] mt-2 break-words">{group.name.toLowerCase()}</h1>
            <p className="font-b text-sm text-muted mt-3 leading-snug">
              a private taste space. the movies, music, and places your people love, in one spot.
            </p>
            <SignInButton
              next={`/join/${code.toUpperCase()}`}
              className="mt-7 w-full font-h font-extrabold text-[15px] bg-vibe text-white border-[2.5px] border-frame rounded-full py-3 shadow-[4px_4px_0_#0D0B09] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-transform"
            >
              enter the space
            </SignInButton>
            <p className="font-m text-[10px] text-muted mt-4">no download · works in your browser</p>
          </div>
        ) : (
          <div className="bg-surface rounded-[22px] border-[2.5px] border-frame p-8 text-center shadow-[8px_8px_0_#0D0B09]">
            <h1 className="font-h text-2xl font-extrabold tracking-[-0.03em]">this invite isn&apos;t a thing.</h1>
            <p className="font-b text-sm text-muted mt-2">the code may be mistyped. ask your person to send it again.</p>
            <Link href="/" className="inline-block mt-6 font-h font-bold text-sm bg-surface-2 border-[1.5px] border-hair rounded-full px-6 py-2.5">
              what&apos;s kizu?
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
