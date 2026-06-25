import { redirect } from "next/navigation";
import { getCurrentUser, getMemberships, getProfile } from "@/lib/auth";
import AppNav from "@/components/app-nav";

// Shell for the signed-in app: auth guard once, persistent sticky top nav.
// getCurrentUser/getMemberships/getProfile are request-memoized, so the page
// rendered inside this layout reuses the same calls (no double round-trip).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [mem, profile] = await Promise.all([getMemberships(user.id), getProfile(user.id)]);
  if (mem.length === 0) redirect("/groups/new");

  return (
    <div className="min-h-screen bg-paper">
      <div className="pb-24">{children}</div>
      <AppNav gender={profile.gender} />
    </div>
  );
}
