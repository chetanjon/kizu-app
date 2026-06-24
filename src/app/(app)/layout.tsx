import { redirect } from "next/navigation";
import { getCurrentUser, getMemberships } from "@/lib/auth";
import BottomNav from "@/components/bottom-nav";

// Shell for the signed-in app: auth guard once, persistent bottom nav.
// getCurrentUser/getMemberships are request-memoized, so the page rendered
// inside this layout reuses the same calls (no double round-trip per tab).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const mem = await getMemberships(user.id);
  if (mem.length === 0) redirect("/groups/new");

  return (
    <div className="min-h-screen bg-paper">
      <div className="pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}
