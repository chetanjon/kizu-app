import { cache } from "react";
import { createClient } from "@/lib/supabase-server";

// Per-request memoized auth + membership lookups. The (app) layout and the page
// it renders run in the SAME request, so wrapping these in React's cache() means
// they share ONE network round-trip instead of one each — the layout's auth
// guard no longer doubles the cost of every tab navigation.

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export type Membership = {
  group_id: string;
  is_home: boolean;
  groups: { id: string; name: string; color: string; invite_code: string } | null;
};

export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("name, gender")
    .eq("id", userId)
    .maybeSingle();
  return (data ?? { name: null, gender: null }) as { name: string | null; gender: string | null };
});

export const getMemberships = cache(async (userId: string): Promise<Membership[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select("group_id, is_home, groups(id, name, color, invite_code)")
    .eq("user_id", userId);
  return (data ?? []) as unknown as Membership[];
});
