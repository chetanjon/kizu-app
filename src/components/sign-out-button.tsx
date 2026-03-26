"use client";

import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <button
      onClick={handleSignOut}
      className="font-m text-[10px] text-[#AAA] hover:text-stroke transition-colors cursor-pointer"
    >
      Sign out
    </button>
  );
}
