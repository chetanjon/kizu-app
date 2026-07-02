import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import CurateAdmin from "@/components/curate-admin";

// Founder-only Wizard-of-Oz tool: hand-enter real people's picks (with consent).
export default async function AdminCuratePage() {
  const user = await getCurrentUser();
  if (!user || !process.env.FOUNDER_EMAIL || user.email !== process.env.FOUNDER_EMAIL) {
    notFound();
  }
  return (
    <div className="min-h-screen bg-paper px-6 py-10">
      <CurateAdmin />
    </div>
  );
}
