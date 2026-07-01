import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import TonightDealer from "@/components/tonight-dealer";
import { buildPeoplePool } from "@/lib/tonight-pool";

const LENSES = ["watch", "listen", "go_out", "all"] as const;
type Lens = (typeof LENSES)[number];

export default async function Tonight({ searchParams }: { searchParams: Promise<{ lens?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const lensParam = (await searchParams)?.lens;
  const initialLens = (LENSES as readonly string[]).includes(lensParam ?? "") ? (lensParam as Lens) : null;
  const supabase = await createClient();

  const { data: mRaw } = await supabase
    .from("group_members").select("group_id, is_home").eq("user_id", user.id);
  const memberships = (mRaw ?? []) as { group_id: string; is_home: boolean }[];
  if (memberships.length === 0) redirect("/groups/new");
  const active = memberships.find((m) => m.is_home) ?? memberships[0];

  const pool = await buildPeoplePool(user.id, active.group_id);
  const { data: me } = await supabase.from("users").select("music_app").eq("id", user.id).maybeSingle();

  return (
    <main className="max-w-[480px] mx-auto px-6 py-10">
      <div className="font-m text-[11px] tracking-widest uppercase text-muted">{new Date().toLocaleDateString(undefined, { weekday: "long" })}</div>
      <h1 className="font-h text-4xl font-extrabold tracking-[-0.04em] mt-1 leading-[1.02]">what are you<br />up for <span className="text-vibe">tonight?</span></h1>
      <TonightDealer pool={pool} musicApp={me?.music_app ?? null} initialLens={initialLens} />
    </main>
  );
}
