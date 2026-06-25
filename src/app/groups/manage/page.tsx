import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getMemberships } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import GroupSettingsForm from "@/components/group-settings-form";
import LeaveGroupButton from "@/components/leave-group-button";

// Settings for the active group: rename (creator), invite code, members, leave.
export default async function ManageGroup() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const memberships = await getMemberships(user.id);
  if (memberships.length === 0) redirect("/groups/new");
  const active = memberships.find((m) => m.is_home) ?? memberships[0];
  const g = active.groups!;

  const supabase = await createClient();
  const { data: groupRow } = await supabase.from("groups").select("created_by").eq("id", g.id).maybeSingle();
  const isCreator = groupRow?.created_by === user.id;

  const { data: memberRows } = await supabase
    .from("group_members").select("user_id, users(name)").eq("group_id", g.id);
  const members = (memberRows ?? []) as unknown as { user_id: string; users: { name: string | null } | null }[];

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center gap-3 px-6 h-16 border-b-[2px] border-ink">
        <Link href="/home" className="font-m text-sm font-bold">← back</Link>
        <span className="font-h text-xl font-extrabold tracking-[-0.05em]">manage group</span>
      </header>
      <main className="max-w-[560px] mx-auto px-6 py-8 flex flex-col gap-8">
        <section>
          <div className="font-m text-[10px] font-bold tracking-widest uppercase text-muted mb-3">name &amp; color</div>
          <GroupSettingsForm groupId={g.id} name={g.name} color={g.color} isCreator={isCreator} />
        </section>

        <section>
          <div className="font-m text-[10px] font-bold tracking-widest uppercase text-muted mb-2">invite code</div>
          <div className="font-h font-extrabold text-2xl tracking-wide">{g.invite_code}</div>
          <div className="font-m text-[11px] text-muted mt-1">share <b>/join/{g.invite_code}</b></div>
        </section>

        <section>
          <div className="font-m text-[10px] font-bold tracking-widest uppercase text-muted mb-3">members · {members.length}</div>
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-2 bg-surface border-[2px] border-ink rounded-xl px-3 py-2.5">
                <span className="font-b font-semibold text-sm">{(m.users?.name || "someone").toLowerCase()}</span>
                {m.user_id === user.id && <span className="font-m text-[10px] text-muted">you</span>}
                {m.user_id === groupRow?.created_by && <span className="ml-auto font-m text-[10px] font-bold text-vibe">founder</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="pt-2 border-t-[2px] border-hair">
          <LeaveGroupButton groupId={g.id} groupName={g.name} />
        </section>
      </main>
    </div>
  );
}
