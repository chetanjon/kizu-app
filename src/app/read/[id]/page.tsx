import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-admin";
import VibeCard, { type Read } from "@/components/vibe-card";

// The weekly read's landing page. The Friday ritual notification opens THIS —
// the specific stored read — and it's the same URL for every group member.
// Membership-gated; a non-member gets notFound (don't leak that it exists).
export default async function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/read/${id}`);

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("vibe_reads")
    .select("group_id, card_data, generated_at")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();

  const { data: mem } = await admin
    .from("group_members")
    .select("group_id")
    .eq("group_id", row.group_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mem) notFound();

  const read = row.card_data as unknown as Read;

  return (
    <main className="max-w-[480px] mx-auto px-5 py-10">
      <div className="font-m text-[11px] tracking-[0.16em] uppercase text-muted">this week&apos;s read</div>
      <h1 className="font-h text-[22px] font-black tracking-[-0.035em] mt-1 mb-6 leading-none">good taste ran in the group.</h1>
      <VibeCard read={read} />
      <Link href="/home" className="mt-6 inline-block font-h font-bold text-sm text-muted hover:text-ink">← back to home</Link>
    </main>
  );
}
