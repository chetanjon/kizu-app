import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase-admin";
import { ARCHIVO_800, SPACEMONO_400 } from "./og-fonts";

// The invite's link-preview card: "you're invited to <group>" in the brand,
// with the group's accent color as the hard shadow, plus the invite code as a
// quiet mono ticket-stub — the photo alone carries everything a friend needs.
// Kickers/micro-labels are Space Mono (font-m), matching the in-app type
// system; Jakarta read as off-brand here. Falls back to the generic wording
// when the code doesn't resolve. Only reveals the group NAME + code, and only
// to holders of the invite link — same as the message it travels in.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "you're invited · kizu";

// slice to the exact bytes — .buffer alone can be a larger pooled ArrayBuffer
const font = (b64: string): ArrayBuffer => {
  const b = Buffer.from(b64, "base64");
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};

export default async function InviteImage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  // a transient DB failure must not 500 the preview — fall back to generic wording
  let group: { name: string; color: string } | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("groups").select("name, color").eq("invite_code", code.toUpperCase()).maybeSingle();
    group = data;
  } catch {
    group = null;
  }

  const archivo = font(ARCHIVO_800);
  const mono = font(SPACEMONO_400);

  const name = (group?.name ?? "the group").toLowerCase();
  const shadow = group?.color ?? "#7C5CE6";
  const inviteCode = group ? code.toUpperCase() : null;
  // long group names shrink instead of clipping (40 chars max in the db)
  const nameSize = name.length > 22 ? 64 : name.length > 13 ? 88 : 110;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#16130E",
          backgroundImage: "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(124,92,230,0.35), rgba(22,19,14,0) 70%)",
          padding: "80px",
          fontFamily: "Archivo",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            border: "6px solid #EDE3CE",
            borderRadius: "28px",
            background: "#1B1610",
            boxShadow: `16px 16px 0 ${shadow}`,
            padding: "64px 72px",
          }}
        >
          <div style={{ fontFamily: "SpaceMono", fontSize: 26, letterSpacing: "8px", color: "#A98BFF" }}>
            YOU&apos;RE INVITED TO
          </div>
          <div style={{ fontSize: nameSize, fontWeight: 800, letterSpacing: "-4px", color: "#F6F1EA", marginTop: 12, maxWidth: 950 }}>
            {name}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 44 }}>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-2px", color: "#F6F1EA", display: "flex" }}>
                kizu<span style={{ color: "#FF3B5C" }}>.</span>
              </div>
              <div style={{ fontFamily: "SpaceMono", fontSize: 22, color: "#948D7F", marginLeft: 20 }}>
                good taste runs in the group.
              </div>
            </div>
            {inviteCode && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontFamily: "SpaceMono",
                  fontSize: 24,
                  letterSpacing: "4px",
                  color: "#C7BEB0",
                  border: "2px solid rgba(255,255,255,0.18)",
                  borderRadius: "999px",
                  padding: "10px 26px",
                }}
              >
                {inviteCode}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: archivo, weight: 800, style: "normal" },
        { name: "SpaceMono", data: mono, weight: 400, style: "normal" },
      ],
    }
  );
}
