import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/bottom-nav";

// Shell for the signed-in app: auth guard once, persistent bottom nav.
// Each destination page still fetches its own data (active group, items, etc).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mem } = await supabase
    .from("group_members").select("group_id").eq("user_id", user.id).limit(1);
  if (!mem || mem.length === 0) redirect("/groups/new");

  return (
    <div className="min-h-screen bg-paper">
      <div className="pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}
