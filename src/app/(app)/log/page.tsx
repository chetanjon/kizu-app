import { createClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { signPhotos } from "@/lib/drop-photos";
import type { DropType } from "@/lib/item-render";
import LogDeck, { type DeckCard } from "@/components/log-deck";

type Raw = {
  id: string; type: DropType; data: Record<string, unknown>;
  rating_value: string | null; note: string | null; private: boolean; created_at: string;
};

// Your log — everything YOU'VE logged, browsed as a deck one card at a time.
// Nothing here is anyone else's entry.
export default async function Log() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("items")
    .select("id, type, data, rating_value, note, private, created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const items = (raw ?? []) as unknown as Raw[];
  await signPhotos(createAdminClient(), items, (it) => it.data);

  const cards: DeckCard[] = items.map((it) => ({
    id: it.id, type: it.type, data: it.data ?? {},
    rating: it.rating_value, note: it.note, shared: !it.private, date: it.created_at,
  }));

  return (
    <main className="pt-6">
      <LogDeck cards={cards} />
    </main>
  );
}
