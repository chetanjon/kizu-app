import AppNav from "@/components/app-nav";

// throwaway: renders the real bottom nav with no auth so we can eyeball the glyphs
export default function ZNav() {
  return (
    <div className="min-h-screen bg-paper">
      <AppNav />
    </div>
  );
}
