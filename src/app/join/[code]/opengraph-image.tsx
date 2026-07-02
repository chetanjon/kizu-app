import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase-admin";
import { ARCHIVO_800, JAKARTA_500 } from "./og-fonts";

// The invite's link-preview card: "you're invited to <group>" in the brand,
// with the group's accent color as the hard shadow. Falls back to the generic
// wording when the code doesn't resolve. Only reveals the group NAME, and only
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
  const jakarta = font(JAKARTA_500);

  const name = (group?.name ?? "the group").toLowerCase();
  const shadow = group?.color ?? "#7C5CE6";
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
          <div style={{ fontFamily: "Jakarta", fontSize: 30, letterSpacing: "6px", color: "#A98BFF" }}>
            YOU&apos;RE INVITED TO
          </div>
          <div style={{ fontSize: nameSize, fontWeight: 800, letterSpacing: "-4px", color: "#F6F1EA", marginTop: 12, maxWidth: 950 }}>
            {name}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: 40 }}>
            <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-2px", color: "#F6F1EA", display: "flex" }}>
              kizu<span style={{ color: "#FF3B5C" }}>.</span>
            </div>
            <div style={{ fontFamily: "Jakarta", fontSize: 28, color: "#C7BEB0", marginLeft: 20 }}>
              good taste runs in the group.
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: archivo, weight: 800, style: "normal" },
        { name: "Jakarta", data: jakarta, weight: 500, style: "normal" },
      ],
    }
  );
}
