import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";
import RecCard from "@/components/rec-card";
import { TYPE, img, title, sub, ratingMark, type DropType } from "@/lib/item-render";
import { signPhotos } from "@/lib/drop-photos";

// Public, no-wall rec page. Reads the rec by EXACT token via the service-role
// client (no broad public RLS on recs) — so a single shared item is visible
// pre-signup, but nothing else leaks.
export default async function RecPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data: rec } = await admin
    .from("recs")
    .select("id, from_user, item_id, items!recs_item_id_fkey(type, data, note, rating_value), from:users!recs_from_user_fkey(name)")
    .eq("token", token)
    .maybeSingle();
  if (!rec || !rec.items) notFound();

  await signPhotos(admin, [rec], (r) => (r as { items?: { data?: Record<string, unknown> } }).items?.data);

  const item = rec.items as unknown as { type: DropType; data: Record<string, unknown>; note: string | null; rating_value: string | null };
  const fromName = (rec.from as unknown as { name: string | null } | null)?.name ?? "someone";

  // is the viewer signed in? (and not the sender)
  const user = await getCurrentUser();
  const signedIn = !!user;
  const isSender = user?.id === rec.from_user;

  const t = TYPE[item.type];
  const cover = img({ type: item.type, data: item.data });

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-5">
          <span className="font-h text-3xl font-extrabold tracking-[-0.05em]">kizu<span className="text-red">.</span></span>
        </div>
        <div className="bg-surface border-[3px] border-frame rounded-[24px] overflow-hidden shadow-[8px_8px_0_#0D0B09]">
          <div className="aspect-[3/2] relative border-b-[3px] border-frame" style={{ background: cover ? undefined : t.color }}>
            {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
            <span className="absolute top-3 left-3 font-m text-[10px] font-bold border-[2px] border-white text-white rounded px-2 py-0.5">{t.label}</span>
            {item.rating_value && <span className="glass absolute left-3 bottom-3 text-white font-m text-xs font-bold rounded-md px-2 py-0.5 border border-white/40">{ratingMark(item.rating_value)}</span>}
          </div>
          <div className="p-5">
            <div className="font-m text-[11px] text-vibe font-bold">{fromName.toLowerCase()} sent you this</div>
            <h1 className="font-h text-2xl font-extrabold tracking-[-0.03em] mt-1 leading-tight">{title({ type: item.type, data: item.data })}</h1>
            {sub({ type: item.type, data: item.data }) && <div className="font-m text-[11px] text-muted mt-0.5">{sub({ type: item.type, data: item.data })}</div>}
            {item.note && <p className="text-[15px] mt-3 italic leading-snug">&ldquo;{item.note}&rdquo;</p>}

            <div className="mt-5">
              <RecCard token={token} signedIn={signedIn} isSender={isSender} />
            </div>
          </div>
        </div>
        <p className="text-center font-m text-[11px] text-muted mt-5">good taste runs in the group.</p>
      </div>
    </div>
  );
}
